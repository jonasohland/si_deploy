"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
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