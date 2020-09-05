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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RRCSNode = exports.RRCSServerModule = void 0;
const communication_1 = require("./communication");
const core_1 = require("./core");
const Logger = __importStar(require("./log"));
const rrcs_defs_1 = require("./rrcs_defs");
const rrcs_lex_1 = require("./rrcs_lex");
const util_1 = require("./util");
const Validation = __importStar(require("./validation"));
const log = Logger.get('RRCSMD');
class Sync extends core_1.ManagedNodeStateObject {
    constructor(sync, remote) {
        super();
        this.remote = remote;
        this.data = sync;
    }
    addSlaves(slvs) {
        slvs.forEach(slv => {
            if (this.data.slaves.find(s => rrcs_defs_1.xpEqual(s.xp, slv.xp)) == null) {
                log.debug(`Add slave xp ${rrcs_defs_1.__xpid(slv.xp)}`);
                this.data.slaves.push(slv);
            }
        });
    }
    removeSlaves(slvs) {
        slvs.forEach(slv => {
            let idx = this.data.slaves.findIndex(s => rrcs_defs_1.xpEqual(s.xp, slv.xp));
            if (idx != -1) {
                log.debug(`Remove slave xp ${rrcs_defs_1.__xpid(slv.xp)}`);
                this.data.slaves.splice(idx, 1);
            }
        });
    }
    setState(state) {
        this.data.state = state;
    }
    set(val) {
        return __awaiter(this, void 0, void 0, function* () {
            this.data = val;
        });
    }
    get() {
        return this.data;
    }
}
class SyncList extends core_1.ManagedNodeStateMapRegister {
    setRemote(remote) {
        this.remote = remote;
        this._object_iter().forEach((obj) => {
            obj.remote = remote;
        });
    }
    remove(name, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.remote) {
                yield this.remote.set('remove-xp-sync', name);
            }
            else
                log.warn(`Could not remove ${name} not connected to remote`);
        });
    }
    insert(name, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Sync(obj, this.remote);
        });
    }
    allSyncs() {
        return this._object_iter().map(obj => obj.get());
    }
    getSyncForMaster(sync) {
        if (typeof sync === 'string')
            return this._objects[sync];
        else
            return this._objects[rrcs_defs_1.xpvtid(sync.master)];
    }
    removeMaster(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.contains(id))
                yield this.removeObject(id);
        });
    }
}
class RRCSNodeModule extends core_1.NodeModule {
    constructor() {
        super('rrcs');
        this._config_syncs = [];
        this.syncs = new SyncList();
        this.add(this.syncs, 'syncs');
    }
    init() {
    }
    addXpSync(sync) {
        let existing = this.syncs.getSyncForMaster(sync);
        if (existing) {
            existing.addSlaves(sync.slaves);
            existing.save().catch(err => 'Could not update node ' + err);
        }
        else {
            this.syncs.add(rrcs_defs_1.xpvtid(sync.master), new Sync(sync, this.rrcs));
            this.syncs.save().catch(err => 'Could not update node ' + err);
        }
        this._webif_update_sync_list();
        this.rrcs.set('add-xp-sync', sync)
            .then(resp => {
            util_1.ignore(resp);
            this._server._webif.broadcastNotification('RRCS', 'Added new XPSync');
        })
            .catch(err => {
            this._server._webif.broadcastError('RRCS', 'Failed to add new XPSync ' + err);
        });
    }
    removeXPSync(id) {
        if (this.syncs.contains(id)) {
            this.syncs.removeMaster(id)
                .then(() => this.syncs.save())
                .then(() => {
                this._webif_update_sync_list();
            })
                .catch(err => {
                log.error(`Could not remove sync ${id}: ${err}`);
            });
        }
    }
    addSlaveToSync(msg) {
        let mastersync = this.syncs.getSyncForMaster(msg.masterid);
        if (mastersync) {
            mastersync.addSlaves([msg.slave]);
            mastersync.save().catch(err => log.error(`Could not write data to node ${err}`));
            this._webif_update_sync_list();
            this.rrcs
                .set('xp-sync-add-slaves', {
                master: msg.masterid,
                slaves: [msg.slave]
            })
                .catch(err => {
                log.error(`Could not write changes to rrcs ${err}`);
            });
        }
    }
    removeSlaveFromSync(msg) {
        let mastersync = this.syncs.getSyncForMaster(msg.masterid);
        if (mastersync) {
            mastersync.removeSlaves([msg.slave]);
            mastersync.save().catch(err => log.error(`Could not write data to node ${err}`));
            this._webif_update_sync_list();
            this.rrcs
                .set('xp-sync-remove-slaves', {
                master: msg.masterid,
                slaves: [msg.slave]
            })
                .catch(err => {
                log.error(`Could not write changes to rrcs ${err}`);
            });
        }
    }
    artistNodes() {
        return this._cached.artist_nodes;
    }
    start(remote) {
        this.rrcs = remote.getRequester('rrcs');
        this.syncs.setRemote(this.rrcs);
        this.save().catch(err => {
            log.error('Could write data to node ' + err);
        });
        this.rrcs.on('artist-online', this._artist_online.bind(this));
        this.rrcs.on('artist-offline', this._artist_offline.bind(this));
        this.rrcs.on('gateway-online', this._gateway_online.bind(this));
        this.rrcs.on('gateway-offline', this._gateway_offline.bind(this));
        this.rrcs.on('config-changed', this._config_changed.bind(this));
        this.rrcs.on('xp-states-changed', this._xp_states_changed.bind(this));
        this._reload_artist_state();
        this._set_sync_list();
    }
    joined(socket, topic) {
        socket.emit(`${this.myNodeId()}.rrcs.artists`, this._cached);
        socket.emit(`${this.myNodeId()}.rrcs.syncs`, this.syncs.allSyncs());
    }
    left(socket, topic) {
    }
    destroy() {
    }
    _artist_online() {
        this._server._webif.broadcastNotification('RRCS', 'Artist online');
        this._reload_artist_state();
        this._cached.artist = true;
        this._webif_update_connection();
    }
    _artist_offline() {
        this._server._webif.broadcastError('RRCS', 'Artist offline');
        this._cached.artist = false;
        this._webif_update_connection();
    }
    _gateway_online() {
        this._server._webif.broadcastNotification('RRCS', 'RRCS Gateway online');
        this._cached.gateway = true;
        this._webif_update_connection();
    }
    _gateway_offline() {
        this._server._webif.broadcastError('RRCS', 'RRCS Gateway offline');
        this._cached.gateway = false;
        this._webif_update_connection();
    }
    _config_changed() {
        this._server._webif.broadcastWarning('RRCS', 'Artist configuration changed');
        this._reload_artist_state();
    }
    _refresh_config_syncs() {
        return __awaiter(this, void 0, void 0, function* () {
            let ports = [];
            for (let node of this._cached.artist_nodes) {
                for (let port of node.ports)
                    ports.push(port);
            }
            let newsyncs = rrcs_lex_1.parsePorts(ports);
            for (let nsync of newsyncs) {
                let local_idx = this._config_syncs.findIndex(syn => rrcs_defs_1.xpvtid(syn.master) === rrcs_defs_1.xpvtid(nsync.master));
                if (local_idx == -1) {
                    this._config_syncs.push(nsync);
                    log.verbose(`Add new XPSync Master ${rrcs_defs_1.xpvtid(nsync.master)}`);
                    try {
                        let usersync = this.syncs.getSyncForMaster(rrcs_defs_1.xpvtid(nsync.master));
                        if (usersync) {
                            log.info(`Overwrite user defined XPSync with sync from config. ID: ${rrcs_defs_1.xpvtid(nsync.master)}`);
                            yield this.syncs.removeMaster(rrcs_defs_1.xpvtid(nsync.master));
                        }
                        yield this.rrcs.set('add-xp-sync', nsync);
                    }
                    catch (err) {
                        log.error('Error while adding XPSync from config ' + err);
                    }
                }
                else {
                    let localsync = this._config_syncs[local_idx];
                    if (localsync) {
                        for (let slave of nsync.slaves) {
                            let local_sl_index = localsync.slaves.findIndex(sl => rrcs_defs_1.xpVtEqual(sl, slave));
                            if (local_sl_index == -1) {
                                log.verbose(`Add slave ${rrcs_defs_1.__xpid(slave.xp)} to ${rrcs_defs_1.xpvtid(localsync.master)}`);
                                localsync.slaves.push(slave);
                                yield this.rrcs.set('xp-sync-add-slaves', {
                                    master: rrcs_defs_1.xpvtid(localsync.master),
                                    slaves: [slave]
                                });
                            }
                        }
                    }
                }
            }
            for (let osync of this._config_syncs) {
                let nidx = newsyncs.findIndex(syn => rrcs_defs_1.xpvtid(syn.master) === rrcs_defs_1.xpvtid(osync.master));
                if (nidx != -1) {
                    let nsync = newsyncs[nidx];
                    for (let slave of osync.slaves) {
                        try {
                            let nsync_slidx = nsync.slaves.findIndex(sl => rrcs_defs_1.xpVtEqual(sl, slave));
                            if (nsync_slidx == -1) {
                                log.verbose(`Remove slave ${rrcs_defs_1.__xpid(slave.xp)} from master ${rrcs_defs_1.xpvtid(osync.master)}`);
                                yield this.rrcs.set('xp-sync-remove-slaves', {
                                    master: rrcs_defs_1.xpvtid(osync.master),
                                    slaves: [slave]
                                });
                            }
                        }
                        catch (err) {
                            log.error(`Could not remove slave for ${rrcs_defs_1.xpvtid(osync.master)}: ${err}`);
                        }
                    }
                }
                else {
                    try {
                        log.verbose(`Remove XPSync master ${rrcs_defs_1.xpvtid(osync.master)}`);
                        yield this.rrcs.set('remove-xp-sync', rrcs_defs_1.xpvtid(osync.master));
                        let idx = this._config_syncs.findIndex(s => rrcs_defs_1.xpvtid(s.master) == rrcs_defs_1.xpvtid(osync.master));
                        this._config_syncs.splice(idx, 1);
                    }
                    catch (err) {
                        log.error(`Could not remove old sync ${rrcs_defs_1.xpvtid(osync.master)}: ${err}`);
                    }
                }
            }
        });
    }
    _xp_states_changed(msg) {
        let states = msg.data;
        states.forEach(state => {
            let sync = this.syncs.getSyncForMaster(state.xpid);
            if (sync)
                sync.setState(state.state);
        });
        this.publish('all', `${this.myNodeId()}.rrcs.xps`, states);
    }
    _reload_artist_state() {
        this.rrcs.request('state')
            .then(msg => {
            this._cached = msg.data;
            this.publish('all', `${this.myNodeId()}.rrcs.artists`, this._cached);
        })
            .then(() => this._refresh_config_syncs())
            .catch(err => {
            log.error(`Could not load artist state: ${err}`);
        });
    }
    _set_sync_list() {
        this.rrcs.set('xp-syncs', this.syncs.allSyncs());
    }
    _webif_update_sync_list() {
        this.publish('all', `${this.myNodeId()}.rrcs.syncs`, this.syncs.allSyncs());
    }
    _webif_update_connection() {
        this.publish('all', `${this.myNodeId()}.rrcs.connection`, this._cached.gateway, this._cached.artist);
    }
}
class RRCSServerModule extends core_1.ServerModule {
    constructor() {
        super('rrcs');
        this.validate_xpsync
            = Validation.getValidator(Validation.Validators.CrosspointSync);
        this.validate_add_xpvt_msg = Validation.getValidator(Validation.Validators.AddCrosspointVolumeTargetMessage);
    }
    init() {
        this.handleWebInterfaceEvent('add-xp-sync', (socket, node, data) => {
            if (this.validate_xpsync(data))
                node.rrcs.addXpSync(data);
            else
                this.server._webif.broadcastError('RRCS', 'Could not add new XPSync: missing data');
        });
        this.handleWebInterfaceEvent('xp-add-slave', (socket, node, data) => {
            if (this.validate_add_xpvt_msg(data))
                node.rrcs.addSlaveToSync(data);
            else
                this.server._webif.broadcastError('RRCS', 'Could not add new XPSync slave: missing data');
        });
        this.handleWebInterfaceEvent('xp-remove-slave', (socket, node, data) => {
            if (this.validate_add_xpvt_msg(data))
                node.rrcs.removeSlaveFromSync(data);
            else
                this.server._webif.broadcastError('RRCS', 'Could not remove XPSync slave: missing data');
        });
        this.handleWebInterfaceEvent('remove-xp-sync', (socket, node, data) => {
            node.rrcs.removeXPSync(data);
        });
    }
    joined(socket, topic) {
        if (topic === 'artist-nodes')
            this._update_webif_room(socket);
    }
    left(socket, topic) {
    }
    _update_webif_room(socket) {
        let anodes = [];
        for (let node of this.server.nodes(communication_1.NODE_TYPE.RRCS_NODE)) {
            for (let anode of node.rrcs.artistNodes()) {
                if (anodes.findIndex(n => n.id === anode.id) == -1)
                    anodes.push(anode);
            }
        }
        if (socket)
            socket.emit('rrcs.artist-nodes', anodes);
        else
            this.publish('artist-nodes', 'rrcs.artist-nodes', anodes);
    }
}
exports.RRCSServerModule = RRCSServerModule;
class RRCSNode extends core_1.Node {
    constructor(id) {
        super(id);
        this.rrcs = new RRCSNodeModule();
        this.add(this.rrcs);
    }
    init() {
    }
    start() {
    }
    destroy() {
    }
}
exports.RRCSNode = RRCSNode;
//# sourceMappingURL=rrcs_node.js.map