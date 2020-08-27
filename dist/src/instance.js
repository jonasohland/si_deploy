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
exports.SIDSPNode = exports.InstanceID = void 0;
const Logger = __importStar(require("./log"));
const timecode_1 = require("./timecode");
const log = Logger.get('MGT');
const netlog = Logger.get('NET');
class InstanceID {
}
exports.InstanceID = InstanceID;
class SIDSPNode {
    constructor(nodename, nid, local, addrs, dsp) {
        this.name = nodename;
        this.id = nid;
        this.addresses = addrs;
        // this.devices = new AudioDevices.Manager(this.connection);
        this.tc = new timecode_1.TimecodeNode(this.connection);
        this.connection.begin();
        this.connection.on('connection', () => {
            this.vst.waitPluginsScanned();
            this.graph.setInputNode(64);
            this.graph.setOutputNode(64);
        });
    }
}
exports.SIDSPNode = SIDSPNode;
//# sourceMappingURL=instance.js.map