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
const dgram_1 = __importDefault(require("dgram"));
const dnssd = __importStar(require("dnssd"));
const events_1 = require("events");
const express_1 = __importDefault(require("express"));
const serialport_1 = __importDefault(require("serialport"));
const headtracker_1 = require("./headtracker");
const headtracker_serial_1 = require("./headtracker_serial");
const Logger = __importStar(require("./log"));
const util = __importStar(require("./util"));
const log = Logger.get('BRIDGE');
class SIOutputAdapter extends headtracker_serial_1.UDPOutputAdapter {
    constructor() {
        super(...arguments);
        this.id = 0;
        this._seq = 0;
    }
    seq() {
        if (++this._seq > 65535)
            this._seq = 0;
        return this._seq;
    }
    process(q) {
        let { buffer, offset } = q.data();
        if (q.float())
            this.sendData(headtracker_1.HeadtrackerDataPacket.newPacketFromFloatLEData(buffer, offset, this.id, this.seq()));
        else
            this.sendData(headtracker_1.HeadtrackerDataPacket.newPackerFromInt16Data(buffer, offset, this.id, this.seq()));
    }
}
class HeadtrackerBridgeDevice extends events_1.EventEmitter {
    constructor(port) {
        super();
        port.open();
        this.path = port.path;
        this.output = new SIOutputAdapter();
        this.lhtrk = new headtracker_serial_1.LocalHeadtracker(port, this.output);
        this._sock = dgram_1.default.createSocket('udp4');
        this.conf = new headtracker_1.HeadtrackerConfigPacket();
        this._sock.bind(this.onPortBound.bind(this));
        this._sock.on('message', this.onMessage.bind(this));
        this.lhtrk.on('close', (err) => {
            this.emit('close');
        });
        this.output.setRemote('127.0.0.1', 9999);
    }
    onPortBound() {
        if (!this.lhtrk.isOnline()) {
            this.lhtrk.on('ready', () => {
                this.registerService();
            });
        }
        else
            this.registerService();
    }
    registerService() {
        this.conf.setDeviceID(this.lhtrk.shtrk._id);
        if (util.LocalInterfaces.length < 1) {
            log.error('Could not find a suitable network interface on this machine');
            this.emit('close');
            return;
        }
        this.conf.device_static_subnet = util.LocalInterfaces[0].netmask;
        this.conf.device_static_ip = util.LocalInterfaces[0].address;
        console.log(this.conf);
        let sname = `si_htrk_${(this.lhtrk.shtrk._id < 10) ? '0' + this.lhtrk.shtrk._id
            : this.lhtrk.shtrk._id}`;
        log.info('Headtracker ready. Adding new mdns advertisement: _htrk._udp.'
            + sname);
        this._adv = new dnssd.Advertisement(dnssd.udp('_htrk'), this._sock.address().port, { host: sname, name: sname });
        this._adv.start();
    }
    onMessage(msg, addrinfo) {
        if (headtracker_1.HeadtrackerConfigPacket.check(msg)) {
            this.remote = addrinfo;
            let pkt = headtracker_1.HeadtrackerConfigPacket.fromBuffer(msg);
            if (pkt.isDeviceFlagSet(headtracker_1.HeadtrackerConfigFlags.DUMP_DATA))
                return this.dumpData();
            this.applyDiffConfig(pkt);
        }
    }
    dumpData() {
        this._sock.send(this.conf.toBuffer(), this.remote.port, this.remote.address);
    }
    saveConfiguration() { }
    applyDiffConfig(conf) {
        return __awaiter(this, void 0, void 0, function* () {
            if (conf.sample_rate != this.conf.sample_rate) {
                this.conf.sample_rate = conf.sample_rate;
                this.lhtrk.setSamplerate(this.conf.sample_rate);
            }
            if (conf.isDeviceFlagSet(headtracker_1.HeadtrackerConfigFlags.STREAM_ENABLED)
                != this.conf.isDeviceFlagSet(headtracker_1.HeadtrackerConfigFlags.STREAM_ENABLED)) {
                if (conf.isDeviceFlagSet(headtracker_1.HeadtrackerConfigFlags.STREAM_ENABLED)) {
                    log.info('Enable data transmission for headtracker '
                        + this.conf.deviceID());
                    this.output.id = this.conf.deviceID();
                    this.lhtrk.enableTx();
                    this.conf.setDeviceFlag(headtracker_1.HeadtrackerConfigFlags.STREAM_ENABLED);
                }
                else {
                    log.info('Disable data transmission for headtracker '
                        + this.conf.deviceID());
                    yield this.lhtrk.disableTx();
                    this.conf.clearDeviceFlag(headtracker_1.HeadtrackerConfigFlags.STREAM_ENABLED);
                }
            }
            if (conf.isDeviceFlagSet(headtracker_1.HeadtrackerConfigFlags.REBOOT)) {
                yield this.lhtrk.reboot();
            }
            if (conf.isDeviceFlagSet(headtracker_1.HeadtrackerConfigFlags.UPDATE)) {
                this.saveConfiguration();
            }
            if (this.conf.stream_dest_addr != conf.stream_dest_addr) {
                this.conf.stream_dest_addr = conf.stream_dest_addr;
                this.output.setRemote(this.conf.stream_dest_addr, this.conf.stream_dest_port);
            }
            if (this.conf.stream_dest_port != conf.stream_dest_port) {
                this.conf.stream_dest_port = conf.stream_dest_port;
                this.output.setRemote(this.conf.stream_dest_addr, this.conf.stream_dest_port);
            }
            if (conf.isStateFlagSet(headtracker_1.HeadtrackerStateFlags.RESET_ORIENTATION)) {
                this.conf.clearStateFlag(headtracker_1.HeadtrackerStateFlags.RESET_ORIENTATION);
                this.lhtrk.resetOrientation();
            }
            let inv_bits = headtracker_1.HeadtrackerStateFlags.INVERT_X
                | headtracker_1.HeadtrackerStateFlags.INVERT_Y
                | headtracker_1.HeadtrackerStateFlags.INVERT_Z;
            if ((conf.device_state & inv_bits)
                != (this.conf.device_state & inv_bits)) {
                this.conf.device_state = (this.conf.device_state & ~inv_bits)
                    | (conf.device_state & inv_bits);
                let inv = {
                    x: this.conf.isStateFlagSet(headtracker_1.HeadtrackerStateFlags.INVERT_X),
                    y: this.conf.isStateFlagSet(headtracker_1.HeadtrackerStateFlags.INVERT_Y),
                    z: this.conf.isStateFlagSet(headtracker_1.HeadtrackerStateFlags.INVERT_Z)
                };
                log.info("Invertation changed: ");
                console.log(inv);
                this.lhtrk.setInvertation(inv);
            }
            this.dumpData();
        });
    }
    reconnect(port) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.lhtrk.destroy();
            this.lhtrk = new headtracker_serial_1.LocalHeadtracker(port, this.output);
        });
    }
    destroy() {
        this._sock.close();
        if (this._adv)
            this._adv.stop(false, () => {
                log.info('Advertisement for ' + this.path + ' removed');
            });
        this.lhtrk.destroy().catch((err) => {
            log.warn('Could not close port: ' + err);
        });
    }
}
exports.HeadtrackerBridgeDevice = HeadtrackerBridgeDevice;
class HeadtrackerBridge {
    constructor() {
        this._devs = [];
        this._app = express_1.default();
        this._app.get('headtracker');
    }
    findDeviceForPath(p) {
        return this._devs.find(d => d.path === p);
    }
    addDevice(p) {
        log.info('Opening port ' + p);
        let odev = this.findDeviceForPath(p);
        if (odev)
            return log.error('Device ' + p
                + ' already opened. Not trying to open again. That would be pointless.');
        let newdev = new HeadtrackerBridgeDevice(new serialport_1.default(p, { baudRate: 115200, autoOpen: false }));
        this._devs.push(newdev);
        newdev.on('close', this.removeDevice.bind(this, p));
    }
    removeDevice(p) {
        let dev = this.findDeviceForPath(p);
        if (!dev)
            return;
        dev.destroy();
        log.info('Closing port and deregistering device at ' + p);
        this._devs.splice(this._devs.indexOf(dev), 1);
    }
}
exports.HeadtrackerBridge = HeadtrackerBridge;
//# sourceMappingURL=headtracker_bridge.js.map