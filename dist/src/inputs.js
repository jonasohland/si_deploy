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
const dsp_node_1 = require("./dsp_node");
const Logger = __importStar(require("./log"));
const log = Logger.get('INP');
class NodeAudioInput extends core_1.ManagedNodeStateObject {
    constructor(desc) {
        super();
        this._description = desc;
    }
    set(val) {
        return __awaiter(this, void 0, void 0, function* () {
            this._description = val;
        });
    }
    get() {
        return this._description;
    }
}
exports.NodeAudioInput = NodeAudioInput;
class NodeAudioInputList extends core_1.ManagedNodeStateListRegister {
    remove(obj) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    insert(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return new NodeAudioInput(data);
        });
    }
}
exports.NodeAudioInputList = NodeAudioInputList;
class NodeAudioInputManager extends core_1.NodeModule {
    constructor() {
        super(dsp_node_1.DSPModuleNames.INPUTS);
        this._input_list = new NodeAudioInputList();
        this.add(this._input_list, 'input-list');
    }
    addInput(input) {
        return __awaiter(this, void 0, void 0, function* () {
            this._input_list.add(new NodeAudioInput(input));
            return this.save();
        });
    }
    removeInput(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this._input_list.removeItem(this._input_list._objects.find(obj => obj.get().id == id));
            return this._input_list.save();
        });
    }
    getRawInputDescriptionList() {
        return this._input_list._objects.map(obj => obj.get());
    }
    findInputForId(id) {
        return this._input_list._objects.find(obj => obj.get().id == id);
    }
    destroy() {
    }
    init() {
    }
    start() {
        this.save().catch(err => {
            log.error('Could write data to node ' + err);
        });
    }
    joined(socket, topic) {
    }
    left(socket, topic) {
    }
}
exports.NodeAudioInputManager = NodeAudioInputManager;
class AudioInputsManager extends core_1.ServerModule {
    joined(socket, topic) {
    }
    left(socket, topic) {
    }
    broadcastUpdate(node) {
        this.webif.broadcastEvent('inputs.update', node.id(), node.inputs.getRawInputDescriptionList());
    }
    init() {
        this.handleWebInterfaceEvent('update', (socket, node, data) => {
            try {
                socket.emit('inputs.update', node.id(), node.inputs.getRawInputDescriptionList());
            }
            catch (err) {
                this.webif.error(err);
            }
        });
        this.handleWebInterfaceEvent('add', (socket, node, data) => {
            try {
                node.inputs.addInput(data);
                this.broadcastUpdate(node);
                this.webif.broadcastNotification(node.name(), `Added new input: ${data.name}`);
            }
            catch (err) {
                this.webif.error(err);
            }
        });
        this.handleWebInterfaceEvent('remove', (socket, node, data) => {
            node.inputs.removeInput(data)
                .then(() => {
                this.webif.broadcastNodeNotification(node, `Input removed`);
                this.broadcastUpdate(node);
            })
                .catch((err) => {
                this.webif.error(err);
            });
        });
        this.handleWebInterfaceEvent('modify', (socket, node, data) => {
            try {
                let input = node.inputs.findInputForId(data.id);
                if (input) {
                    input.set(data)
                        .then(() => {
                        this.webif.broadcastNodeNotification(node, `Modified input: ${input.get().name}`);
                        this.broadcastUpdate(node);
                        input.save();
                    })
                        .catch(err => {
                        this.webif.error(err);
                    });
                }
                else {
                    this.webif.error('Input ' + data.name + ' not found');
                }
            }
            catch (err) {
                this.webif.error(err);
            }
        });
    }
    constructor() {
        super('inputs');
    }
}
exports.AudioInputsManager = AudioInputsManager;
//# sourceMappingURL=inputs.js.map