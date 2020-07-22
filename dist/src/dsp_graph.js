"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const dsp_defs_1 = require("./dsp_defs");
const Logger = __importStar(require("./log"));
const log = Logger.get('DSP');
function _portarr_chcount(ports) {
    return ports.reduce((count, port) => { return count + port.c; }, 0);
}
class AmbisonicsProperties {
}
exports.AmbisonicsProperties = AmbisonicsProperties;
/**
 * Base class for an Input/Output of a node
 */
class Port {
    constructor(name, type) {
        this.i = -1;
        this.ni = -1;
        this.n = -1;
        /**
         * Total number of channels per port
         */
        this.c = 1;
        this.type = type;
        this.name = name;
        this.c = dsp_defs_1.SourceUtils[type].channels;
    }
    isAmbiPort() {
        return this instanceof AmbiPort;
    }
}
exports.Port = Port;
class Connection {
    constructor(sources, destinations) {
        this.sources = [];
        this.destinations = [];
        this.sources = sources;
        this.destinations = destinations;
    }
    repair() {
        this.sources = this.sources.filter(p => p.n != -1);
        this.destinations = this.destinations.filter(p => p.n != -1);
        while (this.destChannelCount() > this.srcChannelCount())
            this.destinations.pop();
        return this.srcChannelCount() == this.destChannelCount();
    }
    valid() {
        return this.srcChannelCount() == this.destChannelCount()
            && this.sources.filter(p => p.n != -1).length
            && this.destinations.filter(p => p.n != -1).length;
    }
    channelCount() {
        if (!this.valid())
            throw Error('Invalid connection');
        return this.srcChannelCount();
    }
    destChannelCount() {
        return this._channel_count(false);
    }
    srcChannelCount() {
        return this._channel_count(true);
    }
    _channel_count(src) {
        let count = 0;
        for (let port of src ? this.sources : this.destinations)
            count += port.c;
        return count;
    }
}
exports.Connection = Connection;
class Bus {
    constructor(name, type) {
        this.ports = [];
        this.name = name;
        this.type = type;
    }
    channelCount() {
        let count = 0;
        for (let port of this.ports)
            count += port.c;
        return count;
    }
    portCount() {
        return this.ports.length;
    }
    portCountForChannels(channels) {
        let port_chcount = dsp_defs_1.SourceUtils[this.type].channels;
        return Math.ceil(channels / port_chcount);
    }
    connect(other) {
        return this.connectIdxNIdx(other, 0, this.portCountForChannels(other.channelCount()), 0);
    }
    connectIdx(other, thisIndex) {
        return this.connectIdxNIdx(other, thisIndex, this.portCountForChannels(other.channelCount()), 0);
    }
    connectOtherIdx(other, otherIndex) {
        return this.connectIdxNIdx(other, 0, this.portCountForChannels(other.channelCount()), otherIndex);
    }
    connectIdxN(other, thisIndex, thisCount) {
        return this.connectIdxNIdx(other, thisIndex, thisCount, 0);
    }
    connectIdxIdx(other, thisIndex, otherIndex) {
        return this.connectIdxNIdx(other, thisIndex, this.portCountForChannels(other.channelCount()), otherIndex);
    }
    connectIdxNIdx(other, thisIndex, thisCount, otherIndex) {
        let sources = [];
        let destinations = [];
        sources = this.ports.slice(thisIndex, thisIndex + thisCount);
        let requested_chcount = _portarr_chcount(sources);
        let other_chcount = 0;
        let i = otherIndex;
        do {
            let cport = other.ports[i];
            other_chcount += cport.c;
            destinations.push(cport);
        } while (other.ports.length > ++i && other_chcount < requested_chcount
            && other_chcount);
        if (other_chcount == requested_chcount)
            return new Connection(sources, destinations);
    }
    _set_start_idx(idx) {
        for (let i in this.ports) {
            this.ports[i].ni
                = idx + (Number.parseInt(i) * dsp_defs_1.SourceUtils[this.type].channels);
        }
    }
    _set_nodeid(id) {
        this.ports.forEach(p => p.n = id);
    }
    static _with_ports(count, bus, type) {
        for (let i = 0; i < count; ++i) {
            let port = new Port(`${bus.name} ${i + 1} (${dsp_defs_1.PortTypes[bus.type]})`, type);
            port.i = i;
            bus.ports.push(port);
        }
        return bus;
    }
    static createAny(name, count) {
        return Bus._with_ports(count, new Bus(name, dsp_defs_1.PortTypes.Any), dsp_defs_1.PortTypes.Any);
    }
    static createMono(name, count) {
        return Bus._with_ports(count, new Bus(name, dsp_defs_1.PortTypes.Mono), dsp_defs_1.PortTypes.Mono);
    }
    static createStereo(name, count) {
        return Bus._with_ports(count, new Bus(name, dsp_defs_1.PortTypes.Stereo), dsp_defs_1.PortTypes.Stereo);
    }
    static create(name, count, type) {
        return Bus._with_ports(count, new Bus(name, type), type);
    }
    static createMain(count, type) {
        return Bus._with_ports(count, new Bus('main', type), type);
    }
    static createMainAny(count) {
        return Bus.createMain(count, dsp_defs_1.PortTypes.Any);
    }
    static createMainMono(count) {
        return Bus.createMain(count, dsp_defs_1.PortTypes.Mono);
    }
    static createMainStereo(count) {
        return Bus.createMain(count, dsp_defs_1.PortTypes.Stereo);
    }
}
exports.Bus = Bus;
class AmbiBus extends Bus {
    static createForOrder(name, order, count) {
        return Bus.create(name, count, dsp_defs_1.PortTypes.Ambi_O0 + order);
    }
    static createMainForOrder(order, count) {
        return AmbiBus.createForOrder('main', order, count);
    }
}
exports.AmbiBus = AmbiBus;
class AmbiPort extends Port {
}
exports.AmbiPort = AmbiPort;
class BusProxy {
    main() {
        return this.buses.find(b => b.name == 'main');
    }
}
exports.BusProxy = BusProxy;
class Node extends events_1.EventEmitter {
    constructor(name, type) {
        super();
        this.id = -1;
        this.inputs = [];
        this.outputs = [];
        this.sends = [];
        this.receives = [];
        this.name = name;
        this.type = type;
    }
    addBus(input, bus) {
        bus._set_start_idx(this.channelCount(input));
        if (input)
            this.inputs.push(bus);
        else
            this.outputs.push(bus);
        return this;
    }
    getMainInputBus() {
        return this.getMainBus(true);
    }
    getMainOutputBus() {
        return this.getMainBus(false);
    }
    getMainBus(input) {
        return this.getBus(input, 'main');
    }
    getInputBus(name) {
        this.getBus(true, name);
    }
    getOutputBus(name) {
        return this.getBus(false, name);
    }
    getBus(input, name) {
        if (input)
            return this.inputs.find(bus => bus.name == name);
        else
            return this.outputs.find(bus => bus.name == name);
    }
    addInputBus(bus) {
        return this.addBus(true, bus);
    }
    addOutputBus(bus) {
        return this.addBus(false, bus);
    }
    channelCount(input) {
        let count = 0;
        for (let bus of (input) ? this.inputs : this.outputs)
            count += bus.channelCount();
        return count;
    }
    outputChannelCount() {
        return this.channelCount(false);
    }
    inputChannelCount() {
        return this.channelCount(true);
    }
    _remove_invalid_connections() {
        this.sends = this.sends.filter(con => con.repair());
        this.receives = this.receives.filter(con => con.repair());
    }
    _set_nodeid(id) {
        this.id = id;
        this.outputs.forEach(b => b._set_nodeid(id));
        this.inputs.forEach(b => b._set_nodeid(id));
    }
    _unset_nodeid(autoremove = false) {
        this.id = -1;
        this.outputs.forEach(b => b._set_nodeid(-1));
        this.inputs.forEach(b => b._set_nodeid(-1));
        if (autoremove)
            this._remove_invalid_connections();
    }
}
exports.Node = Node;
class InputNode extends Node {
    constructor(name) {
        super(name, '__input');
    }
}
exports.InputNode = InputNode;
class OutputNode extends Node {
    constructor(name) {
        super(name, '__output');
    }
}
exports.OutputNode = OutputNode;
class PluginNode extends Node {
    constructor(name) {
        super(name, 'vst_processor');
    }
}
exports.PluginNode = PluginNode;
class NativeNode extends Node {
    constructor(name, native_node_type) {
        super(name, 'native_processor');
        this.native_node_type = native_node_type;
    }
    attachEventListener(con) {
        this.connection = con;
        this.native_event_name = `${this.native_node_type}_${this.id}`;
        this.remote = this.connection.getRequester(this.native_event_name);
        this.remote.on('alive', this.onRemoteAlive.bind(this));
        this.remoteAttached();
    }
    destroy() {
        log.info("Destroy native node");
        this.remote.removeAllListeners('alive');
        this.remote.destroy();
    }
}
exports.NativeNode = NativeNode;
class Module {
}
exports.Module = Module;
class Graph {
    constructor(vst) {
        this.nodes = [];
        this.connections = [];
        this.modules = [];
        this.node_count = 1;
        this.vst = vst;
    }
    attachConnection(connection) {
        this.connection = connection;
    }
    addNode(node) {
        let node_id = ++this.node_count;
        node._set_nodeid(node_id);
        this.nodes.push(node);
        if (node instanceof NativeNode)
            node.attachEventListener(this.connection);
        return node_id;
    }
    addConnection(connection) {
        this.connections.push(connection);
        let self = this;
        self.getNode(connection.sources[0].n).sends.push(connection);
        self.getNode(connection.destinations[0].n).receives.push(connection);
    }
    removeNode(node) {
        let rmv_node;
        if (node instanceof Node)
            rmv_node = this.nodes.splice(this.nodes.indexOf(node))[0];
        else if (typeof node == 'number')
            rmv_node = this.nodes.splice(this.nodes.findIndex(n => n.id === node), 1)[0];
        if (rmv_node) {
            rmv_node._unset_nodeid(true);
            if (rmv_node instanceof NativeNode)
                rmv_node.destroy();
        }
        this.fix();
        return rmv_node;
    }
    fix() {
        this.connections = this.connections.filter(c => c.repair());
        this.nodes.forEach(n => n._remove_invalid_connections());
        this.modules.forEach(mod => mod.graphChanged(this));
    }
    getNode(nodeId) {
        return this.nodes.find(n => n.id == nodeId);
    }
    setInputNode(count) {
        this.addNode(new InputNode('graph_input')
            .addOutputBus(Bus.createMainAny(count)));
    }
    setOutputNode(count) {
        this.addNode(new OutputNode('graph_output')
            .addInputBus(Bus.createMainAny(count)));
    }
    getInputNode() {
        return this.nodes.find(n => n.type == '__input');
    }
    getOutputNode() {
        return this.nodes.find(n => n.type == '__output');
    }
    graphRootBus() {
        return this.getInputNode().getMainOutputBus();
    }
    graphExitBus() {
        return this.getOutputNode().getMainInputBus();
    }
    addModule(mod) {
        ++this.node_count;
        mod.build(this);
        mod.id = this.node_count;
        mod.graph = this;
        this.modules.push(mod);
        this.rebuild();
    }
    hasModule(mod) {
        return this.modules.indexOf(mod) != -1;
    }
    removeModule(mod) {
        let mod_idx = this.modules.indexOf(mod);
        if (mod_idx == -1)
            return null && log.error('Could not find Module to remove');
        let removed = this.modules.splice(mod_idx, 1)[0];
        if (removed)
            removed.destroy(this);
        return removed;
    }
    rebuild() {
        this.modules.forEach(mod => mod.graphChanged(this));
    }
    _export_graph() {
        let out = {
            nodes: this.nodes.map(n => {
                let obj = {};
                obj.ins_count = n.getMainInputBus() ? n.getMainInputBus().channelCount() : 0;
                obj.outs_count = n.getMainOutputBus() ? n.getMainOutputBus().channelCount() : 0;
                obj.id = n.id;
                obj.type = n.type;
                obj.name = n.name;
                obj.processor_type = n.native_node_type;
                return obj;
            }),
            connections: this.connections
        };
        return out;
    }
    clear() {
        [...this.modules].forEach(module => this.removeModule(module));
        this.modules = [];
        this.node_count = 1;
        this.nodes = [];
        this.connections = [];
    }
}
exports.Graph = Graph;
//# sourceMappingURL=dsp_graph.js.map