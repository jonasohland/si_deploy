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
const rrcs_defs_1 = require("./rrcs_defs");
const util_1 = require("./util");
const Validation = __importStar(require("./validation"));
const log = Logger.get('RRCSMD');
class Sync extends core_1.ManagedNodeStateObject {
    constructor(sync) {
        super();
        this.data = sync;
    }
    addSlaves(slvs) {
        slvs.forEach(slv => {
            if (this.data.slaves.find(s => rrcs_defs_1.xpEqual(s.xp, slv.xp)) == null)
                this.data.slaves.push(slv);
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
    remove(name, obj) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    insert(name, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Sync(obj);
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
}
class RRCSNodeModule extends core_1.NodeModule {
    constructor() {
        super('rrcs');
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
            this.syncs.add(rrcs_defs_1.xpvtid(sync.master), new Sync(sync));
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
    start(remote) {
        this.rrcs = remote.getRequester('rrcs');
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
            .catch(err => {
            log.error('Could not load artist state' + err);
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
        this.xpsync_validator
            = Validation.getValidator(Validation.Validators.CrosspointSync);
    }
    init() {
        this.handleWebInterfaceEvent('add-xp-sync', (socket, node, data) => {
            if (this.xpsync_validator(data))
                node.rrcs.addXpSync(data);
            else
                this.server._webif.broadcastError('RRCS', 'Could not add new XPSync: missing data');
        });
    }
    joined(socket, topic) {
    }
    left(socket, topic) {
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