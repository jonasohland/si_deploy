"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("./core");
const communication_1 = require("./communication");
const dsp_modules_1 = require("./dsp_modules");
const Logger = __importStar(require("./log"));
const dsp_node_1 = require("./dsp_node");
const log = Logger.get('DSPBLD');
exports.GraphBuilderInputEvents = {
    FULL_REBUILD: 'rebuildgraph-full',
    REBUILD: 'rebuildgraph-partial',
    PAN: 'pan',
    AZM: 'azm',
    ELV: 'elv',
    ROOM_ENABLED: 'roomenabled',
    ROOM_REFLECTIONS: 'roomreflections',
    ROOM_SHAPE: 'roomshape',
    ROOM_ATTN: 'roomattn',
    ROOM_HIGHSHELF: 'roomhighshelf',
    ROOM_LOWSHELF: 'roomlowshelf',
    ASSIGN_HEADTRACKER: 'assignheadtracker',
};
exports.GraphBuilderOutputEvents = {};
class NodeDSPGraphBuilder extends core_1.NodeModule {
    constructor() {
        super(dsp_node_1.DSPModuleNames.GRAPH_BUILDER);
        this.user_modules = {};
        this.basic_spatializers = {};
        this.room_spatializers = {};
    }
    destroy() {
    }
    joined(socket, topic) {
    }
    left(socket, topic) {
    }
    init() {
        this.handleModuleEvent(exports.GraphBuilderInputEvents.FULL_REBUILD, this._do_rebuild_graph_full.bind(this));
        this.handleModuleEvent(exports.GraphBuilderInputEvents.PAN, this._dispatch_pan.bind(this));
        this.handleModuleEvent(exports.GraphBuilderInputEvents.AZM, this._dispatch_azimuth_pan.bind(this));
        this.handleModuleEvent(exports.GraphBuilderInputEvents.ELV, this._dispatch_elevation_pan.bind(this));
        this.handleModuleEvent(exports.GraphBuilderInputEvents.ROOM_ENABLED, this._dispatch_room_enabled.bind(this));
        this.handleModuleEvent(exports.GraphBuilderInputEvents.ROOM_REFLECTIONS, this._dispatch_room_reflections.bind(this));
        this.handleModuleEvent(exports.GraphBuilderInputEvents.ROOM_ATTN, this._dispatch_room_attn.bind(this));
        this.handleModuleEvent(exports.GraphBuilderInputEvents.ROOM_HIGHSHELF, this._dispatch_room_highshelf.bind(this));
        this.handleModuleEvent(exports.GraphBuilderInputEvents.ROOM_LOWSHELF, this._dispatch_room_lowshelf.bind(this));
        this.handleModuleEvent(exports.GraphBuilderInputEvents.ROOM_SHAPE, this._dispatch_room_shape.bind(this));
        this.handleModuleEvent(exports.GraphBuilderInputEvents.ASSIGN_HEADTRACKER, this._dispatch_assign_headtracker.bind(this));
        console.log("Remote node address", this.myNode().remote().remoteInfo());
    }
    start(connection) {
    }
    _do_rebuild_graph_full() {
        this.dsp().resetGraph().then(() => {
            this.user_modules = {};
            this.basic_spatializers = {};
            this.room_spatializers = {};
            try {
                this._build_spatializer_modules();
                this._build_user_modules();
            }
            catch (err) {
                console.log(err);
            }
            this.dsp().syncGraph();
        }).catch(err => {
            log.error("Could not reset graph: " + err);
        });
    }
    _build_spatializer_modules() {
        this.nodeUsers().listUsers().forEach(user => {
            let userdata = user.get();
            log.verbose("Build input modules for user " + userdata.name);
            this.basic_spatializers[userdata.id] = {};
            this.room_spatializers[userdata.id] = {};
            this.nodeUsers().getUsersInputs(userdata.id).forEach(input => {
                if (input.isInRoom()) {
                    log.verbose(`Build advanced input module for ${input.get().id}`);
                    let mod = new dsp_modules_1.RoomSpatializerModule(input, this.getRooms().getRoom(input.get().room));
                    this.room_spatializers[userdata.id][input.get().id] = mod;
                    mod.pan(input.params());
                    this.graph().addModule(mod);
                }
                else {
                    log.verbose(`Build basic input module for ${input.get().id}`);
                    let mod = new dsp_modules_1.MulitSpatializerModule(input);
                    this.basic_spatializers[userdata.id][input.get().id] = mod;
                    mod.pan(input.params());
                    this.graph().addModule(mod);
                }
            });
            let usermod = new dsp_modules_1.SimpleUsersModule(user);
            this.graph().addModule(usermod);
        });
    }
    _dispatch_azimuth_pan(userid, spid, azm) {
        let module = this._find_spatializer(userid, spid);
        if (module)
            module.setAzimuth(azm);
    }
    _dispatch_elevation_pan(userid, spid, elv) {
        let module = this._find_spatializer(userid, spid);
        if (module)
            module.setElevation(elv);
    }
    _dispatch_pan(userid, spid, params) {
        let module = this._find_spatializer(userid, spid);
        if (module)
            module.pan(params);
    }
    _dispatch_room_enabled(roomid, room) {
        this._find_spatializers_for_room(roomid).forEach(sp => sp.setRoomEnabled(room));
    }
    _dispatch_room_reflections(roomid, room) {
        this._find_spatializers_for_room(roomid).forEach(sp => sp.setRoomReflections(room));
    }
    _dispatch_room_attn(roomid, room) {
        this._find_spatializers_for_room(roomid).forEach(sp => sp.setRoomAttn(room));
    }
    _dispatch_room_shape(roomid, room) {
        this._find_spatializers_for_room(roomid).forEach(sp => sp.setRoomShape(room));
    }
    _dispatch_room_highshelf(roomid, room) {
        this._find_spatializers_for_room(roomid).forEach(sp => sp.setRoomHighshelf(room));
    }
    _dispatch_room_lowshelf(roomid, room) {
        this._find_spatializers_for_room(roomid).forEach(sp => sp.setRoomLowshelf(room));
    }
    _dispatch_assign_headtracker(userid, headtrackerid) {
        log.info("Assign headtracker " + headtrackerid + "to user " + userid);
        let headtracker = this.headtrackers().getHeadtracker(headtrackerid);
        if (headtracker) {
            try {
                headtracker.setStreamDest(this.myNode().remote().remoteInfo(), 10099);
            }
            catch (err) {
            }
        }
        if (this.user_modules[userid]) {
            this.user_modules[userid].setHeadtrackerId(headtrackerid);
        }
    }
    _build_user_modules() {
        this.nodeUsers().listRawUsersData().forEach((usr) => {
        });
    }
    _find_spatializer(userid, spid) {
        if (this.basic_spatializers[userid]) {
            if (this.basic_spatializers[userid][spid])
                return this.basic_spatializers[userid][spid];
        }
        if (this.room_spatializers[userid]) {
            if (this.room_spatializers[userid][spid])
                return this.room_spatializers[userid][spid];
        }
    }
    _find_spatializers_for_room(room) {
        let spatializers = [];
        for (let userid of Object.keys(this.room_spatializers)) {
            for (let spatializerid of Object.keys(this.room_spatializers[userid])) {
                if (this.room_spatializers[userid][spatializerid].room() === room)
                    spatializers.push(this.room_spatializers[userid][spatializerid]);
            }
        }
        return spatializers;
    }
    getRooms() {
        return this.myNode().rooms;
    }
    nodeUsers() {
        return this.myNode().users;
    }
    nodeInputs() {
        return this.myNode().inputs;
    }
    headtrackers() {
        return this._server.headtracking;
    }
    dsp() {
        return this.myNode().dsp_process;
    }
    graph() {
        return this.dsp().graph();
    }
}
exports.NodeDSPGraphBuilder = NodeDSPGraphBuilder;
class DSPGraphController extends core_1.ServerModule {
    constructor() {
        super("graph-controller");
    }
    init() {
        this.handleGlobalWebInterfaceEvent('committodsp', (socket, data) => {
            this.server.nodes().forEach(node => {
                if (node.type() == communication_1.NODE_TYPE.DSP_NODE) {
                    log.info("Rebuild graph on node " + node.name());
                    this.emitToModule(node.id(), dsp_node_1.DSPModuleNames.GRAPH_BUILDER, exports.GraphBuilderInputEvents.FULL_REBUILD);
                }
            });
        });
        this.handleWebInterfaceEvent('rebuildgraph', (socket, node) => {
            this.emitToModule(node.id(), dsp_node_1.DSPModuleNames.GRAPH_BUILDER, exports.GraphBuilderInputEvents.FULL_REBUILD);
        });
    }
    joined(socket, topic) {
    }
    left(socket, topic) {
    }
}
exports.DSPGraphController = DSPGraphController;
//# sourceMappingURL=dsp_graph_builder.js.map