"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_1 = require("./data");
const inputs_1 = require("./inputs");
const dsp_process_1 = require("./dsp_process");
const vst_1 = require("./vst");
const audio_devices_1 = require("./audio_devices");
const users_1 = require("./users");
const rooms_1 = require("./rooms");
class DSPNode extends data_1.Node {
    constructor(id) {
        super(id);
        this.inputs = new inputs_1.NodeAudioInputManager();
        this.users = new users_1.NodeUsersManager();
        this.rooms = new rooms_1.NodeRooms();
        this.vst = new vst_1.VSTScanner();
        this.dsp_process = new dsp_process_1.DSPController(this.vst);
        this.audio_devices = new audio_devices_1.NodeAudioDevices();
        this.add(this.inputs);
        this.add(this.users);
        this.add(this.rooms);
        this.add(this.dsp_process);
        this.add(this.vst);
        this.add(this.audio_devices);
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