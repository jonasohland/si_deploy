import {loggers} from 'winston';

import {AudioDeviceManager, Channel} from './audio_devices';
import * as DSP from './dsp'
import {SpatialIntercomInstance} from './instance';
import * as Logger from './log';
import {ShowfileRecord} from './showfiles';

const log = Logger.get('INP');

interface NodeAndInputs {
    max_id: 0;
    si: SpatialIntercomInstance;
    inputs: Input[];
}

export class Input extends ShowfileRecord {

    plain()
    {
        let r = {};
        Object.assign(r, this);
        return r;
    }

    restore(data: any): void
    {
        this.build(data);
    }

    save() {}

    build(data: any): void
    {
        Object.assign(this, data);
    }

    id: number;
    name: string;
    format: DSP.PortTypes;
    channels: Channel[];
}

export class InputManager {

    nodes: NodeAndInputs[];
    devices: AudioDeviceManager;
    server: SocketIO.Server;

    constructor(io: SocketIO.Server, audioDevMan: AudioDeviceManager)
    {
        let self = this;

        this.devices = audioDevMan;
        this.nodes   = [];

        this.server = io;

        io.on('connection', socket => {
            socket.on('inputs.update',
                      () => { self.updateInterface(socket).catch(err => {
                          console.log(err);
                      }) });

            socket.on('inputs.add', this.addInput.bind(self));
        })
    }

    async updateInterface(sock: SocketIO.Socket|SocketIO.Server)
    {
        let nodes = await this.devices.getAllChannelLists();

        sock.emit('inputs.update', {
            nodes : nodes,
            inputs : this.nodes.map(nd => {
                return {
                    id: nd.si.id, inputs: nd.inputs.map(i => i.plain())
                }
            })
        });
    }

    async addInput(input: any)
    {
        let ins = this.devices.instances
                      .find(ins => ins.instance.id == input.nodeid)
                      .instance;

        let chlist = await ins.devices.getChannelList();

        let chs = chlist.inputs.slice(
            input.ch_start, input.ch_start + input.ch_count);

        let nodeAndInput = this.nodes.find(ni => ni.si.id == input.nodeid);

        if (nodeAndInput == undefined)
            this.nodes.push({ si : ins, inputs : [], max_id : 0 });

        nodeAndInput = this.nodes.find(ni => ni.si.id == input.nodeid);

        log.info(`Added new Input to node ${nodeAndInput.si.name} (chs: ${
            chs.length}, name: ${input.name})`);

        let i = new Input();

        i.build({
            name : input.name,
            channels : chs,
            format : input.format,
            id : ++nodeAndInput.max_id
        });

        nodeAndInput.inputs.push(i);

        this.updateInterface(this.server);
    }
}