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
const dsp_modules_1 = require("./dsp_modules");
const Logger = __importStar(require("./log"));
const dsp_node_1 = require("./dsp_node");
const log = Logger.get('DSPBLD');
exports.GraphBuilderInputEvents = {
    FULL_REBUILD: 'rebuildgraph-full',
    REBUILD: 'rebuildgraph-partial'
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
    }
    start(connection) {
    }
    _do_rebuild_graph_full() {
        this.dsp().resetGraph().then(() => {
            this._build_spatializer_modules();
            this._build_user_modules();
        }).catch(err => {
            log.error("Could not reset graph: " + err);
        });
    }
    _build_spatializer_modules() {
        this.nodeUsers().listUsers().forEach(usr => {
            log.verbose("Build input modules for user " + usr.name);
            this.basic_spatializers[usr.id] = {};
            this.nodeUsers().getUsersInputs(usr.id).forEach(input => {
                log.verbose(`Build input module for ${input.get().id}`);
                let mod = new dsp_modules_1.MulitSpatializerModule(input);
                this.basic_spatializers[usr.id][input.get().id] = mod;
            });
        });
    }
    _build_user_modules() {
        this.nodeUsers().listUsers().forEach((usr) => {
        });
    }
    nodeUsers() {
        return this.myNode().getModule(dsp_node_1.DSPModuleNames.USERS);
    }
    nodeInputs() {
        return this.myNode().getModule(dsp_node_1.DSPModuleNames.INPUTS);
    }
    dsp() {
        return this.myNode().getModule(dsp_node_1.DSPModuleNames.DSP_PROCESS);
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
    }
    joined(socket, topic) {
    }
    left(socket, topic) {
    }
}
exports.DSPGraphController = DSPGraphController;
//# sourceMappingURL=dsp_graph_builder.js.map