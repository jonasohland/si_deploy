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
const rooms_defs_1 = require("./rooms_defs");
const Logger = __importStar(require("./log"));
const dsp_node_1 = require("./dsp_node");
const dsp_graph_builder_1 = require("./dsp_graph_builder");
const log = Logger.get('NROOMS');
class Room extends core_1.ManagedNodeStateObject {
    constructor(letter, data) {
        super();
        this._letter = letter;
        this._data = data;
    }
    set(val) {
        return __awaiter(this, void 0, void 0, function* () {
            this._data = val;
        });
    }
    get() {
        return this._data;
    }
}
exports.Room = Room;
class NodeRoomsList extends core_1.ManagedNodeStateMapRegister {
    constructor() {
        super();
    }
    remove(name, obj) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    insert(name, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Room(name, obj);
        });
    }
}
exports.NodeRoomsList = NodeRoomsList;
class NodeRooms extends core_1.NodeModule {
    constructor() {
        super(dsp_node_1.DSPModuleNames.ROOMS);
        this._rooms = new NodeRoomsList();
        this.add(this._rooms, 'rooms');
    }
    init() {
        this._rooms.add('A', new Room('A', rooms_defs_1.defaultRoom('A')));
        this._rooms.add('B', new Room('B', rooms_defs_1.defaultRoom('B')));
        this._rooms.add('C', new Room('C', rooms_defs_1.defaultRoom('C')));
        this._rooms.add('D', new Room('D', rooms_defs_1.defaultRoom('D')));
        this._rooms.add('E', new Room('E', rooms_defs_1.defaultRoom('E')));
    }
    start(remote) {
        this.save().catch(err => {
            log.error('Could not write data to node ' + err);
        });
    }
    destroy() {
    }
    joined(socket, topic) {
        if (topic == 'rooms')
            socket.emit('node.rooms', this.listrooms());
    }
    left(socket, topic) {
        ; // we dont care
    }
    listrooms() {
        return this._rooms._object_iter().map(obj => obj.get());
    }
    updateRoom(data) {
        if (this._rooms._objects[data.letter]) {
            this._rooms._objects[data.letter].set(data);
            this._rooms._objects[data.letter].save();
            this.publish('rooms', 'node.rooms', this.listrooms());
        }
    }
    getRoom(room) {
        return this._rooms._objects[room].get();
    }
}
exports.NodeRooms = NodeRooms;
class Rooms extends core_1.ServerModule {
    init() {
        this.handleWebInterfaceEvent('reset', (socket, node, room) => {
        });
        this.handleWebInterfaceEvent('modify', (socket, node, data) => {
            node.rooms.updateRoom(data);
            this.emitToModule(node.id(), dsp_node_1.DSPModuleNames.GRAPH_BUILDER, dsp_graph_builder_1.GraphBuilderInputEvents.ROOM_ENABLED, data.letter, data);
        });
        this.handleWebInterfaceEvent('set-main', (socket, node, data) => {
            this.emitToModule(node.id(), dsp_node_1.DSPModuleNames.GRAPH_BUILDER, dsp_graph_builder_1.GraphBuilderInputEvents.ROOM_REFLECTIONS, data.letter, data);
        });
        this.handleWebInterfaceEvent('set-attn', (socket, node, data) => {
            this.emitToModule(node.id(), dsp_node_1.DSPModuleNames.GRAPH_BUILDER, dsp_graph_builder_1.GraphBuilderInputEvents.ROOM_ATTN, data.letter, data);
        });
        this.handleWebInterfaceEvent('set-room', (socket, node, data) => {
            this.emitToModule(node.id(), dsp_node_1.DSPModuleNames.GRAPH_BUILDER, dsp_graph_builder_1.GraphBuilderInputEvents.ROOM_SHAPE, data.letter, data);
        });
        this.handleWebInterfaceEvent('set-eq', (socket, node, data) => {
            this.emitToModule(node.id(), dsp_node_1.DSPModuleNames.GRAPH_BUILDER, dsp_graph_builder_1.GraphBuilderInputEvents.ROOM_HIGHSHELF, data.letter, data);
            this.emitToModule(node.id(), dsp_node_1.DSPModuleNames.GRAPH_BUILDER, dsp_graph_builder_1.GraphBuilderInputEvents.ROOM_LOWSHELF, data.letter, data);
        });
    }
    joined(socket, topic) {
    }
    left(socket, topic) {
    }
    constructor() {
        super('rooms');
    }
}
exports.Rooms = Rooms;
//# sourceMappingURL=rooms.js.map