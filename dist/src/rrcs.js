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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RRCSService = exports.RRCSServer = void 0;
const eventemitter2_1 = require("eventemitter2");
const fs = __importStar(require("fs"));
const xmlrpc_1 = __importDefault(require("xmlrpc"));
const files_1 = require("./files");
const Logger = __importStar(require("./log"));
const rrcs_defs_1 = require("./rrcs_defs");
const log = Logger.get('RRCSSV');
const artlog = Logger.get('ARTIST');
function logArtistCall(method, params) {
    artlog.debug(`Call artist method ${method} with ${params} args`);
}
class ArtistNodePort {
    constructor(srv, info) {
        this._srv = srv;
        this.info = info;
    }
    destroy() {
    }
}
class ArtistNode {
    constructor(srv, id) {
        this._ports = [];
        this._srv = srv;
        this._id = id;
    }
    getPort(portidx, input, output) {
        return this._ports.find(port => port.info.Port == portidx
            && port.info.Input === input
            && port.info.Output === output);
    }
    getPortFromInfo(info) {
        return this.getPort(info.Port, info.Input, info.Output);
    }
    removePort(portidx, input, output) {
        let idx = this._ports.indexOf(this.getPort(portidx, input, output));
        if (idx != -1)
            return this._ports.splice(idx, 1);
    }
    addPort(info) {
        this._ports.push(new ArtistNodePort(this._srv, info));
    }
    reset() {
        while (this._ports.length)
            this._ports.pop().destroy();
    }
    destroy() {
        this.reset();
    }
    nodeID() {
        return this._id;
    }
}
function crosspointToParams(xp, net) {
    return [
        net - 1, xp.Source.Node, xp.Source.Port, net - 1, xp.Destination.Node,
        xp.Destination.Port
    ];
}
function crosspointFromParams(params) {
    return {
        Source: { Node: params[1], Port: params[2], IsInput: true },
        Destination: { Node: params[4], Port: params[5], IsInput: false }
    };
}
function pad(num, size) {
    var s = '000000000' + num;
    return s.substr(s.length - size);
}
class RRCSServer extends eventemitter2_1.EventEmitter2 {
    constructor(rrcs_host, rrcs_port) {
        super();
        this._artist_online = false;
        this._gateway_online = false;
        this._local_port = 61505;
        this._local_ip = '192.168.178.91';
        this._trs_cnt = 0;
        this._nodes = [];
        log.info('Server start listen');
        this._srv = xmlrpc_1.default.createServer({ host: '0.0.0.0', port: this._local_port }, () => {
            log.info('RRCS Server listening');
            this._cl = xmlrpc_1.default.createClient({ host: rrcs_host, port: rrcs_port });
            log.info(`Client connecting to ${rrcs_host}:${rrcs_port}`);
            this._load_cached();
            this._ping_artist();
        });
        this._srv.on('ConfigurationChange', (err, params, cb) => {
            if (err) {
                log.error('ConfigurationChange error: ' + err);
                return;
            }
            this._reset()
                .then(() => {
                log.info('Artist reset after config change');
                this.onArtistConfigurationChanged();
            })
                .catch(err => {
                log.info('Failed to reset Artist ' + err);
            });
            cb(null, [params[0]]);
        });
        this._srv.on('XpVolumeChange', (err, params, cb) => {
            if (err) {
                log.error('XpVolumeChange error: ' + err);
                return;
            }
            this.onXpValueChanged(params[1][0], params[1][0].SingleVolume, params[1][0].ConferenceVolume);
            cb(null, [params[0]]);
        });
        this._srv.on('CrosspointChange', (err, params, cb) => {
            let xp_keys = Object.keys(params[2]);
            let out = [];
            for (let key of xp_keys) {
                out.push({
                    xp: crosspointFromParams(params[2][key]),
                    state: params[2][key][6]
                });
            }
            this.onXpsChanged(out);
            cb(null, [params[0]]);
        });
    }
    rrcsAvailable() {
    }
    getArtistNode(id) {
        return this._nodes.find(node => node.nodeID() == id);
    }
    getAllNodes() {
        return this._nodes.map(node => {
            return {
                id: node.nodeID(), ports: node._ports.map(port => port.info)
            };
        });
    }
    getArtistState() {
        return {
            gateway: this._gateway_online,
            artist: this._artist_online,
            artist_nodes: this.getAllNodes()
        };
    }
    getGatewayState() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._perform_method_call('GetState', this._get_trs_key());
        });
    }
    setStateWorking() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._perform_method_call('SetStateWorking', this._get_trs_key());
        });
    }
    setStateStandby() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._perform_method_call('SetStateStandby', this._get_trs_key());
        });
    }
    getAlive() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._perform_method_call('GetAlive', this._get_trs_key());
        });
    }
    getArtistConnected() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this._perform_method_call('IsConnectedToArtist', this._get_trs_key());
            return data.IsConnected;
        });
    }
    setXPVolume(xp, volume, single, conf) {
        return __awaiter(this, void 0, void 0, function* () {
            log.debug(`Set XP volume (${(single == null) ? 'single'
                : (single ? 'single' : 'conf')}) ${rrcs_defs_1.__xpid(xp)} - ${((volume === 0) ? 'mute' : ((volume - 230) / 2) + 'dB')}`);
            this._perform_method_call('SetXPVolume', this._get_trs_key(), ...crosspointToParams(xp, 2), (single == null) ? true : single, conf || false, volume);
        });
    }
    getXpStatus(xp) {
        return __awaiter(this, void 0, void 0, function* () {
            let resp = yield this._perform_method_call('GetXpStatus', this._get_trs_key(), ...crosspointToParams(xp, 2));
            return resp[2];
        });
    }
    getActiveXps() {
        return __awaiter(this, void 0, void 0, function* () {
            let resp = yield this._perform_method_call('GetAllActiveXps', this._get_trs_key());
            let out = [];
            for (let key of Object.keys(resp)) {
                if (key.startsWith('XP#'))
                    out.push(crosspointFromParams(resp[key]));
            }
            return out;
        });
    }
    getXpsInRange(xp) {
        return __awaiter(this, void 0, void 0, function* () {
            let resp = yield this._perform_method_call('GetActiveXpsRange', this._get_trs_key(), ...crosspointToParams(xp, 2));
            let out = [];
            for (let key of Object.keys(resp)) {
                if (key.startsWith('XP#'))
                    out.push(crosspointFromParams(resp[key]));
            }
            return out;
        });
    }
    setXP(xp) {
        return __awaiter(this, void 0, void 0, function* () {
            log.debug(`Set XP ${rrcs_defs_1.__xpid(xp)}`);
            return this._perform_method_call('SetXp', this._get_trs_key(), ...crosspointToParams(xp, 2));
        });
    }
    killXP(xp) {
        return __awaiter(this, void 0, void 0, function* () {
            log.debug(`Kill XP ${rrcs_defs_1.__xpid(xp)}`);
            return this._perform_method_call('KillXp', this._get_trs_key(), ...crosspointToParams(xp, 2));
        });
    }
    _perform_method_call(method, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            logArtistCall(method, params.length);
            return new Promise((res, rej) => {
                this._cl.methodCall(method, params, (err, value) => {
                    if (err)
                        rej(err);
                    else {
                        artlog.debug(`Call to ${method} returned with ${value.length} args`);
                        res(value);
                    }
                });
            });
        });
    }
    _modify_notifications(method, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._perform_method_call(method, this._get_trs_key(), this._local_ip, this._local_port, ...args);
        });
    }
    _setup_notifications() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._modify_notifications('RegisterForEventsEx', {
                'XpVolumeChange': true,
                'ConfigurationChange': true,
                'XpChange': true
            });
        });
    }
    resetXPVolNotifyRegistry() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._modify_notifications('XpVolumeChangeRegistryReset', []);
        });
    }
    addToXPVolNotifyRegistry(xps) {
        return __awaiter(this, void 0, void 0, function* () {
            xps = xps.filter(xp => !rrcs_defs_1.isWildcardXP(xp));
            if (xps.length)
                return this._modify_notifications('XpVolumeChangeRegistryAdd', xps);
        });
    }
    removeFromXPVolNotifyRegistry(xps) {
        return __awaiter(this, void 0, void 0, function* () {
            xps = xps.filter(xp => !rrcs_defs_1.isWildcardXP(xp));
            if (xps.length)
                return this._modify_notifications('XpVolumeChangeRegistryRemove', xps);
        });
    }
    _gateway_went_online() {
        this.emit('gateway-online');
    }
    _gateway_went_offline() {
        this.emit('gateway-offline');
    }
    _artist_went_online() {
        this._reset()
            .then(() => this.onArtistOnline())
            .then(() => {
            log.info('Artist initialized');
            this.emit('artist-online');
        })
            .catch(err => {
            log.warn('Could not initiaize Artist ' + err);
            this._artist_online = false;
        });
    }
    _artist_went_offline() {
        this.emit('artist-offline');
    }
    _begin_connect() {
        this._reset()
            .then(() => {
            log.info('Connected to Artist');
        })
            .catch(err => {
            log.error('Could not connect to artist ' + err);
            this._connect_retry_timeout
                = setTimeout(this._begin_connect.bind(this), 5000);
        });
    }
    _ping_artist() {
        this.getAlive()
            .then(() => this.getArtistConnected())
            .then((is_connected) => {
            if (!this._gateway_online) {
                this._gateway_online = true;
                this._gateway_went_online();
            }
            if (is_connected) {
                if (!this._artist_online) {
                    log.info('Artist is online');
                    this._artist_online = true;
                    this._artist_went_online();
                }
            }
            else {
                log.debug('Gateway not connected to artist');
                if (this._artist_online) {
                    log.warn('Artist is offline');
                    this._artist_online = false;
                    this._artist_went_offline();
                }
            }
            setTimeout(this._ping_artist.bind(this), 5000);
        })
            .catch(err => {
            if (this._gateway_online) {
                this._gateway_online = false;
                this._gateway_went_offline();
            }
            if (this._artist_online) {
                log.warn('Artist is offline');
                this._artist_online = false;
                this._artist_went_offline();
            }
            setTimeout(this._ping_artist.bind(this), 5000);
        });
    }
    _reset() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setStateWorking();
            yield this._refresh_nodes();
            yield this._setup_notifications();
            yield this.resetXPVolNotifyRegistry();
            yield this.addToXPVolNotifyRegistry(this.xpsToListenTo());
        });
    }
    _refresh_nodes() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this._perform_method_call('GetAllPorts', this._get_trs_key());
            let ports = data[1];
            this._nodes.forEach(node => node.destroy());
            this._nodes = [];
            ports.forEach((port) => {
                // console.log(`input: ${port.Input} output: ${port.Output} -
                // ${port.Name}`);
                let node = this.getArtistNode(port.Node);
                if (node)
                    node.addPort(port);
                else {
                    log.info('Add artist node ' + port.Node);
                    let new_node = new ArtistNode(this, port.Node);
                    this._nodes.push(new_node);
                    new_node.addPort(port);
                }
            });
            fs.writeFileSync(`${files_1.configFileDir('nodestate')}/artistcache.json`, JSON.stringify(this.getArtistState()));
        });
    }
    _load_cached() {
        let cachefile = `${files_1.configFileDir('nodestate')}/artistcache.json`;
        if (!fs.existsSync(cachefile)) {
            log.info('Write initial cache file');
            fs.writeFileSync(cachefile, JSON.stringify(this.getArtistState()));
        }
        else {
            log.info('Load cache');
            let cache = JSON.parse(fs.readFileSync(cachefile).toString());
            cache.artist_nodes.forEach(node => {
                this._nodes.push(new ArtistNode(this, node.id));
                node.ports.forEach(port => {
                    this._nodes[this._nodes.length - 1].addPort(port);
                });
            });
        }
    }
    _get_trs_key() {
        return 'X' + pad(++this._trs_cnt, 10);
    }
}
exports.RRCSServer = RRCSServer;
class RRCSService extends RRCSServer {
    constructor() {
        super(...arguments);
        this._synced = {};
    }
    xpsToListenTo() {
        let ids = Object.keys(this._synced);
        let out = [];
        for (let id of ids)
            out.push(this._synced[id]);
        return out.map(xps => xps.master.xp);
    }
    setXPSyncs(syncs) {
        this._synced = {};
        syncs.forEach(sync => {
            this._synced[rrcs_defs_1.xpvtid(sync.master)] = sync;
        });
        this.resetXPVolNotifyRegistry()
            .then(() => this.addToXPVolNotifyRegistry(this.xpsToListenTo()))
            .then(() => this.refreshAllXPs())
            .catch(err => {
            log.error('Could not set XP syncs ' + err);
        });
    }
    xpSyncAddSlaves(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let master = this._synced[msg.master];
            if (master) {
                for (let slave of msg.slaves) {
                    let slidx = master.slaves.findIndex(s => rrcs_defs_1.xpEqual(s.xp, slave.xp));
                    if (slidx == -1) {
                        master.slaves.push(slave);
                        if (slave.set && master.state) {
                            try {
                                yield this._try_set_xp(slave.xp);
                            }
                            catch (err) {
                                log.error(`Could not set newly added XP ${rrcs_defs_1.__xpid(slave.xp)}: ${err}`);
                            }
                        }
                    }
                }
            }
        });
    }
    xpSyncRemoveSlaves(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let master = this._synced[msg.master];
            if (master) {
                for (let slave of msg.slaves) {
                    let slidx = master.slaves.findIndex(s => rrcs_defs_1.xpEqual(s.xp, slave.xp));
                    if (slidx != -1) {
                        let removedarr = master.slaves.splice(slidx, 1);
                        if (removedarr.length) {
                            log.debug(`Removed slave XP ${rrcs_defs_1.__xpid(removedarr[0].xp)} from ${msg.master}`);
                            if (master.state && removedarr[0].set) {
                                try {
                                    yield this._try_kill_xp(removedarr[0].xp);
                                }
                                catch (err) {
                                    log.error(`Could not kill recently removed XP ${rrcs_defs_1.__xpid(slave.xp)}: ${err}`);
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    newXPSync(master, slaves, excluded) {
        let id = rrcs_defs_1.xpvtid(master);
        this._synced[id] = {
            vol: 230,
            state: false,
            master,
            slaves,
            type: rrcs_defs_1.sourcePortIsWildcard(master.xp)
                ? rrcs_defs_1.CrosspointSyncType.WILDCARD_SRC
                : (rrcs_defs_1.destinationPortIsWildcard(master.xp)
                    ? rrcs_defs_1.CrosspointSyncType.WILDCARD_DST
                    : rrcs_defs_1.CrosspointSyncType.SINGLE),
            exclude: excluded || []
        };
        if (this._gateway_online) {
            this.addToXPVolNotifyRegistry([master.xp])
                .then(() => this.updateStateForCrosspointSync(this._synced[id]))
                .catch(err => {
                log.error('Could not add new crosspoint to notification registry: '
                    + err);
            });
        }
    }
    addXPSync(master, slaves) {
        let masterid = rrcs_defs_1.xpvtid(master);
        if (this._synced[masterid]) {
            slaves.forEach(sl => {
                // This slave is not already synced to master
                if (this._synced[masterid].slaves.findIndex(lslave => rrcs_defs_1.xpVtEqual(lslave, sl))
                    == -1) {
                    log.info(`Add new sync target ${rrcs_defs_1.__xpid(sl.xp)} to ${masterid}`);
                    this._synced[masterid].slaves.push(sl);
                    this.updateCrosspoint(sl, this._synced[masterid].vol);
                    if (sl.set && this._synced[masterid].state) {
                        this._try_set_xp(sl.xp).catch((err) => log.error(`Could not set newly added XP ${rrcs_defs_1.__xpid(sl.xp)}: ${err}`));
                    }
                }
            });
        }
        else {
            log.verbose('Add new crosspoint sync ' + masterid);
            this.newXPSync(master, slaves);
        }
    }
    removeXPSync(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let sync = this._synced[id];
            if (sync) {
                delete this._synced[id];
                if (sync.state) {
                    for (let slave of sync.slaves) {
                        if (slave.set)
                            yield this._try_kill_xp(slave.xp);
                    }
                }
                yield this.removeFromXPVolNotifyRegistry([sync.master.xp]);
            }
        });
    }
    getAllXPStates() {
        let out = [];
        for (let key of Object.keys(this._synced))
            out.push({
                xpid: rrcs_defs_1.xpvtid(this._synced[key].master),
                state: this._synced[key].state
            });
    }
    updateStateForCrosspointSync(sync) {
        return __awaiter(this, void 0, void 0, function* () {
            let state = yield this.getXpStatus(sync.master.xp);
            sync.state = state;
            this.emit('xp-states-changed', [
                { state, xpid: rrcs_defs_1.xpvtid(sync.master) }
            ]);
        });
    }
    updateStateForWildcardSync(sync) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    updateCrosspoint(xpv, vol) {
        this.setXPVolume(xpv.xp, vol, xpv.single, xpv.conf);
    }
    onArtistOnline() {
        return __awaiter(this, void 0, void 0, function* () {
            this.refreshAllXPs()
                .then(() => {
                this.emit('config-changed');
            })
                .catch(err => {
                log.error(`Failed to refresh all XPs after artist config change: ${err}`);
            });
        });
    }
    onArtistConfigurationChanged() {
        this.refreshAllXPs()
            .then(() => {
            this.emit('config-changed');
        })
            .catch(err => {
            log.error(`Failed to refresh all XPs after artist config change: ${err}`);
        });
    }
    onXpValueChanged(crosspoint, single, conf) {
        let mid_single = rrcs_defs_1.xpvtid({ conf: false, xp: crosspoint });
        let mid_conf = rrcs_defs_1.xpvtid({ conf: true, xp: crosspoint });
        if (this._synced[mid_single] && single != null) {
            this._do_update_xp(this._synced[mid_single], single);
            this.emit('xp-value-change', { xp: mid_single, value: single });
        }
        if (this._synced[mid_conf] && conf != null) {
            this._do_update_xp(this._synced[mid_conf], conf);
            this.emit('xp-value-change', { xp: mid_conf, value: conf });
        }
    }
    onXpsChanged(xps) {
        return __awaiter(this, void 0, void 0, function* () {
            let updated = [];
            for (let xpstate of xps) {
                // ignore the Sidetone/Loopback XP
                // if (isLoopbackXP(xpstate.xp))
                //     continue;
                this.trySyncCrosspointForMaster(rrcs_defs_1.xpvtid({ xp: xpstate.xp, conf: false }), xpstate, updated);
                this.trySyncCrosspointForMaster(rrcs_defs_1.xpvtid({ xp: xpstate.xp, conf: true }), xpstate, updated);
                /* await this.trySyncCrosspointForWildcardMaster(
                    xpvtid({
                        xp : withDestinationAsDestinationWildcard(xpstate.xp),
                        conf : false
                    }),
                    xpstate, updated); */
                yield this.trySyncCrosspointForWildcardMaster(rrcs_defs_1.xpvtid({
                    xp: rrcs_defs_1.withDestinationeAsSourceWildcard(xpstate.xp),
                    conf: false
                }), xpstate, updated);
                yield this.trySyncCrosspointForWildcardMaster(rrcs_defs_1.xpvtid({
                    xp: rrcs_defs_1.withSourceAsDestinationWildcard(xpstate.xp),
                    conf: false
                }), xpstate, updated);
                /* await this.trySyncCrosspointForWildcardMaster(
                    xpvtid({
                        xp : withSourceAsSourceWildcard(xpstate.xp),
                        conf : false
                    }),
                    xpstate, updated); */
            }
            if (updated.length) {
                this.emit('xp-states-changed', updated);
            }
        });
    }
    trySyncCrosspointForMaster(masterid, xpstate, updated) {
        if (this._synced[masterid]) {
            this.syncCrosspointsForMaster(this._synced[masterid], xpstate.state);
            updated.push({ xpid: masterid, state: xpstate.state });
        }
    }
    trySyncCrosspointForWildcardMaster(masterid, xpstate, updated) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this._synced[masterid]) {
                    if (yield this.syncCrosspointsForWildcardMaster(this._synced[masterid], xpstate.state)) {
                        updated.push({
                            xpid: masterid,
                            state: this._synced[masterid].state
                        });
                        for (let slave of this._synced[masterid].slaves) {
                            if (slave.set) {
                                if (this._synced[masterid].state)
                                    yield this._try_set_xp(slave.xp);
                                else
                                    yield this._try_kill_xp(slave.xp);
                            }
                        }
                    }
                }
            }
            catch (err) {
                log.error(`Failed to update wildcard master ${masterid}: ${err}`);
            }
        });
    }
    syncCrosspointsForMaster(sync, state) {
        return __awaiter(this, void 0, void 0, function* () {
            sync.state = state;
            for (let slave of sync.slaves) {
                if (slave.set) {
                    try {
                        if (state)
                            yield this._try_set_xp(slave.xp);
                        else
                            yield this._try_kill_xp(slave.xp);
                    }
                    catch (err) {
                        log.error('Could not set XP ' + err);
                    }
                }
            }
        });
    }
    syncCrosspointsForWildcardMaster(sync, newstate) {
        return __awaiter(this, void 0, void 0, function* () {
            let wildcard_actives = [];
            if (rrcs_defs_1.destinationPortIsWildcard(sync.master.xp)) {
                let xps = yield this.getXpsInRange({
                    Source: sync.master.xp.Source,
                    Destination: sync.master.xp.Source
                });
                wildcard_actives.push(...xps.filter(xp => rrcs_defs_1.portEqual(xp.Source, sync.master.xp.Source)
                    && sync.exclude.filter(excl => rrcs_defs_1.xpEqual(excl, xp)).length
                        == 0));
            }
            if (rrcs_defs_1.sourcePortIsWildcard(sync.master.xp)) {
                let xps = yield this.getXpsInRange({
                    Source: sync.master.xp.Destination,
                    Destination: sync.master.xp.Destination
                });
                wildcard_actives.push(...xps.filter(xp => rrcs_defs_1.portEqual(xp.Destination, sync.master.xp.Destination)
                    && sync.exclude.filter(excl => rrcs_defs_1.xpEqual(excl, xp)).length
                        == 0));
            }
            if (wildcard_actives.length) {
                log.debug(`Wildcard master ${rrcs_defs_1.xpvtid(sync.master)} still has ${wildcard_actives.length} XPs`);
                if (!sync.state) {
                    sync.state = true;
                    return true;
                }
                return false;
            }
            else {
                log.debug(`Wildcard master ${rrcs_defs_1.xpvtid(sync.master)} has no more active XPs`);
                if (sync.state) {
                    sync.state = false;
                    return true;
                }
                return false;
            }
        });
    }
    refreshAllXPs() {
        return __awaiter(this, void 0, void 0, function* () {
            // clear all master crosspoint states
            this._clear_all_xpstates();
            // kill all crosspoints we might have set
            for (let masterid of Object.keys(this._synced)) {
                let master = this._synced[masterid];
                for (let slave of master.slaves) {
                    if (slave.set) {
                        try {
                            yield this._try_kill_xp(slave.xp);
                        }
                        catch (err) {
                            log.error(`Failed to kill XP ${rrcs_defs_1.__xpid(slave.xp)}`);
                        }
                    }
                }
            }
            // get all active crosspoints from artist
            let xps = (yield this.getActiveXps()).filter(xp => !rrcs_defs_1.isLoopbackXP(xp));
            // set all master-xp states (also wildcards)
            xps.forEach(xp => {
                // clang-format off
                this._set_sync_state_on(rrcs_defs_1.xpvtid({ xp, conf: false }));
                this._set_sync_state_on(rrcs_defs_1.xpvtid({ xp, conf: true }));
                this._set_sync_state_on(rrcs_defs_1.xpvtid({ xp: rrcs_defs_1.withSourceAsDestinationWildcard(xp), conf: false }));
                this._set_sync_state_on(rrcs_defs_1.xpvtid({ xp: rrcs_defs_1.withDestinationeAsSourceWildcard(xp), conf: false }));
                // clang-format on
            });
            // set all xps that should be set
            for (let masterid of Object.keys(this._synced)) {
                let master = this._synced[masterid];
                for (let slave of master.slaves) {
                    if (master.state && slave.set) {
                        try {
                            yield this._try_set_xp(slave.xp);
                        }
                        catch (err) {
                            log.error(`Failed to set XP ${rrcs_defs_1.__xpid(slave.xp)}`);
                        }
                    }
                }
            }
            let syncstates = [];
            for (let key of Object.keys(this._synced))
                syncstates.push({
                    xpid: rrcs_defs_1.xpvtid(this._synced[key].master),
                    state: this._synced[key].state
                });
            this.emit('xp-states-changed', syncstates);
        });
    }
    _do_update_xp(sync, vol) {
        sync.vol = vol;
        sync.slaves.forEach(slave => {
            try {
                this.updateCrosspoint(slave, sync.vol);
            }
            catch (err) {
                log.error('Could not update crosspoint: ' + err);
            }
        });
    }
    _clear_all_xpstates() {
        for (let key of Object.keys(this._synced))
            this._synced[key].state = false;
    }
    _set_sync_state_on(masterid) {
        if (this._synced[masterid])
            this._synced[masterid].state = true;
    }
    _try_set_xp(xp) {
        return __awaiter(this, void 0, void 0, function* () {
            let isset = yield this.getXpStatus(xp);
            if (isset)
                log.debug(`XP ${rrcs_defs_1.__xpid(xp)} already set`);
            else
                yield this.setXP(xp);
        });
    }
    _try_kill_xp(xp) {
        return __awaiter(this, void 0, void 0, function* () {
            log.debug(`Try killing XP ${rrcs_defs_1.__xpid(xp)}`);
            let still_set_by = [];
            for (let masterid of Object.keys(this._synced)) {
                const sync = this._synced[masterid];
                let slfound = false;
                if (!sync.state)
                    continue;
                for (let slave of sync.slaves) {
                    if (!slave.set)
                        continue;
                    if (rrcs_defs_1.xpEqual(xp, slave.xp)) {
                        still_set_by.push(masterid);
                        slfound = true;
                        break;
                    }
                }
                if (slfound)
                    break;
            }
            if (still_set_by.length) {
                log.debug(`Wont kill XP because it is still set by ${still_set_by.length} masters`);
                still_set_by.forEach(mid => log.debug(`    still set by: ${mid}`));
            }
            else {
                try {
                    yield this.killXP(xp);
                }
                catch (err) {
                    log.error(`Failed to kill XP ${rrcs_defs_1.__xpid(xp)}: ${err}`);
                }
            }
        });
    }
}
exports.RRCSService = RRCSService;
/*
    processOSCCommand(cmd: string[])
    {
        let ccmd = cmd[0].split(' ');
        let addr = ccmd.shift();
        let msg: OSCMessage
            = { address : addr, oscType : 'message', args : [] }

              ccmd.forEach(arg => {
                  try {
                      if (/^\d+$/.test(arg)) {
                          msg.args.push({
                              type : 'integer',
                              value : Number.parseInt(arg)
                          });
                      }
                      else if (!isNaN(<number><unknown>arg)) {
                          msg.args.push({
                              type : 'float',
                              value : Number.parseFloat(arg)
                          });
                      }
                      else {
                          msg.args.push({ type : 'string', value : arg });
                      }
                  }
                  catch (err) {
                      log.error('Could not convert arg to OSC Type ' + err);
                  }

                  this.local_sock.send(toBuffer(msg),
   this.config.rrcs_osc_port, this.config.rrcs_osc_host);
              });
    }

    processStringCommand(str: string)
    {
        let cmd = str.split('-');

        switch (cmd.shift()) {
            case 'headtracker': this.processHeadtrackerCommand(cmd); break;
            case 'osc': this.processOSCCommand(cmd);
        }
    }

    processHeadtrackerCommand(cmd: string[])
    {
        let id = Number.parseInt(cmd[1]);
        switch (cmd.shift()) {
            case 'reset':
                this.events.emit(HeadtrackerInputEvents.RESET_HEADTRACKER,
   id); break; case 'init':
                this.events.emit(HeadtrackerInputEvents.CALIBRATE_STEP1,
   id); break; case 'on':
                this.events.emit(HeadtrackerInputEvents.HEADTRACKER_ON, id);
                break;
            case 'off':
                this.events.emit(HeadtrackerInputEvents.HEADTRACKER_OFF,
   id);
        }
    }

    processHeadtrackerOffCommand(cmd: string[])
    {
        let id = Number.parseInt(cmd[1]);
        switch (cmd.shift()) {
            case 'init':
                this.events.emit(HeadtrackerInputEvents.CALIBRATE_STEP2,
   id); break;
        }
    }

    processStringOffCommand(str: string)
    {
        let cmd = str.split('-');

        switch (cmd.shift()) {
            case 'headtracker': this.processHeadtrackerOffCommand(cmd);
   break;
        }
    }

    sendString(params: any)
    {
        try {
            this.processStringCommand(params[1]);
        }
        catch (err) {
            log.error(`Could not process string command from artist: ` +
   err);
        }
    }
    sendStringOff(params: any)
    {
        try {
            this.processStringOffCommand(params[1]);
        }
        catch (err) {
            log.error(`Could not process string-off command from artist: `
                      + err);
        }
    }
*/ 
//# sourceMappingURL=rrcs.js.map