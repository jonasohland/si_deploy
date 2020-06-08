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
const Logger = __importStar(require("./log"));
const showfiles_1 = require("./showfiles");
const log = Logger.get('INP');
class Input extends showfiles_1.ShowfileRecord {
    plain() {
        let r = {};
        Object.assign(r, this);
        return r;
    }
    restore(data) {
        this.build(data);
    }
    save() { }
    build(data) {
        Object.assign(this, data);
    }
}
exports.Input = Input;
class InputManager {
    constructor(io, audioDevMan) {
        let self = this;
        this.devices = audioDevMan;
        this.nodes = [];
        this.server = io;
        io.on('connection', socket => {
            socket.on('inputs.update', () => {
                self.updateInterface(socket).catch(err => {
                    console.log(err);
                });
            });
            socket.on('inputs.add', this.addInput.bind(self));
        });
    }
    updateInterface(sock) {
        return __awaiter(this, void 0, void 0, function* () {
            let nodes = yield this.devices.getAllChannelLists();
            sock.emit('inputs.update', {
                nodes: nodes,
                inputs: this.nodes.map(nd => {
                    return {
                        id: nd.si.id, inputs: nd.inputs.map(i => i.plain())
                    };
                })
            });
        });
    }
    addInput(input) {
        return __awaiter(this, void 0, void 0, function* () {
            let ins = this.devices.instances
                .find(ins => ins.instance.id == input.nodeid)
                .instance;
            let chlist = yield ins.devices.getChannelList();
            let chs = chlist.inputs.slice(input.ch_start, input.ch_start + input.ch_count);
            let nodeAndInput = this.nodes.find(ni => ni.si.id == input.nodeid);
            if (nodeAndInput == undefined)
                this.nodes.push({ si: ins, inputs: [], max_id: 0 });
            nodeAndInput = this.nodes.find(ni => ni.si.id == input.nodeid);
            log.info(`Added new Input to node ${nodeAndInput.si.name} (chs: ${chs.length}, name: ${input.name})`);
            let i = new Input();
            i.build({
                name: input.name,
                channels: chs,
                format: input.format,
                id: ++nodeAndInput.max_id
            });
            nodeAndInput.inputs.push(i);
            this.updateInterface(this.server);
        });
    }
}
exports.InputManager = InputManager;
//# sourceMappingURL=inputs.js.map