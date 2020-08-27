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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSPNode = exports.DSPModuleNames = void 0;
const core_1 = require("./core");
const inputs_1 = require("./inputs");
const dsp_process_1 = require("./dsp_process");
const vst_1 = require("./vst");
const audio_devices_1 = require("./audio_devices");
const users_1 = require("./users");
const rooms_1 = require("./rooms");
const dsp_graph_builder_1 = require("./dsp_graph_builder");
const Logger = __importStar(require("./log"));
const log = Logger.get('DSPNOD');
exports.DSPModuleNames = {
    INPUTS: 'nodeinputs',
    USERS: 'users',
    ROOMS: 'rooms',
    DSP_PROCESS: 'dsp-process',
    VST_SCANNER: 'vst-scanner',
    AUDIO_DEVICES: 'node-audio-devices',
    GRAPH_BUILDER: 'graph-builder',
};
class DSPNode extends core_1.Node {
    constructor(id) {
        super(id);
        this.inputs = new inputs_1.NodeAudioInputManager();
        this.users = new users_1.NodeUsersManager(this.inputs);
        this.rooms = new rooms_1.NodeRooms();
        this.vst = new vst_1.VSTScanner();
        this.dsp_process = new dsp_process_1.DSPController(this.vst);
        this.audio_devices = new audio_devices_1.NodeAudioDevices();
        this.dsp_graph_builder = new dsp_graph_builder_1.NodeDSPGraphBuilder();
        this.add(this.inputs);
        this.add(this.users);
        this.add(this.rooms);
        this.add(this.dsp_process);
        this.add(this.vst);
        this.add(this.audio_devices);
        this.add(this.dsp_graph_builder);
    }
    init() {
    }
    start() {
    }
    destroy() {
    }
}
exports.DSPNode = DSPNode;
//# sourceMappingURL=dsp_node.js.map