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
const chalk_1 = __importDefault(require("chalk"));
const dgram = __importStar(require("dgram"));
const osc = __importStar(require("osc-min"));
const serialport_1 = __importDefault(require("serialport"));
const terminal_kit_1 = require("terminal-kit");
const web_interface_1 = __importDefault(require("./web_interface"));
const headtracker_serial_1 = require("./headtracker_serial");
const headtracking_1 = require("./headtracking");
const Logger = __importStar(require("./log"));
const { cyan } = chalk_1.default;
const log = Logger.get('HEADTR');
const core_1 = require("./core");
const communication_1 = require("./communication");
class OSCController {
    constructor(ht, options) {
        this.port = Number.parseInt(options.ctrlPort);
        this.ht = ht;
        this.sock = dgram.createSocket('udp4');
        this.sock.bind(this.port, this.onBound.bind(this));
        this.sock.on('message', this.onMessage.bind(this));
    }
    onBound() {
        log.info('Listening for control messages on port ' + this.port);
    }
    onMessage(buf, addrinf) {
        let packet = osc.fromBuffer(buf);
        if (packet.oscType == 'message') {
            if (packet.address == '/calibrate') {
                let loops = 32;
                let a = packet.args[0];
                if (a && a.type == 'integer')
                    loops = a.value;
                log.info('Received \'/calibrate\' message');
                let pg = terminal_kit_1.terminal.progressBar({ title: 'Calibrating Gyro', percent: true });
                this.ht.trackers.forEach(t => t.calibrate(loops, (prog, step) => {
                    pg.update(prog);
                    if (prog == 1) {
                        pg = terminal_kit_1.terminal.progressBar({
                            title: 'Calibrating Acc',
                            percent: true
                        });
                    }
                }).then(() => {
                    pg.update(1);
                    setTimeout(() => {
                        pg.stop();
                        console.log();
                        log.info('Calibration done!');
                    }, 500);
                }));
            }
            else if (packet.address == '/reset-orientation') {
                log.info('Received \'/reset-orientation\' message');
                this.ht.trackers.forEach(t => t.resetOrientation());
            }
            else if (packet.address == '/start') {
                this.ht.trackers.forEach(t => t.enableTx());
            }
            else if (packet.address == '/stop') {
                this.ht.trackers.forEach(t => t.disableTx());
            }
            else if (packet.address == '/srate') {
                if (packet.args.length == 1) {
                    let sratep = packet.args[0];
                    if (!(sratep.type === 'integer'))
                        return log.error('Fick dich Till');
                    this.ht.trackers.forEach(t => t.setSamplerate(sratep.value));
                }
            }
            else if (packet.address == '/invert') {
                if (packet.args.length == 1) {
                    let argp = packet.args[0];
                    if (argp.type == 'string') {
                        let str = argp.value;
                        let axs = str.split('');
                        let inv = {
                            x: axs.indexOf('x') != -1,
                            y: axs.indexOf('y') != -1,
                            z: axs.indexOf('z') != -1
                        };
                        this.ht.trackers.forEach(t => t.setInvertation(inv));
                    }
                }
            }
            else if (packet.address == '/begin_init') {
                this.ht.trackers.forEach(t => {
                    log.info('Beginning initialization');
                    t.beginInit().then(() => {
                        log.info('OK. Nod down and proceed to next step');
                    });
                });
            }
            else if (packet.address == '/end_init') {
                this.ht.trackers.forEach(t => {
                    log.info('Finish initialization');
                    t.finishInit().then(() => {
                        log.info('Initialization done');
                    });
                });
            }
        }
    }
}
class DummyOutputAdapter extends headtracker_serial_1.OutputAdapter {
    process(q) {
        console.log(q);
    }
}
function findPort(index) {
    return __awaiter(this, void 0, void 0, function* () {
        return serialport_1.default.list().then(ports => {
            if (ports.length < index || index < 1) {
                log.error('No port found for index ' + index);
                exit(1);
            }
            else
                return ports[index - 1].path;
        });
    });
}
function exit(code) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(typeof code == 'number'))
            code = 0;
        terminal_kit_1.terminal.processExit(code);
    });
}
terminal_kit_1.terminal.on('key', (name) => {
    if (name === 'CTRL_C')
        exit(0);
});
function listPorts() {
    return __awaiter(this, void 0, void 0, function* () {
        return serialport_1.default.list().then(ports => {
            console.log('The following serial ports are available on your device [index] - [port]:');
            console.log();
            ports.forEach((p, i) => {
                console.log(`${cyan('' + (i + 1))} - ${p.path}`);
            });
        });
    });
}
function selectPort() {
    return __awaiter(this, void 0, void 0, function* () {
        return serialport_1.default.list().then(ports => {
            return terminal_kit_1.terminal.singleColumnMenu(ports.map(p => p.path))
                .promise.then(res => {
                console.log();
                return res.selectedText;
            });
        });
    });
}
function runFlashMode(p, options) {
    let htrk = new headtracker_serial_1.LocalHeadtracker(p, new DummyOutputAdapter());
    htrk.on('ready', () => {
        htrk.flashNewestFirmware(options.bootloader)
            .then(() => {
            exit(0);
        })
            .catch(err => {
            exit(1);
        });
    });
}
function runLatencyTest(p, options) {
    let htrk = new headtracker_serial_1.LocalHeadtracker(p, new DummyOutputAdapter());
    htrk.on('ready', () => {
        htrk.checkLatency().then(() => {
            exit();
        });
    });
}
class DummyServer extends core_1.Server {
    createNode(id) {
        return null;
    }
    destroyNode(node) {
    }
}
function runNormalMode(p, options) {
    options.webserver_port = options.webserver_port || 80;
    options.server_port = options.server_port || 43265;
    let io = new communication_1.SIServerWSServer(options);
    let webif = new web_interface_1.default(options);
    let dummy = new DummyServer(io, webif);
    let headtracking = new headtracking_1.Headtracking(webif);
    webif.attachServer(dummy);
    dummy.add(webif);
    dummy.add(headtracking);
    if (options.oscControl)
        new OSCController(headtracking, options);
    let adapter;
    if (options.preset) {
        if (options.preset == 'IEM') {
            adapter = new headtracker_serial_1.IEMOutputAdapter();
        }
        else {
            log.error('Preset ' + options.preset + ' not found');
            exit(1);
        }
    }
    else
        adapter = new headtracker_serial_1.OSCOutputAdapter();
    if (options.format == 'euler') {
        adapter.setOutputQuaternions(false);
        adapter.setOutputEuler(true);
    }
    else {
        adapter.setOutputQuaternions(true);
        adapter.setOutputEuler(false);
    }
    adapter.setRemote(options.host, options.port);
    if (!(options.preset)) {
        if (options.quaternionAddr) {
            let addrs = options.quaternionAddr.split(',');
            adapter.setQuatAddresses(addrs);
        }
        if (options.eulerAddr) {
            let addrs = options.eulerAddr.split(',');
            adapter.setEulerAddresses(addrs);
        }
    }
    let ht = new headtracker_serial_1.LocalHeadtracker(p, adapter);
    ht.on('close', () => {
        exit();
    });
    headtracking.addHeadtracker(ht, 99, 'local');
}
function setIdMode(port, id) {
    let dev = new headtracker_serial_1.LocalHeadtracker(port, new DummyOutputAdapter());
    dev.on('ready', () => __awaiter(this, void 0, void 0, function* () {
        if (dev.shtrk._id == id) {
            log.info('New id is old id. Nothing to do here.');
            exit(0);
            return;
        }
        log.info('Setting new ID: ' + id);
        yield dev.setID(id);
        log.info('Done. Checking...');
        let newid = yield dev.getID();
        log.info('Headtracker returned: ' + newid);
        if (newid == id) {
            log.info('Looks good!');
            exit(0);
        }
        else {
            log.error('Fail');
            exit(1);
        }
    }));
}
function start(path, options) {
    log.info('Opening port ' + path);
    let p = new serialport_1.default(path, { autoOpen: false, baudRate: 115200 });
    p.on('open', err => {
        log.info('Port is now open');
        if (err) {
            log.error(`Could not open port ${path}, error: ${err.message}`);
            exit(1);
        }
        if (options.flashFirmware)
            return runFlashMode(p, options);
        if (options.testLatency)
            return runLatencyTest(p, options);
        if (options.setId || options.setId != null)
            return setIdMode(p, options.setId);
        runNormalMode(p, options);
    });
    p.open();
}
function default_1(port, options) {
    return __awaiter(this, void 0, void 0, function* () {
        options.webserver_port = options.webserver_port || 80;
        if (options.listPorts)
            return listPorts().then(exit);
        if (!port) {
            if (options.auto) {
                return;
            }
            else {
                console.log('Please select a serial port (↑↓, Enter to confirm): ');
                return selectPort()
                    .then(port => start(port, options))
                    .catch(err => {
                    log.error('Could not select serial port ' + err);
                    exit(1);
                });
            }
        }
        let p_i = Number.parseInt(port);
        if (!isNaN(p_i))
            port = yield findPort(p_i);
        start(port, options);
    });
}
exports.default = default_1;
//# sourceMappingURL=headtracker_mode.js.map