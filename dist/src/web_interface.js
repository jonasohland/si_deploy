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
const data_1 = require("./data");
const discovery_1 = require("./discovery");
const web_interface_defs_1 = require("./web_interface_defs");
const lodash_1 = __importDefault(require("lodash"));
const log = Logger.get('WEBINT');
// join ${nodeid}.${service}.${topic}
// leave ${nodeid}.${service}.${topic}
// join server.${service}.${topic}
// leave server.${service}.${topic}
function logany(...things) {
    log.debug([...things].join(' '));
}
class WebInterfaceClient {
    constructor(socket, server) {
        this._node_memberships = [];
        this._server_memberships = [];
        this._socket = socket;
        this._server = server;
        log.info(`New WebInterface connection from agent ${this._socket.handshake.headers['user-agent']}`);
        this._socket.on('join-node', this._on_join_node.bind(this));
        this._socket.on('leave-node', this._on_leave_node.bind(this));
        this._socket.on('join-server', this._on_join_server.bind(this));
        this._socket.on('leave-server', this._on_leave_server.bind(this));
        this._socket.on('disconnect', this._on_disconnect.bind(this));
    }
    _on_join_node(nodeid, module, topic) {
        let room = web_interface_defs_1.nodeRoomName(nodeid, module, topic);
        this._socket.join(room, (err) => {
            if (err)
                log.error(`Socket could not join room: ` + err);
            else {
                log.verbose(`WebIF joined room ${room}`);
                let memi = this._node_memberships.findIndex(mem => lodash_1.default.isEqual(mem, { nodeid, module, topic }));
                if (memi == -1)
                    this._node_memberships.push({ nodeid, module, topic });
                this._server._notify_join_node_room(this._socket, nodeid, module, topic);
            }
        });
    }
    _on_leave_node(nodeid, module, topic) {
        let room = web_interface_defs_1.nodeRoomName(nodeid, module, topic);
        this._socket.leave(room, (err) => {
            if (err)
                log.error(`WebIF could not leave room: ` + err);
            else {
                log.verbose(`WebIF left room ${room}`);
                let memi = this._node_memberships.findIndex(mem => lodash_1.default.isEqual(mem, { nodeid, module, topic }));
                if (memi != -1)
                    this._node_memberships.splice(memi, 1);
                this._server._notify_leave_node_room(this._socket, nodeid, module, topic);
            }
        });
    }
    _on_join_server(module, topic) {
        let room = web_interface_defs_1.serverRoomName(module, topic);
        this._socket.join(room, (err) => {
            if (err)
                log.error(`Socket could not join room: ` + err);
            else {
                log.verbose(`WebIF joined room ${room}`);
                let memi = this._server_memberships.findIndex(mem => lodash_1.default.isEqual(mem, { module, topic }));
                if (memi == -1)
                    this._server_memberships.push({ module, topic });
                this._server._notify_join_server_room(this._socket, module, topic);
            }
        });
    }
    _on_leave_server(module, topic) {
        let room = web_interface_defs_1.serverRoomName(module, topic);
        this._socket.leave(room, (err) => {
            if (err)
                log.error(`Socket could not leave room: ` + err);
            else {
                log.verbose(`WebIF left room ${room}`);
                let memi = this._server_memberships.findIndex(mem => lodash_1.default.isEqual(mem, { module, topic }));
                if (memi != -1)
                    this._server_memberships.splice(memi, 1);
                this._server._notify_leave_server_room(this._socket, module, topic);
            }
        });
    }
    _on_disconnect() {
        this._node_memberships.forEach(membership => {
            log.verbose(`Socket disconnected, leaving room ${web_interface_defs_1.nodeRoomName(membership.nodeid, membership.module, membership.topic)}`);
            this._server._notify_leave_node_room(this._socket, membership.nodeid, membership.module, membership.topic);
        });
        this._server_memberships.forEach(membership => {
            log.verbose(`Socket disconnected, leaving room ${web_interface_defs_1.serverRoomName(membership.module, membership.topic)}`);
            this._server._notify_leave_server_room(this._socket, membership.module, membership.topic);
        });
    }
    isMemeberOfServerRoom(module, topic) {
        return this._socket.rooms[web_interface_defs_1.serverRoomName(module, topic)] != null;
    }
    isMemeberOfNodeRoom(nodeid, module, topic) {
        return this._socket.rooms[web_interface_defs_1.nodeRoomName(nodeid, module, topic)] != null;
    }
    socket() {
        return this._socket;
    }
}
class WebInterface extends data_1.ServerModule {
    constructor(options) {
        super('webinterface');
        this._webif_root = __dirname + '/../../../interface/dist';
        this._clients = [];
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
            this._web_interface_advertiser = discovery_1.getWebinterfaceAdvertiser(options.webserver_port, options.web_interface);
            this._web_interface_advertiser.start();
            log.info(`Serving webinterface on ${util_1.defaultIF(options.web_interface)}:${options.webserver_port}`);
        }
        this.io = socket_io_1.default.listen(45040);
        this.io.on('connect', socket => {
            this._handlers.forEach(handler => socket.on(handler.event, handler.handler.bind(handler.thisarg, socket)));
            socket.on('disconnect', () => {
                let idx = this._clients.findIndex(cl => cl.socket() == socket);
                if (idx != -1)
                    this._clients.splice(idx, 1);
            });
            this._clients.push(new WebInterfaceClient(socket, this._server));
        });
    }
    joined(socket) {
    }
    left(socket) {
    }
    init() {
        this.events.on('webif-node-notify', (nodeid, msg) => {
            let node = this.getNode(nodeid);
            if (node) {
                this.broadcastNotification(`NODE ${node.name()}`, msg);
                log.info(`NODE ${node.name()}: ${msg}`);
            }
            else
                log.error(`Could not deliver notification from node ${nodeid}: Node not found. MSG: ${msg}`);
        });
        this.events.on('webif-node-warning', (nodeid, msg) => {
            let node = this.getNode(nodeid);
            if (node) {
                this.broadcastWarning(`NODE ${node.name()}`, msg);
                log.warn(`NODE ${node.name()}: ${msg}`);
            }
            else
                log.error(`Could not deliver notification from node ${nodeid}: Node not found. MSG: ${msg}`);
        });
        this.events.on('webif-node-error', (nodeid, msg) => {
            let node = this.getNode(nodeid);
            if (node) {
                this.broadcastError(`NODE ${node.name()}`, msg);
                log.error(`NODE ${node.name()}: ${msg}`);
            }
            else
                log.error(`Could not deliver notification from node ${nodeid}: Node not found. MSG: ${msg}`);
        });
    }
    checkServerHasSubscribers(module, topic) {
        for (let client of this._clients) {
            if (client.isMemeberOfServerRoom(module, topic))
                return true;
        }
        return false;
    }
    checkNodeHasSubscribers(nodeid, module, topic) {
        for (let client of this._clients) {
            if (client.isMemeberOfNodeRoom(nodeid, module, topic))
                return true;
        }
        return false;
    }
    doPublishNode(nodeid, module, topic, event, ...data) {
        this.io.to(web_interface_defs_1.nodeRoomName(nodeid, module, topic)).emit(event, ...data);
    }
    doPublishServer(module, topic, event, ...data) {
        this.io.to(web_interface_defs_1.serverRoomName(module, topic)).emit(event, ...data);
    }
    attachServer(server) {
        this._server = server;
    }
    reportDispatchError(error_string, command) {
    }
    error(err) {
        this.broadcastError("Server Error", err);
    }
    attachHandler(thisarg, module, event, handler) {
        log.debug(`Attach handler -${module}.${event}`);
        this._handlers.push({ thisarg, handler, event: `-${module}.${event}` });
    }
    broadcastNotification(title, message) {
        this.io.emit('notification', title, message);
    }
    broadcastNodeNotification(node, message) {
        this.broadcastNotification(node.name(), message);
    }
    broadcastWarning(title, message) {
        this.io.emit('warning', title, message);
    }
    broadcastError(title, err) {
        if (err instanceof Error) {
            this.io.emit('error', title, err.message);
        }
        else if (typeof err == 'string') {
            this.io.emit('error', title, err);
        }
        else {
            log.error("Unrecognized error type: Error: " + err);
        }
    }
    broadcastEvent(title, ...data) {
        this.io.emit(title, ...data);
    }
}
exports.default = WebInterface;
//# sourceMappingURL=web_interface.js.map