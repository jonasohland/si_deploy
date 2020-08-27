"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPCServer = void 0;
const fs_1 = __importDefault(require("fs"));
const net_1 = __importDefault(require("net"));
const split2_1 = __importDefault(require("split2"));
const Logger = __importStar(require("./log"));
const communication_1 = require("./communication");
const log = Logger.get('ICPIPE');
function isNull(v) {
    return v == null;
}
function _pipename(name) {
    if (process.platform == 'win32')
        return `\\\\.\\pipe\\spat_icom_ipc_${name}`;
    else
        return `/tmp/spat_icom_ipc_${name}`;
}
function _make_pipe(name, callback) {
    let pname = _pipename(name);
    if (!(process.platform == 'win32') && fs_1.default.existsSync(pname))
        fs_1.default.unlinkSync(pname);
    let server = net_1.default.createServer(callback).listen(_pipename(name));
    log.info('Created Pipe on ' + _pipename(name));
    return server;
}
class IPCServer extends communication_1.NodeMessageHandler {
    constructor(name = 'default') {
        super();
        this._create_server(name);
    }
    _create_server(name) {
        this._name = name;
        this._server = _make_pipe(this._name, pipe => {
            log.info("Established connection to local dsp process");
            this._pipe = pipe;
            this._server.close();
            // split incoming data at null terminators and process messages
            this._pipe.pipe(split2_1.default('\0')).on('data', this._on_msg.bind(this));
            this._pipe.on('close', () => {
                this.emit('closed');
                log.warn('Local pipe broke. Cleaning up.');
                this._create_server(this._name);
                this._pipe = null;
            });
            this.emit('open');
        });
    }
    _on_msg(msg) {
        this.emit('data', msg);
    }
    send(msg) {
        // Send a null terminated string. This is ugly, but it works for now...
        if (this._pipe) {
            this._pipe.write(msg + '\0');
            return true;
        }
        else
            return false;
    }
    connected() {
        return this._pipe != null;
    }
}
exports.IPCServer = IPCServer;
//# sourceMappingURL=ipc.js.map