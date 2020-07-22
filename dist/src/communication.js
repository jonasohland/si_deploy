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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const events_1 = require("events");
const http = __importStar(require("http"));
const node_machine_id_1 = require("node-machine-id");
const socket_io_1 = __importDefault(require("socket.io"));
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const lodash_1 = __importDefault(require("lodash"));
const discovery_1 = require("./discovery");
const Logger = __importStar(require("./log"));
const util_1 = require("./util");
const log = Logger.get('WSCOMM');
function _log_msg(msg, input, forward = true) {
    let to_from = input ? ' TO ' : 'FROM';
    let target = forward ? 'DSP' : 'NODE_CONTROLLER';
    let ty = MessageMode[msg.mode];
    if (lodash_1.default.isObjectLike(msg.data))
        log.verbose(`Msg ${to_from} ${target}: [${msg.target} -> ${msg.field}] [${ty}] -> [data truncated]`);
    else
        log.verbose(`Msg ${to_from} ${target}: [${msg.target} -> ${msg.field}] [${ty}] -> ${msg.data}${msg.err ? `: ${msg.err}` : ""}`);
}
exports._log_msg = _log_msg;
/**
 * Create a unique identifier for this node user-chosen name.
 * This Identifier is unique for for every machine.
 * @param name name of this node
 */
function unique_node_id(name) {
    let idstring = node_machine_id_1.machineIdSync();
    return crypto_1.createHash('sha1').update(`${idstring}-${name}`).digest('base64');
}
var NODE_TYPE;
(function (NODE_TYPE) {
    NODE_TYPE[NODE_TYPE["DSP_NODE"] = 0] = "DSP_NODE";
    NODE_TYPE[NODE_TYPE["HTRK_BRIDGE_NODE"] = 1] = "HTRK_BRIDGE_NODE";
})(NODE_TYPE = exports.NODE_TYPE || (exports.NODE_TYPE = {}));
var MessageMode;
(function (MessageMode) {
    MessageMode[MessageMode["GET"] = 0] = "GET";
    MessageMode[MessageMode["SET"] = 1] = "SET";
    MessageMode[MessageMode["DEL"] = 2] = "DEL";
    MessageMode[MessageMode["ALC"] = 3] = "ALC";
    MessageMode[MessageMode["RSP"] = 4] = "RSP";
    MessageMode[MessageMode["EVT"] = 5] = "EVT";
})(MessageMode = exports.MessageMode || (exports.MessageMode = {}));
var SISessionState;
(function (SISessionState) {
    SISessionState[SISessionState["OFFLINE"] = 0] = "OFFLINE";
    SISessionState[SISessionState["CONNECT_NODE"] = 1] = "CONNECT_NODE";
    SISessionState[SISessionState["ONLINE"] = 2] = "ONLINE";
    SISessionState[SISessionState["RECONNECTING"] = 3] = "RECONNECTING";
})(SISessionState || (SISessionState = {}));
var SIClientState;
(function (SIClientState) {
    SIClientState[SIClientState["OFFLINE"] = 0] = "OFFLINE";
    SIClientState[SIClientState["CONNECTING"] = 1] = "CONNECTING";
    SIClientState[SIClientState["WAIT_SERVER"] = 2] = "WAIT_SERVER";
    SIClientState[SIClientState["ONLINE"] = 3] = "ONLINE";
    SIClientState[SIClientState["RECONNECTING"] = 4] = "RECONNECTING";
})(SIClientState || (SIClientState = {}));
const SIClientEvents = {
    EXCHANGE_IDS: '__exchange_id',
    DSP_ONLINE: '__dsp_online',
};
const SISessionEvents = {
    ACK: '__ack',
};
class NodeMessageInterceptor extends events_1.EventEmitter {
    event(name, payload) {
        this.emit('__event', name, payload);
    }
}
exports.NodeMessageInterceptor = NodeMessageInterceptor;
class NodeMessageHandler extends events_1.EventEmitter {
}
exports.NodeMessageHandler = NodeMessageHandler;
class Connection extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this._rejectors = [];
    }
    _do_request(req, tg, fld, timeout, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let self = this;
            return new Promise((resolve, reject) => {
                let tmt = setTimeout(() => {
                    let rejector_idx = self._rejectors.findIndex(rejctr => rejctr === reject);
                    if (rejector_idx != -1) {
                        self._rejectors.splice(rejector_idx, 1);
                        // log.info("Remove rejector because we timed out");
                    }
                    self.removeListener(tg, response_listener);
                    reject('timeout');
                }, timeout || 1000);
                let response_listener = (msg) => {
                    if (msg.field == fld && msg.mode != MessageMode.EVT) {
                        self.removeListener(tg, response_listener);
                        clearTimeout(tmt);
                        let rejector_idx = self._rejectors.findIndex(rejctr => rejctr === reject);
                        if (rejector_idx != -1) {
                            // log.info("Remove rejector because we received a response");
                            self._rejectors.splice(rejector_idx, 1);
                        }
                        if (msg.isError())
                            reject(new Error(msg.err));
                        else
                            resolve(msg);
                    }
                };
                let msg = (req) ? Message.Get(tg, fld) : Message.Set(tg, fld);
                msg.data = data;
                this._rejectors.push(reject);
                this.addListener(tg, response_listener);
                this.send(msg);
            });
        });
    }
    request(tg, fld, timeout, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._do_request(true, tg, fld, timeout, data);
        });
    }
    set(tg, fld, timeout, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._do_request(false, tg, fld, timeout, data);
        });
    }
    getRequester(target) {
        return new Requester(this, target);
    }
    decodeMessage(str) {
        let msg = Message.parse(str);
        _log_msg(msg, false);
        this.emit(msg.target, msg);
    }
    connectionFound() {
    }
    destroy() {
        this._rejectors.forEach(rej => rej("Connection closed"));
    }
}
exports.Connection = Connection;
class Message {
    constructor(tg, fld, md) {
        this.target = tg;
        this.field = fld;
        this.mode = md;
        this.data = null;
    }
    copy() {
        const m = new Message(this.target, this.field, this.mode);
        m.data = lodash_1.default.cloneDeep(this.data);
        return m;
    }
    toString() {
        return JSON.stringify({
            t: this.target,
            f: this.field,
            m: this.mode,
            d: this.data,
            e: this.err
        });
    }
    isError() {
        return this.err != undefined;
    }
    static Set(tg, fld) {
        return new Message(tg, fld, MessageMode.SET);
    }
    static Get(tg, fld) {
        return new Message(tg, fld, MessageMode.GET);
    }
    static Del(tg, fld) {
        return new Message(tg, fld, MessageMode.DEL);
    }
    static Alc(tg, fld) {
        return new Message(tg, fld, MessageMode.ALC);
    }
    static Rsp(tg, fld) {
        return new Message(tg, fld, MessageMode.RSP);
    }
    static Event(tg, fld) {
        return new Message(tg, fld, MessageMode.EVT);
    }
    static parse(data) {
        const obj = JSON.parse(data);
        const checkValue = (v, name) => {
            if (v == null)
                throw new Error('Invalid message, missing ' + name + ' field');
        };
        checkValue(obj.t, 'target');
        checkValue(obj.f, 'field');
        checkValue(obj.m, 'mode');
        // we do not require a data field anymore
        // checkValue(obj.d, 'data');
        const m = new Message(obj.t, obj.f, obj.m);
        m.data = obj.d;
        if (obj.e && obj.e.length > 0)
            m.err = obj.e;
        return m;
    }
    setInt(i) {
        this.data = Number.parseInt('' + i);
        return this;
    }
    setFloat(f) {
        this.data = Number.parseFloat('' + f);
        return this;
    }
    setString(s) {
        this.data = s;
        return this;
    }
    setArray(arr) {
        this.data = arr;
        return this;
    }
}
exports.Message = Message;
class TypedMessagePromise {
    constructor(p) {
        this._p = p;
    }
    _check_or_throw(ty, v) {
        if (typeof v == ty)
            return true;
        else
            throw ('Unexpected message of type ' + typeof v);
    }
    str() {
        return __awaiter(this, void 0, void 0, function* () {
            let v = (yield this._p).data;
            if (this._check_or_throw('string', v))
                return v;
        });
    }
    bool() {
        return __awaiter(this, void 0, void 0, function* () {
            let v = (yield this._p).data;
            if (this._check_or_throw('boolean', v))
                return v;
        });
    }
    obj() {
        return __awaiter(this, void 0, void 0, function* () {
            let v = (yield this._p).data;
            if (this._check_or_throw('object', v))
                return v;
        });
    }
    number() {
        return __awaiter(this, void 0, void 0, function* () {
            let v = (yield this._p).data;
            if (this._check_or_throw('number', v))
                return v;
        });
    }
    float() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.number();
        });
    }
    int() {
        return __awaiter(this, void 0, void 0, function* () {
            return Math.floor(yield this.number());
        });
    }
}
exports.TypedMessagePromise = TypedMessagePromise;
class Requester extends events_1.EventEmitter {
    constructor(connection, target) {
        super();
        this.request_target = target;
        this.connection = connection;
        // propagate events to the listener
        this.connection.on(target, (msg) => {
            if (msg.mode == MessageMode.EVT)
                this.emit(msg.field, msg);
        });
    }
    request(value, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.connection.request(this.request_target, value, 10000, data);
        });
    }
    requestTyped(value, data) {
        return new TypedMessagePromise(this.connection.request(this.request_target, value, 10000, data));
    }
    requestTmt(value, timeout, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.connection.request(this.request_target, value, timeout, data);
        });
    }
    requestTypedWithTimeout(value, timeout, data) {
        return new TypedMessagePromise(this.connection.request(this.request_target, value, timeout, data));
    }
    set(value, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.connection.set(this.request_target, value, 10000, data);
        });
    }
    setTyped(value, data) {
        return new TypedMessagePromise(this.connection.set(this.request_target, value, 10000, data));
    }
    setTmt(value, timeout, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.connection.set(this.request_target, value, timeout, data);
        });
    }
    setTypedWithTimeout(value, timeout, data) {
        return new TypedMessagePromise(this.connection.set(this.request_target, value, timeout, data));
    }
    destroy() {
        this.connection.removeAllListeners(this.request_target);
    }
}
exports.Requester = Requester;
;
/**
 * Represents a connection to a server in the Node
 */
class SINodeWSClient {
    constructor(config, handler) {
        this._state = SIClientState.OFFLINE;
        this._new_socks = [];
        this._ws_interceptors = {};
        this._msg_interceptors = {};
        this._handler = handler;
        this._handler.on('data', this._on_ipc_msg.bind(this));
        this._id = {
            name: config.node_name,
            id: unique_node_id(config.node_name),
            type: NODE_TYPE.DSP_NODE
        };
        log.info(`Browsing for si-servers on ${util_1.defaultIF(config.interface)}`);
        this._browser = discovery_1.getServerBrowser(config.interface);
        this._browser.on('serviceUp', this._on_service_discovered.bind(this));
        this._browser.start();
    }
    _on_service_discovered(service) {
        log.info('Discovered new \'si-server\' service with:');
        for (let addr of service.addresses)
            log.info('  addr: ' + addr);
        log.info('and port ' + service.port);
        log.info('Full name: ' + service.fullname);
        switch (this._state) {
            case SIClientState.OFFLINE: return this._service_connect(service);
            case SIClientState.RECONNECTING:
                return this._service_reconnect(service);
            default:
                log.warn('Already connected or currently establishing a connection. Ignoring this service');
        }
    }
    _service_connect(service) {
        log.info('Try connecting to: ');
        for (let addr of service.addresses) {
            let uri = `ws://${addr}:${service.port}`;
            log.info('    ' + uri);
            let newsock = socket_io_client_1.default(uri);
            newsock.on('connect', this._on_socket_connect.bind(this, newsock));
            newsock.on('close', this._on_temp_socket_close.bind(this, newsock));
            this._new_socks.push(newsock);
        }
        this._state = SIClientState.CONNECTING;
    }
    _service_reconnect(service) {
        if (this._sock)
            this._sock.close();
        this._sock = null;
        this._state = SIClientState.CONNECTING;
        this._service_connect(service);
    }
    _on_socket_connect(socket) {
        log.info('Socket connected');
        if (this._state == SIClientState.CONNECTING) {
            this._sock
                = this._new_socks.splice(this._new_socks.indexOf(socket), 1)[0];
            this._sock.on('disconnect', this._on_socket_close.bind(this));
            this._sock.on('msg', this._on_msg.bind(this));
            this._sock.emit(SIClientEvents.EXCHANGE_IDS, this._id);
            this._state = SIClientState.WAIT_SERVER;
            this._sock.on(SISessionEvents.ACK, this._on_ack.bind(this));
        }
        else if (this._state == SIClientState.RECONNECTING) {
            this._sock.emit(SIClientEvents.EXCHANGE_IDS, this._id);
            this._state = SIClientState.WAIT_SERVER;
        }
        else {
            while (this._new_socks.length)
                this._new_socks.shift().close();
        }
    }
    _on_ack() {
        log.info('Received ACK from server. We are online!');
        this._state = SIClientState.ONLINE;
    }
    _on_socket_close(reason) {
        log.info('Connection lost. Reason: ' + reason);
        this._state = SIClientState.RECONNECTING;
        if (reason === 'io server disconnect')
            this._sock.connect();
    }
    _on_temp_socket_close(socket, reason) {
        let idx = this._new_socks.findIndex(s => s === socket);
        if (idx != -1) {
            log.info(`Remove temp connection ${reason}`);
            this._new_socks.splice(idx, 1);
        }
    }
    _on_msg(msg) {
        this._on_msg_impl(msg, true);
    }
    _on_ipc_msg(msg) {
        this._on_msg_impl(msg, false);
    }
    _ws_return_error(original_message, err) {
        let newmsg = Message.Rsp(original_message.target, original_message.field);
        newmsg.data = '__ERROR__';
        newmsg.err = err;
        this._sock.emit('msg', newmsg.toString());
    }
    _on_msg_impl(msg, to_ipc) {
        try {
            let m = Message.parse(msg);
            let intc;
            if (to_ipc)
                intc = this._ws_interceptors[m.target];
            else
                intc = this._msg_interceptors[m.target];
            _log_msg(m, to_ipc, intc == null);
            if (intc)
                intc.handleMessage(m, !to_ipc)
                    .then(this._intc_handle_return.bind(this, m, to_ipc))
                    .catch(this._intc_handle_return_error.bind(this, m, to_ipc));
            else {
                if (to_ipc) {
                    if (!this._handler.send(msg))
                        this._ws_return_error(m, "DSP process offline");
                }
                else
                    this._sock.emit('msg', msg);
            }
        }
        catch (err) {
            log.error("Something went wrong while delivering message: " + err);
            // not shure what to do here...
        }
    }
    _intc_handle_return(msg, to_ipc, data) {
        msg.mode = MessageMode.RSP;
        msg.data = data;
        _log_msg(msg, false, false);
        if (to_ipc)
            this._sock.emit('msg', msg.toString());
        else
            this._handler.send(msg.toString());
    }
    _intc_handle_return_error(msg, to_ipc, data) {
        let newmsg = Message.Rsp(msg.target, msg.field);
        newmsg.err = data;
        newmsg.data = "__ERROR__";
        _log_msg(newmsg, false, false);
        if (to_ipc)
            this._sock.emit('msg', newmsg.toString());
        else
            this._handler.send(newmsg.toString());
    }
    _intc_emit_event(intc, name, payload) {
        if (this._sock) {
            let msg = Message.Event(intc.target(), name);
            msg.data = payload;
            _log_msg(msg, false, false);
            this._sock.emit('msg', msg.toString());
        }
    }
    addIPCInterceptor(intc) {
        this._msg_interceptors[intc.target()] = intc;
    }
    addWSInterceptor(intc) {
        this._ws_interceptors[intc.target()] = intc;
        intc.on('__event', this._intc_emit_event.bind(this, intc));
    }
}
exports.SINodeWSClient = SINodeWSClient;
/**
 * Represents the connection to a node in the SI server
 */
class SIServerWSSession extends Connection {
    constructor(socket, server) {
        super();
        this._state = SISessionState.OFFLINE;
        this._sock = socket;
        this._server = server;
        this._sock.on(SIClientEvents.EXCHANGE_IDS, this._on_exchange_ids.bind(this));
        this._sock.on('msg', this._on_msg.bind(this));
        this._sock.on('disconnect', this._on_disconnect.bind(this));
        this._state = SISessionState.CONNECT_NODE;
    }
    begin() {
        throw new Error('Method not implemented.');
    }
    send(msg) {
        if (this._sock)
            this._sock.emit('msg', msg.toString());
    }
    isLocal() {
        return false;
    }
    _on_exchange_ids(id) {
        if (this._state == SISessionState.CONNECT_NODE) {
            log.info('Got EXCHANGE_IDS message from ' + id.name);
            this._id = id;
            this._state = SISessionState.ONLINE;
            this._sock.emit(SISessionEvents.ACK);
            this.emit('online');
            log.info('Sent ACK message to node. Node is online!');
        }
        else {
            log.error('Unexpected exchange_ids message, trashing connection');
            this.close();
        }
    }
    _on_disconnect() {
        this.emit('offline');
        this._server._on_disconnect(this);
    }
    _on_msg(msg) {
        try {
            let m = Message.parse(msg);
            this.emit(m.target, m);
        }
        catch (err) {
            log.error('Could not parse message: ' + err);
        }
    }
    id() {
        return this._id;
    }
    close() {
        this._sock.disconnect();
        this._server._on_disconnect(this);
    }
}
exports.SIServerWSSession = SIServerWSSession;
/**
 * Communications server class
 */
class SIServerWSServer extends events_1.EventEmitter {
    /**
     * construct a new WebSocket server to communicate with SI DSP Nodes
     * @param options options, merged from config file and command line options
     */
    constructor(config) {
        super();
        this._new_sessions = [];
        this._sessions = [];
        this._http = http.createServer();
        this._io = socket_io_1.default.listen(this._http);
        this._io.on('connection', this._on_connection.bind(this));
        this._mdns_advertiser
            = discovery_1.getServerAdvertiser(config.server_port, config.interface);
        this._http.listen(config.server_port, config.interface);
        this._http.on('listening', () => {
            log.info(`Listening on ${util_1.defaultIF(config.interface)}:${config.server_port}`);
        });
        this._mdns_advertiser.start();
        log.info('Added mdns advertisement for this server');
    }
    _on_connection(socket) {
        let session = new SIServerWSSession(socket, this);
        session.on('online', this._on_session_online.bind(this, session));
        this._new_sessions.push(session);
        this.emit('new-connection', session);
    }
    _on_disconnect(session) {
        let idx = this._sessions.findIndex(s => s === session);
        if (idx != -1) {
            log.info('Removing connection for ' + session.id().name);
            session.destroy();
            this.emit('close-connection', session);
            this.emit('remove-session', session);
        }
    }
    _on_session_online(session) {
        this.addFromNewSessions(session);
    }
    addFromNewSessions(session) {
        if (this._sessions.includes(session)) {
            log.info(`Session for ${session.id()
                .name} already exists and is online. Dropping connection.`);
            session.close();
        }
        else {
            log.info(`Established connection with ${session.id().name}`);
            let idx = this._new_sessions.findIndex(s => s.id() && (s.id().id
                == session.id().id));
            if (idx != -1)
                this._new_sessions.splice(idx, 1);
            else
                log.warn('Could not find session in preparation stage. Something is wrong here');
            this._sessions.push(session);
            this.emit('add-session', session);
        }
    }
    destruct() {
        return this._mdns_advertiser.stop();
    }
}
exports.SIServerWSServer = SIServerWSServer;
//# sourceMappingURL=communication.js.map