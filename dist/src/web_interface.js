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
const connect_history_api_fallback_1 = __importDefault(require("connect-history-api-fallback"));
const express_1 = __importDefault(require("express"));
const http = __importStar(require("http"));
const socket_io_1 = __importDefault(require("socket.io"));
const Logger = __importStar(require("./log"));
const util_1 = require("./util");
const log = Logger.get('WEBINT');
function logany(...things) {
    log.debug([...things].join(' '));
}
class WebInterface {
    constructor(options) {
        this._webif_root = __dirname + '/../../../interface/dist';
        this._handlers = [];
        this._expressapp = express_1.default();
        this._http = http.createServer(this._expressapp);
        let static_middleware = express_1.default.static(this._webif_root);
        this._expressapp
            .use((req, res, next) => {
            log.debug(`Request: ` + req.path);
            next();
        });
        this._expressapp.use(static_middleware);
        this._expressapp.use(connect_history_api_fallback_1.default({ disableDotRule: true, verbose: true, logger: logany }));
        this._expressapp.use(static_middleware);
        if (options.webserver !== false) {
            this._http.listen(options.webserver_port, options.web_interface);
            log.info(`Serving webinterface on ${util_1.defaultIF(options.web_interface)}:${options.webserver_port}`);
        }
        this.io = socket_io_1.default.listen(45040);
        this.io.on('connect', socket => {
            this._handlers.forEach(handler => socket.on(handler.event, handler.handler.bind(handler.thisarg, socket)));
        });
    }
    reportDispatchError(error_string, command) {
    }
    error(err) {
        if (err instanceof Error) {
            this.io.emit('error', err.message);
        }
        else if (typeof err == 'string') {
            this.io.emit('error', err);
        }
    }
    attachHandler(thisarg, module, event, handler) {
        log.debug(`Attach handler -${module}.${event}`);
        this._handlers.push({ thisarg, handler, event: `-${module}.${event}` });
    }
}
exports.default = WebInterface;
//# sourceMappingURL=web_interface.js.map