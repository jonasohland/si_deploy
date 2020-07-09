"use strict";
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
const audio_devices_1 = require("./audio_devices");
const communication_1 = require("./communication");
const Logger = __importStar(require("./log"));
const web_interface_1 = __importDefault(require("./web_interface"));
const data_1 = require("./data");
const dsp_node_1 = require("./dsp_node");
const log = Logger.get('SERVER');
class SpatialIntercomServer extends data_1.Server {
    constructor(config) {
        let webif = new web_interface_1.default(config);
        super(new communication_1.SIServerWSServer(config), webif);
        this.webif = webif;
        this.audio_devices = new audio_devices_1.AudioDevices();
        this.add(this.audio_devices);
    }
    createNode(id) {
        if (id.type == communication_1.NODE_TYPE.DSP_NODE)
            return new dsp_node_1.DSPNode(id);
    }
    destroyNode(node) {
    }
}
exports.SpatialIntercomServer = SpatialIntercomServer;
//# sourceMappingURL=server.js.map