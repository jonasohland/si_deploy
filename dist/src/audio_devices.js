"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
const Logger = __importStar(require("./log"));
const data_1 = require("./data");
const log = Logger.get('AUDDEV');
class AudioDeviceConfiguration {
    constructor() {
        this.samplerate = 48000;
        this.buffersize = 1024;
        this.input_device = '';
        this.output_device = '';
        this.in = 32;
        this.out = 32;
    }
}
exports.AudioDeviceConfiguration = AudioDeviceConfiguration;
class Manager {
    constructor(con) {
        this.input_devices = [];
        this.output_devices = [];
        this.ich_names = [];
        this.och_names = [];
        this.config = new AudioDeviceConfiguration();
        this.channel_list_fresh = false;
        this.remote = con.getRequester('devmgmt');
        this.dsp = con.getRequester('dsp');
        let self = this;
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            let devices = yield this.remote.request('device-list');
            this.input_devices = devices.data.inputs;
            this.output_devices = devices.data.outputs;
            let input_device = yield this.remote.request('input-device');
            let output_device = yield this.remote.request('output-device');
            if (input_device.data && input_device.data.length)
                this.config.input_device = input_device.data;
            if (output_device.data && output_device.data.length)
                this.config.output_device = output_device.data;
            if (this.config.input_device.length
                && this.config.output_device.length) {
                let channels = yield this.remote.request('device-channels');
                console.log(channels);
            }
            let is_open = yield this.isOpen();
            let dsp_enabled = (yield this.dsp.request('is-enabled')).data;
            let srate = (yield this.remote.request('samplerate')).data;
            let bsize = (yield this.remote.request('buffersize')).data;
            this.config.buffersize = bsize;
            this.config.samplerate = srate;
            this.status = {
                nodename: 'unknown',
                id: 'unknown',
                audioInputDevice: this.config.input_device,
                audioOutputDevice: this.config.output_device,
                samplerate: this.config.samplerate,
                buffersize: this.config.buffersize,
                options: {
                    audioIns: this.input_devices,
                    audioOuts: this.output_devices,
                    buffersizes: [32, 64, 128, 256, 512, 1024],
                    samplerates: [44100, 48000]
                },
                dspUse: 0,
                latency: 0,
                device_open: is_open ? true : false,
                dsp_on: (dsp_enabled) ? true : false
            };
        });
    }
    refreshDSPLoad() {
        return __awaiter(this, void 0, void 0, function* () {
            this.status.dspUse
                = (yield this.remote.request('dsp-load')).data;
        });
    }
    setConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            this.channel_list_fresh = false;
            yield this.refresh();
            yield this.remote.set('samplerate', this.config.samplerate);
            yield this.remote.set('buffersize', this.config.buffersize);
            yield this.remote.set('input-device', this.config.input_device);
            yield this.remote.set('output-device', this.config.output_device);
        });
    }
    setInputDevice(dev) {
        return __awaiter(this, void 0, void 0, function* () {
            this.channel_list_fresh = false;
            return this.remote.set('input-device', dev);
        });
    }
    setOutputDevice(dev) {
        return __awaiter(this, void 0, void 0, function* () {
            this.channel_list_fresh = false;
            return this.remote.set('output-device', dev);
        });
    }
    setSamplerate(rate) {
        return __awaiter(this, void 0, void 0, function* () {
            let was_open = yield this.isOpen();
            if (was_open)
                yield this.close();
            let ret = yield this.remote.set('samplerate', rate);
            if (was_open)
                yield this.open();
            return ret;
        });
    }
    setBuffersize(size) {
        return __awaiter(this, void 0, void 0, function* () {
            let was_open = yield this.isOpen();
            if (was_open)
                yield this.close();
            let ret = yield this.remote.set('buffersize', size);
            if (was_open)
                yield this.open();
            return ret;
        });
    }
    open() {
        return __awaiter(this, void 0, void 0, function* () {
            this.channel_list_fresh = false;
            return this.remote.set('open', true);
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            this.channel_list_fresh = false;
            return this.remote.set('open', false);
        });
    }
    isOpen() {
        return __awaiter(this, void 0, void 0, function* () {
            let is_open = yield this.remote.request('open');
            return is_open.data ? true : false;
        });
    }
    enable() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dsp.set('is-enabled', true);
        });
    }
    disable() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dsp.set('is-enabled', false);
        });
    }
    isEnabled() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dsp.request('is-enabled');
        });
    }
    getChannelList() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.channel_list_fresh)
                return this.channel_list_cache;
            let channels = (yield this.remote.request('device-channels'))
                .data;
            channels.inputs = channels.inputs.map((ch, i) => {
                return {
                    name: ch, i: i
                };
            });
            channels.outputs = channels.outputs.map((ch, i) => {
                return {
                    name: ch, i: i
                };
            });
            this.channel_list_cache = channels;
            this.channel_list_fresh = true;
            return channels;
        });
    }
}
exports.Manager = Manager;
class AudioDeviceManager extends events_1.default {
    constructor(server, instances) {
        super();
        let self = this;
        this.instances = instances;
        server.io.on('connection', (socket) => {
            socket.on('audiosettings.update', this.handleUpdateRequest.bind(self, socket));
            socket.on('audiosettings.inputdevice.set', (node, device) => {
                log.info('New input device requested for node ' + node
                    + ': ' + device);
                self.instances.find(ins => ins.name == node)
                    .devices.setInputDevice(device)
                    .then(() => {
                    console.log('device set.');
                    socket.emit('audiosettings.operation.done');
                });
            });
            socket.on('audiosettings.outputdevice.set', (node, device) => {
                log.info('New output device requested for node '
                    + node + ': ' + device);
                self.instances.find(ins => ins.name == node)
                    .devices.setOutputDevice(device)
                    .then(() => {
                    socket.emit('audiosettings.operation.done');
                });
            });
            socket.on('audiosettings.buffersize.set', (node, buffersize) => {
                log.info('New buffersize requested for node ' + node
                    + ': ' + buffersize);
                self.instances.find(ins => ins.name == node)
                    .devices.setBuffersize(buffersize)
                    .then(() => {
                    socket.emit('audiosettings.operation.done');
                });
            });
            socket.on('audiosettings.samplerate.set', (node, samplerate) => {
                log.info('New samplerate requested for node ' + node
                    + ': ' + samplerate);
                self.instances.find(ins => ins.name == node)
                    .devices.setSamplerate(samplerate)
                    .then(() => {
                    socket.emit('audiosettings.operation.done');
                });
            });
            socket.on('audiosettings.dsp.enabled', (node, is_enabled) => {
                log.info('Setting new DSP Status for node ' + node + ':'
                    + ((is_enabled) ? 'enabled' : 'disabled'));
                const confirm = (msg) => {
                    socket.emit('audiosettings.operation.done');
                };
                const do_catch = (err) => {
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
            socket.on('audiosettings.device.open', (node, is_open) => {
                log.info('Setting device open status for node ' + node + ':'
                    + ((is_open) ? 'enabled' : 'disabled'));
                const confirm = (msg) => {
                    socket.emit('audiosettings.operation.done');
                };
                const do_catch = (err) => {
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
            socket.on('audiosettings.dspuse', () => {
                this.instances.forEach(ins => {
                    ins.devices.refreshDSPLoad()
                        .then(() => {
                        socket.emit('audiosettings.dspuse', {
                            id: ins.id,
                            value: ins.devices.status.dspUse
                        });
                    })
                        .catch(err => log.error(err));
                });
            });
        });
    }
    handleUpdateRequest(socket) {
        log.info('Refreshing audio device data');
        this.refreshAllDevices()
            .then((data) => {
            socket.emit('audiosettings.update.done', data);
        })
            .catch(err => log.error(err));
    }
    refreshAllDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this.instances.map(ins => ins.devices.refresh()));
            return this.instances.map(ins => {
                console.log(ins.name);
                let status = ins.devices.status;
                status.nodename = ins.name;
                status.id = ins.id;
                return status;
            });
        });
    }
    getAllChannelLists() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.all(this.instances.map(function (ins) {
                return __awaiter(this, void 0, void 0, function* () {
                    return {
                        id: ins.id, name: ins.name,
                        channels: yield ins.devices.getChannelList()
                    };
                });
            }));
        });
    }
}
exports.AudioDeviceManager = AudioDeviceManager;
class NodeSelectedAudioDeviceSettings extends data_1.ManagedNodeStateObject {
    constructor(ctrl, input, output) {
        super();
        this.controller = ctrl;
        this.input = input;
        this.output = output;
    }
    set(val) {
        return __awaiter(this, void 0, void 0, function* () {
            this.input = val[0];
            this.output = val[1];
        });
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            return [this.input, this.output];
        });
    }
    apply() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
exports.NodeSelectedAudioDeviceSettings = NodeSelectedAudioDeviceSettings;
class NodePlaybackSettings extends data_1.ManagedNodeStateObject {
    constructor(controller, srate, bufsize) {
        super();
        this.controller = controller;
        this.srate = srate;
        this.buffersize = bufsize;
    }
    set(val) {
        return __awaiter(this, void 0, void 0, function* () {
            this.srate = val[0];
            this.buffersize = val[1];
        });
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            return [this.srate, this.buffersize];
        });
    }
    apply() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
exports.NodePlaybackSettings = NodePlaybackSettings;
class NodeAudioDeviceSettings extends data_1.ManagedNodeStateMapRegister {
    constructor(ctrl) {
        super();
        this.controller = ctrl;
    }
    hasSettings() {
        return (this._objects["io-devices"] != null) && (this._objects["playback-settings"] != null);
    }
    default() {
        log.verbose("Construct default audio device settings");
        this.add("io-devices", new NodeSelectedAudioDeviceSettings(this.controller, "", ""));
        this.add("playback-settings", new NodePlaybackSettings(this.controller, 48000, 512));
    }
    remove(name, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (name) {
            }
        });
    }
    insert(name, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (name) {
                case "io-devices":
                    return new NodeSelectedAudioDeviceSettings(this.controller, obj.data[0], obj.data[1]);
                case "playback-settings":
                    return new NodePlaybackSettings(this.controller, obj.data[0], obj.data[1]);
            }
            return null;
        });
    }
}
exports.NodeAudioDeviceSettings = NodeAudioDeviceSettings;
class NodeAudioDevices extends data_1.NodeModule {
    constructor() {
        super('node-audio-devices');
        this._chlis_valid = false;
        this._idev_list = [];
        this._odev_list = [];
        this._is_open = false;
        this._is_enabled = false;
        this._config = new AudioDeviceConfiguration();
        this._settings = new NodeAudioDeviceSettings(this);
        this.add(this._settings, 'audio-device-settings');
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            let devices = yield this._devmgmt.request('device-list');
            this._idev_list = devices.data.inputs;
            this._odev_list = devices.data.outputs;
            let input_device = yield this._devmgmt.request('input-device');
            let output_device = yield this._devmgmt.request('output-device');
            if (input_device.data && input_device.data.length)
                this._config.input_device = input_device.data;
            if (output_device.data && output_device.data.length)
                this._config.output_device = output_device.data;
            if (this._config.input_device.length
                && this._config.output_device.length) {
                let channels = yield this._devmgmt.request('device-channels');
                console.log(channels);
            }
            let is_open = yield this.isOpen();
            let dsp_enabled = (yield this._dsp.request('is-enabled')).data;
            let srate = (yield this._devmgmt.request('samplerate')).data;
            let bsize = (yield this._devmgmt.request('buffersize')).data;
            this._config.buffersize = bsize;
            this._config.samplerate = srate;
            this.writeSettingsToDB();
        });
    }
    getNodeDevicesInformation() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.refresh();
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
            };
        });
    }
    getChannelList() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._chlis_valid)
                return this._chlist_cached;
            let channels = (yield this._devmgmt.request('device-channels'))
                .data;
            channels.inputs = channels.inputs.map((ch, i) => {
                return {
                    name: ch, i: i
                };
            });
            channels.outputs = channels.outputs.map((ch, i) => {
                return {
                    name: ch, i: i
                };
            });
            this._chlist_cached = channels;
            this._chlis_valid = true;
            return channels;
        });
    }
    open() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.isOpen())) {
                return this._devmgmt.set('open', true);
            }
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._devmgmt.set('open', false);
        });
    }
    isOpen() {
        return __awaiter(this, void 0, void 0, function* () {
            let is_open = yield this._devmgmt.request('open');
            return is_open.data ? true : false;
        });
    }
    enable() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._dsp.set('is-enabled', true);
        });
    }
    disable() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._dsp.set('is-enabled', false);
        });
    }
    isEnabled() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._dsp.request('is-enabled');
        });
    }
    setInputDevice(dev) {
        return __awaiter(this, void 0, void 0, function* () {
            this._chlis_valid = false;
            return this._devmgmt.set('input-device', dev);
        });
    }
    setOutputDevice(dev) {
        return __awaiter(this, void 0, void 0, function* () {
            this._chlis_valid = false;
            return this._devmgmt.set('output-device', dev);
        });
    }
    setSamplerate(rate) {
        return __awaiter(this, void 0, void 0, function* () {
            let was_open = yield this.isOpen();
            if (was_open)
                yield this.close();
            let ret = yield this._devmgmt.set('samplerate', rate);
            if (was_open)
                yield this.open();
            return ret;
        });
    }
    setBuffersize(size) {
        return __awaiter(this, void 0, void 0, function* () {
            let was_open = yield this.isOpen();
            if (was_open)
                yield this.close();
            let ret = yield this._devmgmt.set('buffersize', size);
            if (was_open)
                yield this.open();
            return ret;
        });
    }
    reloadSettingsFromDB() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    writeSettingsToDB() {
    }
    destroy() {
        if (this._devmgmt)
            this._devmgmt.destroy();
        if (this._dsp)
            this._dsp.destroy();
    }
    init() {
    }
    start(remote) {
        this._devmgmt = remote.getRequester('devmgmt');
        this._dsp = remote.getRequester('dsp');
        if (!this._settings.hasSettings())
            this._settings.default();
        this.save();
    }
}
exports.NodeAudioDevices = NodeAudioDevices;
class AudioDevices extends data_1.ServerModule {
    init() {
        this.handle("update", (socket, node, data) => {
            log.info(`Refreshing audio device data for node ${node.name()}`);
            node.audio_devices.getNodeDevicesInformation().then((data) => {
                socket.emit('audiosettings.update.done', data);
            });
        });
        this.handle("inputdevice", (socket, node, data) => {
        });
        this.handle("outputdevice", (socket, node, data) => {
        });
        this.handle("buffersize", (socket, node, data) => {
        });
        this.handle("samplerate", (socket, node, data) => {
        });
        this.handle("dspenabled", (socket, node, data) => {
        });
        this.handle("open", (socket, node, data) => {
        });
        this.handle("dspuse", (socket, node) => {
        });
    }
    constructor() {
        super('audiosettings');
    }
}
exports.AudioDevices = AudioDevices;
//# sourceMappingURL=audio_devices.js.map