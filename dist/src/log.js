"use strict";
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
const winston_1 = __importDefault(require("winston"));
const winston_transport_1 = __importDefault(require("winston-transport"));
const files = __importStar(require("./files"));
const cformat = winston_1.default.format.printf(({ level, message, label, timestamp, tc }) => {
    let c;
    switch (level) {
        case 'verbose':
            c = chalk_1.default.blue;
            break;
        case 'error':
            c = chalk_1.default.red;
            break;
        case 'warn':
            c = chalk_1.default.yellow;
            break;
        case 'info':
            c = chalk_1.default.cyan;
            break;
        case 'notice':
            c = chalk_1.default.greenBright;
            break;
        default:
            c = (str) => str;
            break;
    }
    return `[${c(chalk_1.default.bold(label))}] TC: ${c(chalk_1.default.bold(tc))} RT: ${c(chalk_1.default.bold(new Date(timestamp).toLocaleTimeString()))} MSG: ${c(message)}`;
});
class RemoteConsoleTransport extends winston_transport_1.default {
    constructor() {
        super();
        this.setMaxListeners(20);
    }
    attach(s) {
        this.server = s;
        this.server.on('connection', socket => {
            socket.on('log.request', () => {
            });
        });
        this.server.sockets.emit('log.attached');
    }
    log(info, callback) {
        if (this.server)
            this.server.sockets.emit('global_log', {
                message: info[Symbol.for('message')],
                level: info[Symbol.for('level')]
            });
        callback();
    }
}
const tcreader = {};
const log_lvl = {
    v: process.env.SI_LOG_LVL || 'info'
};
const transports = [];
let log = {};
const tcformat = winston_1.default.format((info, options) => {
    if (tcreader.rd) {
        if (tcreader.rd._running)
            info.tc = tcreader.rd._currenttc;
        else
            info.tc = 'stopped';
    }
    else
        info.tc = 'stopped';
    return info;
});
const logfilename = files.configFileDir('logs/')
    + new Date(Date.now()).toISOString().replace(/[.,:]/g, '_')
    + '.log';
function _init() {
    log.l = get('LOGGER', true);
    log.l.debug('Writing logs to ' + logfilename);
}
function setLogDevice(tcr) {
    tcreader.rd = tcr;
}
exports.setLogDevice = setLogDevice;
function setLogLVL(lvl) {
    const lvls = ['crit', 'error', 'warning', 'notice', 'info', 'debug'];
    if (lvl >= lvls.length || lvl < 0) {
        console.error(`Log level out of range [${0},${lvls.length - 1}]`);
        process.exit(5);
    }
    console.log('Starting logging service with log levl: ' + lvls[lvl]);
    log_lvl.v = lvls[lvl];
    transports.forEach(t => t.level = lvls[lvl]);
}
exports.setLogLVL = setLogLVL;
function get(module_name, init) {
    if (!init && log.l == undefined)
        _init();
    if (!init)
        log.l.debug('Initializing logger for ' + module_name);
    let cslt = new winston_1.default.transports.Console({
        level: log_lvl.v,
        format: winston_1.default.format.combine(tcformat(), winston_1.default.format.label({ label: module_name }), winston_1.default.format.timestamp(), cformat),
    });
    let filet = new winston_1.default.transports.File({
        filename: logfilename,
        level: 'debug',
        format: winston_1.default.format.combine(tcformat(), winston_1.default.format.json(), winston_1.default.format.timestamp())
    });
    transports.push(cslt);
    return winston_1.default.createLogger({ transports: [cslt, filet] });
}
exports.get = get;
//# sourceMappingURL=log.js.map