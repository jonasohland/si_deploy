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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("./core");
const Logger = __importStar(require("./log"));
const web_interface_defs_1 = require("./web_interface_defs");
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
class NodeSelectedAudioDeviceSettings extends core_1.ManagedNodeStateObject {
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
        return [this.input, this.output];
    }
    apply() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
exports.NodeSelectedAudioDeviceSettings = NodeSelectedAudioDeviceSettings;
class NodePlaybackSettings extends core_1.ManagedNodeStateObject {
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
        return [this.srate, this.buffersize];
    }
    apply() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
exports.NodePlaybackSettings = NodePlaybackSettings;
class NodeAudioDeviceSettings extends core_1.ManagedNodeStateMapRegister {
    constructor(ctrl) {
        super();
        this.controller = ctrl;
    }
    hasSettings() {
        return (this._objects['io-devices'] != null)
            && (this._objects['playback-settings'] != null);
    }
    default() {
        log.verbose('Construct default audio device settings');
        this.add('io-devices', new NodeSelectedAudioDeviceSettings(this.controller, '', ''));
        this.add('playback-settings', new NodePlaybackSettings(this.controller, 48000, 512));
    }
    setIODevices(input, output) {
        if (!this.hasSettings())
            this.default();
        this._objects['io-devices'].set([input, output]);
    }
    setPlaypackSettings(srate, bufsize) {
        if (!this.hasSettings())
            this.default();
        this._objects['playback-settings'].set([srate, bufsize]);
    }
    getIODevices() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._objects['io-devices'].get();
        });
    }
    getPlaybackSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._objects['playback-settings'].get();
        });
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
                case 'io-devices':
                    return new NodeSelectedAudioDeviceSettings(this.controller, obj[0], obj[1]);
                case 'playback-settings':
                    return new NodePlaybackSettings(this.controller, obj[0], obj[1]);
            }
            return null;
        });
    }
}
exports.NodeAudioDeviceSettings = NodeAudioDeviceSettings;
class NodeAudioDevices extends core_1.NodeModule {
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
    joined(socket, topic) {
    }
    left(socket, topic) {
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            let devices = yield this._devmgmt.request('device-list');
            this._idev_list = devices.data.inputs;
            this._odev_list = devices.data.outputs;
            this._config.input_device = "";
            this._config.output_device = "";
            let input_device = yield this._devmgmt.request('input-device');
            let output_device = yield this._devmgmt.request('output-device');
            let is_open = yield this.isOpen();
            if (input_device.data && input_device.data.length)
                this._config.input_device = input_device.data;
            if (output_device.data && output_device.data.length)
                this._config.output_device = output_device.data;
            if (this._config.input_device.length
                && this._config.output_device.length && is_open) {
                let channels = yield this._devmgmt.request('device-channels');
                // console.log(channels);
            }
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
                yield this._devmgmt.setTmt('open', 20000, true);
                this._is_open = yield this.isOpen();
            }
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._devmgmt.set('open', false);
            this._is_open = yield this.isOpen();
            return;
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
            yield this._dsp.set('is-enabled', true);
            this._is_enabled = yield this.isEnabled();
        });
    }
    disable() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._dsp.set('is-enabled', false);
            this._is_enabled = yield this.isEnabled();
        });
    }
    isEnabled() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._dsp.requestTyped('is-enabled').bool();
        });
    }
    setInputDevice(dev) {
        return __awaiter(this, void 0, void 0, function* () {
            this._chlis_valid = false;
            yield this._devmgmt.set('input-device', dev);
            this._config.input_device = dev;
            this.writeSettingsToDB();
            return;
        });
    }
    setOutputDevice(dev) {
        return __awaiter(this, void 0, void 0, function* () {
            this._chlis_valid = false;
            yield this._devmgmt.set('output-device', dev);
            this._config.output_device = dev;
            this.writeSettingsToDB();
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
            this._config.samplerate = rate;
            this.writeSettingsToDB();
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
            this._config.buffersize = size;
            this.writeSettingsToDB();
            return ret;
        });
    }
    reloadSettingsFromDB() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._settings.hasSettings()) {
                let iodev = yield this._settings.getIODevices();
                let playset = yield this._settings.getPlaybackSettings();
                yield this.setInputDevice(iodev[0]);
                yield this.setOutputDevice(iodev[1]);
                yield this.setSamplerate(playset[0]);
                yield this.setBuffersize(playset[1]);
                if (this._is_open) {
                    yield this.open();
                    if (this._is_enabled)
                        yield this.enable();
                }
            }
        });
    }
    writeSettingsToDB() {
        this._settings.setIODevices(this._config.input_device, this._config.output_device);
        this._settings.setPlaypackSettings(this._config.samplerate, this._config.buffersize);
        this._settings.save();
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
        this._devmgmt.on('device-type-changed', (msg) => {
            console.log(msg);
            if (msg && msg.data && typeof msg.data == 'string')
                this.events.emit('webif-node-warning', this.myNodeId(), `Audio device type changed to: ${msg.data}`);
        });
        this.events.on('dsp-started', () => {
            this.reloadSettingsFromDB().then(() => {
                log.info("Restored DSP settings from DB");
            }).catch(err => {
                log.error("Could not restore settings from DB: " + err);
            });
        });
        this.reloadSettingsFromDB().then(() => {
            log.info("Restored DSP settings from DB");
        }).catch(err => {
            log.error("Could not restore settings from DB: " + err);
        });
        this.save();
    }
}
exports.NodeAudioDevices = NodeAudioDevices;
class AudioDevices extends core_1.ServerModule {
    joined(socket, topic) {
    }
    left(socket, topic) {
    }
    init() {
        this.handle('update', (socket, node, data) => {
            log.info(`Refreshing audio device data for node ${node.name()}`);
            node.audio_devices.getNodeDevicesInformation()
                .then((data) => {
                socket.emit('audiosettings.update.done', data);
            })
                .catch(this.endTransactionWithError.bind(this, socket));
        });
        this.handle('inputdevice', (socket, node, data) => {
            node.audio_devices.setInputDevice(data)
                .then(this.endTransaction.bind(this, socket))
                .catch(this.endTransactionWithError.bind(this, socket));
        });
        this.handle('outputdevice', (socket, node, data) => {
            node.audio_devices.setOutputDevice(data)
                .then(this.endTransaction.bind(this, socket))
                .catch(this.endTransactionWithError.bind(this, socket));
        });
        this.handle('buffersize', (socket, node, data) => {
            node.audio_devices.setBuffersize(data)
                .then(this.endTransaction.bind(this, socket))
                .catch(this.endTransactionWithError.bind(this, socket));
        });
        this.handle('samplerate', (socket, node, data) => {
            node.audio_devices.setSamplerate(data)
                .then(this.endTransaction.bind(this, socket))
                .catch(this.endTransactionWithError.bind(this, socket));
        });
        this.handle('dspenabled', (socket, node, data) => {
            if (data) {
                node.audio_devices.enable()
                    .then(this.endTransaction.bind(this, socket))
                    .catch(this.endTransactionWithError.bind(this, socket));
            }
            else {
                node.audio_devices.disable()
                    .then(this.endTransaction.bind(this, socket))
                    .catch(this.endTransactionWithError.bind(this, socket));
            }
        });
        this.handle('open', (socket, node, data) => {
            if (data) {
                node.audio_devices.open()
                    .then(this.endTransaction.bind(this, socket))
                    .catch(this.endTransactionWithError.bind(this, socket));
            }
            else {
                node.audio_devices.close()
                    .then(this.endTransaction.bind(this, socket))
                    .catch(this.endTransactionWithError.bind(this, socket));
            }
        });
        this.handle('dspuse', (socket, node) => {
        });
        this.handle('channellist', (socket, node) => {
            node.audio_devices.getChannelList().then(chlist => {
                console.log(web_interface_defs_1.webifResponseEvent(node.id(), 'audiosettings', 'channellist'));
                socket.emit(web_interface_defs_1.webifResponseEvent(node.id(), 'audiosettings', 'channellist'), chlist);
            }).catch(err => {
                socket.emit(web_interface_defs_1.webifResponseEvent(node.id(), 'audiosettings', 'channellist'), null);
                // TODO: error handling for Error objects
                this.webif.error("Could not retrieve channel list for node " + node.name() + ": " + err);
            });
        });
    }
    endTransaction(socket) {
        socket.emit('audiosettings.done');
    }
    endTransactionWithError(socket, error) {
        socket.emit('audiosettings.done');
        this.webif.error(error);
    }
    constructor() {
        super('audiosettings');
    }
}
exports.AudioDevices = AudioDevices;
//# sourceMappingURL=audio_devices.js.map