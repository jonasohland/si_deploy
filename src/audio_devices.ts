import EventEmitter from 'events';
import {IpcNetConnectOpts} from 'net';
import io from 'socket.io'

import * as IPC from './ipc'
import * as Logger from './log'
import {SocketAndInstance} from './server'
import { SIDSPNode } from './instance';
import WebInterface from './web_interface';
import { Requester, Connection, Message } from './communication';
import { NodeModule, ManagedNodeStateMapRegister, ManagedNodeStateObject, ManagedNodeStateObjectData, ServerModule } from './data';
import { DSPNode } from './dsp_node';

const log = Logger.get('AUDDEV');

export interface Channel {
    i: number;
    name: string;
}

export interface ChannelList {
    inputs: Channel[], outputs: Channel[]
}

export interface NodeAndChannels {
    id: string;
    name: string;
    channels: ChannelList;
}
export interface Status {
    open: boolean, enabled: boolean
}

export class AudioDeviceConfiguration {
    samplerate: number    = 48000;
    buffersize: number    = 1024;
    input_device: string  = '';
    output_device: string = '';
    in : number           = 32;
    out: number           = 32;
}

export interface NodeAudioDevicesInformation {

    nodename: string, id: string;

    options: {
        audioIns: string[],
        audioOuts: string[],
        samplerates: number[],
        buffersizes: number[]
    };

    dspUse: number;
    latency: number;

    audioOutputDevice: string;
    audioInputDevice: string;

    samplerate: number;
    buffersize: number;

    dsp_on: boolean;
    device_open: boolean;
}

export class Manager {

    remote: Requester;
    dsp: Requester;

    input_devices: any[]  = [];
    output_devices: any[] = [];

    ich_names: string[] = [];
    och_names: string[] = [];

    config: AudioDeviceConfiguration = new AudioDeviceConfiguration();
    status: NodeAudioDevicesInformation;

    channel_list_cache: ChannelList;
    channel_list_fresh: boolean = false;

    constructor(con: Connection)
    {
        this.remote = con.getRequester('devmgmt');
        this.dsp    = con.getRequester('dsp');

        let self = this;
    }

    async refresh()
    {
        let devices = await this.remote.request('device-list');

        this.input_devices  = (<any>devices.data).inputs;
        this.output_devices = (<any>devices.data).outputs;

        let input_device  = await this.remote.request('input-device');
        let output_device = await this.remote.request('output-device');

        if (input_device.data && (<string>input_device.data).length)
            this.config.input_device = <string>input_device.data;

        if (output_device.data && (<string>output_device.data).length)
            this.config.output_device = <string>output_device.data;

        if (this.config.input_device.length
            && this.config.output_device.length) {
            let channels = await this.remote.request('device-channels');
            console.log(channels);
        }

        let is_open     = await this.isOpen();
        let dsp_enabled = (await this.dsp.request('is-enabled')).data;

        let srate = (await this.remote.request('samplerate')).data;
        let bsize = (await this.remote.request('buffersize')).data;

        this.config.buffersize = <number>bsize;
        this.config.samplerate = <number>srate;

        this.status = {

            nodename : 'unknown',
            id : 'unknown',

            audioInputDevice : this.config.input_device,
            audioOutputDevice : this.config.output_device,
            samplerate : this.config.samplerate,
            buffersize : this.config.buffersize,

            options : {
                audioIns : this.input_devices,
                audioOuts : this.output_devices,
                buffersizes : [ 32, 64, 128, 256, 512, 1024 ],
                samplerates : [ 44100, 48000 ]
            },

            dspUse : 0,
            latency : 0,

            device_open : is_open ? true : false,
            dsp_on : (dsp_enabled) ? true : false
        }
    }

    async refreshDSPLoad()
    {
        this.status.dspUse
            = <number>(await this.remote.request('dsp-load')).data;
    }

    async setConfig()
    {
        this.channel_list_fresh = false;
        await this.refresh();
        await this.remote.set('samplerate', this.config.samplerate);
        await this.remote.set('buffersize', this.config.buffersize);
        await this.remote.set('input-device', this.config.input_device);
        await this.remote.set('output-device', this.config.output_device);
    }

    async setInputDevice(dev: string)
    {
        this.channel_list_fresh = false;
        return this.remote.set('input-device', dev);
    }

    async setOutputDevice(dev: string)
    {
        this.channel_list_fresh = false;
        return this.remote.set('output-device', dev);
    }

    async setSamplerate(rate: number)
    {
        let was_open = await this.isOpen();

        if (was_open)
            await this.close();

        let ret = await this.remote.set('samplerate', rate);

        if (was_open)
            await this.open();

        return ret;
    }

    async setBuffersize(size: number)
    {
        let was_open = await this.isOpen();

        if (was_open)
            await this.close();

        let ret = await this.remote.set('buffersize', size);

        if (was_open)
            await this.open();

        return ret;
    }

    async open()
    {
        this.channel_list_fresh = false;
        return this.remote.set('open', true);
    }

    async close()
    {
        this.channel_list_fresh = false;
        return this.remote.set('open', false);
    }

    async isOpen()
    {
        let is_open = await this.remote.request('open');
        return is_open.data ? true : false;
    }

    async enable()
    {
        return this.dsp.set('is-enabled', true);
    }

    async disable()
    {
        return this.dsp.set('is-enabled', false);
    }

    async isEnabled()
    {
        return this.dsp.request('is-enabled');
    }

    async getChannelList()
    {
        if (this.channel_list_fresh)
            return this.channel_list_cache;

        let channels = <{ inputs : string[], outputs : string[] }>(
                           await this.remote.request('device-channels'))
                           .data;

        channels.inputs = <any>channels.inputs.map((ch, i) => {
            return {
                name: ch, i: i
            }
        });

        channels.outputs = <any>channels.outputs.map((ch, i) => {
            return {
                name: ch, i: i
            }
        });

        this.channel_list_cache = <ChannelList><unknown>channels;

        this.channel_list_fresh = true;

        return <ChannelList><unknown>channels;
    }
}

export class AudioDeviceManager extends EventEmitter {

    webif: io.Server;
    instances: SIDSPNode[];

    constructor(server: WebInterface, instances: SIDSPNode[])
    {
        super();

        let self       = this;
        this.instances = instances;

        server.io.on('connection', (socket: io.Socket) => {
            socket.on('audiosettings.update',
                      this.handleUpdateRequest.bind(self, socket));

            socket.on('audiosettings.inputdevice.set',
                      (node: string, device: string) => {
                          log.info('New input device requested for node ' + node
                                   + ': ' + device);

                          self.instances.find(ins => ins.name == node)
                              .devices.setInputDevice(device)
                              .then(() => {
                                  console.log('device set.');
                                  socket.emit('audiosettings.operation.done');
                              });
                      });

            socket.on('audiosettings.outputdevice.set',
                      (node: string, device: string) => {
                          log.info('New output device requested for node '
                                   + node + ': ' + device);
                          self.instances.find(ins => ins.name == node)
                              .devices.setOutputDevice(device)
                              .then(() => {
                                  socket.emit('audiosettings.operation.done');
                              });
                      });

            socket.on('audiosettings.buffersize.set',
                      (node: string, buffersize: number) => {
                          log.info('New buffersize requested for node ' + node
                                   + ': ' + buffersize);
                          self.instances.find(ins => ins.name == node)
                              .devices.setBuffersize(buffersize)
                              .then(() => {
                                  socket.emit('audiosettings.operation.done');
                              });
                      });

            socket.on('audiosettings.samplerate.set',
                      (node: string, samplerate: number) => {
                          log.info('New samplerate requested for node ' + node
                                   + ': ' + samplerate);
                          self.instances.find(ins => ins.name == node)
                              .devices.setSamplerate(samplerate)
                              .then(() => {
                                  socket.emit('audiosettings.operation.done');
                              });
                      });

            socket.on('audiosettings.dsp.enabled', (node: string,
                                                    is_enabled: boolean) => {
                log.info('Setting new DSP Status for node ' + node + ':'
                         + ((is_enabled) ? 'enabled' : 'disabled'));

                const confirm = (msg: Message) => {
                    socket.emit('audiosettings.operation.done');
                };
                const do_catch = (err: Error) => {
                    log.error(err);
                };

                if (is_enabled)
                    self.instances.find(ins => ins.name == node)
                        .devices.enable()
                        .then(confirm)
                        .catch(do_catch);
                else
                    self.instances.find(ins => ins.name == node)
                        .devices.disable()
                        .then(confirm)
                        .catch(do_catch);
            });

            socket.on('audiosettings.device.open', (node: string,
                                                    is_open: boolean) => {
                log.info('Setting device open status for node ' + node + ':'
                         + ((is_open) ? 'enabled' : 'disabled'));

                const confirm = (msg: Message) => {
                    socket.emit('audiosettings.operation.done');
                };
                const do_catch = (err: Error) => {
                    log.error(err);
                };

                if (is_open)
                    self.instances.find(ins => ins.name == node)
                        .devices.open()
                        .then(confirm)
                        .catch(do_catch);
                else
                    self.instances.find(ins => ins.name == node)
                        .devices.close()
                        .then(confirm)
                        .catch(do_catch);
            });

            socket.on('audiosettings.dspuse',
                      () => { this.instances.forEach(ins => {
                          ins.devices.refreshDSPLoad()
                              .then(() => {
                                  socket.emit('audiosettings.dspuse', {
                                      id : ins.id,
                                      value : ins.devices.status.dspUse
                                  });
                              })
                              .catch(err => log.error(err));
                      }) });
        });
    }

    handleUpdateRequest(socket: io.Socket)
    {
        log.info('Refreshing audio device data')

            this.refreshAllDevices()
                .then((data) => {
                    socket.emit('audiosettings.update.done', data);
                })
                .catch(err => log.error(err));
    }

    async refreshAllDevices()
    {
        await Promise.all(
            this.instances.map(ins => ins.devices.refresh()))

        return this.instances.map(ins => {
            console.log(ins.name);

            let status      = ins.devices.status;
            status.nodename = ins.name;
            status.id       = ins.id;

            return status;
        });
    }

    async getAllChannelLists()
    {
        return Promise.all(this.instances.map(async function(ins) {
            return <NodeAndChannels>
            {
                id: ins.id, name: ins.name,
                    channels: await ins.devices.getChannelList()
            }
        }));
    }
}

export class NodeSelectedAudioDeviceSettings extends ManagedNodeStateObject<[string, string]> {

    input: string;
    output: string;
    controller: NodeAudioDevices;

    constructor(ctrl: NodeAudioDevices, input: string, output: string)
    {
        super();
        this.controller = ctrl;
        this.input = input;
        this.output = output;
    }

    async set(val: any) {
        this.input = val[0];
        this.output = val[1];
    }
    async get() {
        return <[string, string]> [this.input, this.output];
    }

    async apply()
    {

    }
}

export class NodePlaybackSettings extends ManagedNodeStateObject<[number, number]> {
    
    srate: number;
    buffersize: number;
    controller: NodeAudioDevices;

    constructor(controller: NodeAudioDevices, srate: number, bufsize: number) {
        super();
        this.controller = controller;
        this.srate = srate;
        this.buffersize = bufsize;
    }
    
    async set(val: [number, number]) {
        this.srate = val[0];
        this.buffersize = val[1];
    }

    async get() {
        return <[number, number]> [this.srate, this.buffersize];
    }

    async apply()
    {

    }

}

export class NodeAudioDeviceSettings extends ManagedNodeStateMapRegister {

    controller: NodeAudioDevices;

    constructor(ctrl: NodeAudioDevices)
    {
        super();
        this.controller = ctrl;
    }

    hasSettings()
    {
        return (this._objects["io-devices"] != null) && (this._objects["playback-settings"] != null)
    }

    default()
    {
        log.verbose("Construct default audio device settings");
        this.add("io-devices", new NodeSelectedAudioDeviceSettings(this.controller, "", ""));
        this.add("playback-settings", new NodePlaybackSettings(this.controller, 48000, 512));
    }
    
    async remove(name: string, obj: ManagedNodeStateObject<any>) {
        switch(name) {

        }
    }

    async insert(name: string, obj: ManagedNodeStateObjectData) {

        switch(name) {
            case "io-devices":
                return new NodeSelectedAudioDeviceSettings(this.controller, obj.data[0], obj.data[1]);
            case "playback-settings":
                return new NodePlaybackSettings(this.controller, obj.data[0], obj.data[1]);
        }

        return null;
    }
    
} 

export class NodeAudioDevices extends NodeModule {

    _devmgmt: Requester;
    _dsp: Requester;
    _settings: NodeAudioDeviceSettings;

    _chlis_valid: boolean = false;
    _chlist_cached: ChannelList;

    _idev_list: any[]  = [];
    _odev_list: any[] = [];

    _is_open: boolean = false;
    _is_enabled: boolean = false;

    _config: AudioDeviceConfiguration = new AudioDeviceConfiguration();

    async refresh()
    {

        let devices = await this._devmgmt.request('device-list');

        this._idev_list  = (<any>devices.data).inputs;
        this._odev_list = (<any>devices.data).outputs;

        let input_device  = await this._devmgmt.request('input-device');
        let output_device = await this._devmgmt.request('output-device');

        if (input_device.data && (<string>input_device.data).length)
            this._config.input_device = <string>input_device.data;

        if (output_device.data && (<string>output_device.data).length)
            this._config.output_device = <string>output_device.data;

        if (this._config.input_device.length
            && this._config.output_device.length) {
            let channels = await this._devmgmt.request('device-channels');
            console.log(channels);
        }

        let is_open     = await this.isOpen();
        let dsp_enabled = (await this._dsp.request('is-enabled')).data;

        let srate = (await this._devmgmt.request('samplerate')).data;
        let bsize = (await this._devmgmt.request('buffersize')).data;

        this._config.buffersize = <number>bsize;
        this._config.samplerate = <number>srate;

        this.writeSettingsToDB();
    }

    async getNodeDevicesInformation(): Promise<NodeAudioDevicesInformation>
    {  
        await this.refresh();
        return {

            nodename: this._parent.name(),
            id: this._parent.id(),

            options: {
                audioIns: this._idev_list,
                audioOuts: this._odev_list,
                buffersizes: [32, 64, 128, 256, 512, 1024],
                samplerates: [44100, 48000]
            },

            audioInputDevice: this._config.input_device,
            audioOutputDevice: this._config.output_device,

            samplerate: this._config.samplerate,
            buffersize: this._config.buffersize,

            dspUse: 0,
            latency: 0,

            device_open: this._is_open,
            dsp_on: this._is_enabled
        }
    }

    async getChannelList()
    {
        if (this._chlis_valid)
            return this._chlist_cached;

        let channels = <{ inputs : string[], outputs : string[] }>(
                           await this._devmgmt.request('device-channels'))
                           .data;

        channels.inputs = <any>channels.inputs.map((ch, i) => {
            return {
                name: ch, i: i
            }
        });

        channels.outputs = <any>channels.outputs.map((ch, i) => {
            return {
                name: ch, i: i
            }
        });

        this._chlist_cached = <ChannelList><unknown>channels;
        this._chlis_valid = true;

        return <ChannelList><unknown>channels;
    }

    async open()
    {
        if (!(await this.isOpen())) {
            return this._devmgmt.set('open', true);
        }
    }

    async close()
    {
        return this._devmgmt.set('open', false);
    }

    async isOpen()
    {
        let is_open = await this._devmgmt.request('open');
        return is_open.data ? true : false;
    }

    async enable()
    {
        return this._dsp.set('is-enabled', true);
    }

    async disable()
    {
        return this._dsp.set('is-enabled', false);
    }

    async isEnabled()
    {
        return this._dsp.request('is-enabled');
    }

    async setInputDevice(dev: string)
    {
        this._chlis_valid = false;
        return this._devmgmt.set('input-device', dev);
    }

    async setOutputDevice(dev: string)
    {
        this._chlis_valid = false;
        return this._devmgmt.set('output-device', dev);
    }

    async setSamplerate(rate: number)
    {
        let was_open = await this.isOpen();

        if (was_open)
            await this.close();

        let ret = await this._devmgmt.set('samplerate', rate);

        if (was_open)
            await this.open();

        return ret;
    }

    async setBuffersize(size: number)
    {
        let was_open = await this.isOpen();

        if (was_open)
            await this.close();

        let ret = await this._devmgmt.set('buffersize', size);

        if (was_open)
            await this.open();

        return ret;
    }

    async reloadSettingsFromDB()
    {

    }

    writeSettingsToDB()
    {

    }

    destroy() {
        if(this._devmgmt)
            this._devmgmt.destroy();

        if(this._dsp)
            this._dsp.destroy();
    }

    init()
    {
    }

    start(remote: Connection)
    {
        this._devmgmt = remote.getRequester('devmgmt');
        this._dsp    = remote.getRequester('dsp');

        if(!this._settings.hasSettings())
            this._settings.default();
        
        this.save();
    }

    constructor()
    {
        super('node-audio-devices');

        this._settings = new NodeAudioDeviceSettings(this);
        this.add(this._settings, 'audio-device-settings');
    }
}

export class AudioDevices extends ServerModule {
    
    init() {
        this.handle("update", (socket, node: DSPNode, data) => {
            log.info(`Refreshing audio device data for node ${node.name()}`);
            node.audio_devices.getNodeDevicesInformation().then((data) => {
                socket.emit('audiosettings.update.done', data);
            });
        });

        this.handle("inputdevice", (socket, node: DSPNode, data) => {

        });

        this.handle("outputdevice", (socket, node: DSPNode, data) => {

        })

        this.handle("buffersize", (socket, node: DSPNode, data: number) => {

        });

        this.handle("samplerate", (socket, node: DSPNode, data: number) => {

        });

        this.handle("dspenabled", (socket, node: DSPNode, data: boolean) => {

        });

        this.handle("open", (socket, node: DSPNode, data: boolean) => {

        });

        this.handle("dspuse", (socket, node: DSPNode) => {

        });
    }

    constructor() {
        super('audiosettings');
    }

}
