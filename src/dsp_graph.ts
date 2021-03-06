import {EventEmitter} from 'events';
import graphviz, { graph } from 'graphviz';

import * as COM from './communication';
import {PortTypes, SourceUtils, stringToPortType} from './dsp_defs'
import * as Logger from './log';
import {VSTScanner} from './vst';
import WebInterface from './web_interface';
import e from 'express';

const log = Logger.get('DSPGPH');

function _portarr_chcount(ports: Port[])
{
    return ports.reduce(
        (count: number, port: Port) => { return count + port.c }, 0);
}

export class AmbisonicsProperties {
    order: number;
    normalization: string;
}

/**
 * Base class for an Input/Output of a node
 */
export class Port {

    name: string;
    type: PortTypes;

    i: number  = -1;
    ni: number = -1;
    n: number  = -1;

    /**
     * Total number of channels per port
     */
    c: number = 1;

    constructor(name: string, type: PortTypes)
    {
        this.type = type;
        this.name = name;
        this.c    = SourceUtils[type].channels;
    }

    isAmbiPort()
    {
        return this instanceof AmbiPort;
    }
}

export class Connection {

    sources: Port[]      = [];
    destinations: Port[] = [];

    constructor(sources: Port[], destinations: Port[])
    {
        this.sources      = sources;
        this.destinations = destinations;
    }

    repair()
    {
        this.sources      = this.sources.filter(p => p.n != -1);
        this.destinations = this.destinations.filter(p => p.n != -1);

        while (this.destChannelCount() > this.srcChannelCount())
            this.destinations.pop();

        return this.srcChannelCount() == this.destChannelCount();
    }

    valid()
    {
        return this.srcChannelCount() == this.destChannelCount()
               && this.sources.filter(p => p.n != -1).length
               && this.destinations.filter(p => p.n != -1).length;
    }

    channelCount()
    {
        if (!this.valid())
            throw Error('Invalid connection');

        return this.srcChannelCount();
    }

    destChannelCount()
    {
        return this._channel_count(false);
    }

    srcChannelCount()
    {
        return this._channel_count(true);
    }

    _channel_count(src: boolean)
    {
        let count = 0;

        for (let port of src ? this.sources : this.destinations)
            count += port.c;

        return count;
    }
}

export class Bus {

    name: string;
    type: PortTypes;
    ports: Port[] = [];

    constructor(name: string, type: PortTypes)
    {
        this.name = name;
        this.type = type;
    }

    addPort(port: Port)
    {
        this.ports.push(port);
    }

    channelCount()
    {
        let count = 0;
        for (let port of this.ports)
            count += port.c;
        return count;
    }

    portCount()
    {
        return this.ports.length;
    }

    portCountForChannels(channels: number)
    {
        let port_chcount = SourceUtils[this.type].channels;
        return Math.ceil(channels / port_chcount);
    }

    connect(other: Bus)
    {
        return this.connectIdxNIdx(
            other, 0, this.portCountForChannels(other.channelCount()), 0);
    }

    connectIdx(other: Bus, thisIndex: number)
    {
        return this.connectIdxNIdx(
            other, thisIndex, this.portCountForChannels(other.channelCount()),
            0);
    }

    connectOtherIdx(other: Bus, otherIndex: number)
    {
        return this.connectIdxNIdx(
            other, 0, this.portCountForChannels(other.channelCount()),
            otherIndex);
    }

    connectIdxN(other: Bus, thisIndex: number, thisCount: number)
    {
        return this.connectIdxNIdx(other, thisIndex, thisCount, 0);
    }

    connectIdxIdx(other: Bus, thisIndex: number, otherIndex: number)
    {
        return this.connectIdxNIdx(
            other, thisIndex, this.portCountForChannels(other.channelCount()),
            otherIndex);
    }

    connectIdxNIdx(other: Bus, thisIndex: number, thisCount: number,
                   otherIndex: number)
    {
        let sources: Port[]      = [];
        let destinations: Port[] = [];

        sources = this.ports.slice(thisIndex, thisIndex + thisCount);

        let requested_chcount = _portarr_chcount(sources);
        let other_chcount     = 0;
        let i                 = otherIndex;

        do {
            let cport = other.ports[i];

            other_chcount += cport.c;
            destinations.push(cport);

        } while (other.ports.length > ++i && other_chcount < requested_chcount
                 && other_chcount);

        if (other_chcount == requested_chcount)
            return new Connection(sources, destinations);
    }

    _set_start_idx(idx: number)
    {
        for (let i in this.ports) {
            this.ports[i].ni
                = idx + (Number.parseInt(i) * SourceUtils[this.type].channels);
        }
    }

    _set_nodeid(id: number)
    {
        this.ports.forEach(p => p.n = id);
    }

    static _with_ports(count: number, bus: Bus, type: PortTypes)
    {
        for (let i = 0; i < count; ++i) {
            let port = new Port(
                `${bus.name} ${i + 1} (${PortTypes[bus.type]})`, type);
            port.i = i;
            bus.ports.push(port);
        }

        return bus;
    }

    static createAny(name: string, count: number)
    {
        return Bus._with_ports(
            count, new Bus(name, PortTypes.Any), PortTypes.Any);
    }

    static createMono(name: string, count: number)
    {
        return Bus._with_ports(
            count, new Bus(name, PortTypes.Mono), PortTypes.Mono);
    }

    static createStereo(name: string, count: number)
    {
        return Bus._with_ports(
            count, new Bus(name, PortTypes.Stereo), PortTypes.Stereo);
    }

    static create(name: string, count: number, type: PortTypes)
    {
        return Bus._with_ports(count, new Bus(name, type), type);
    }

    static createMain(count: number, type: PortTypes)
    {
        return Bus._with_ports(count, new Bus('main', type), type);
    }

    static createMainAny(count: number)
    {
        return Bus.createMain(count, PortTypes.Any);
    }

    static createMainMono(count: number)
    {
        return Bus.createMain(count, PortTypes.Mono);
    }

    static createMainStereo(count: number)
    {
        return Bus.createMain(count, PortTypes.Stereo);
    }

    static join(name: string, ...buses: Bus[])
    {
        let ty     = buses[0].type;
        let newbus = new Bus(name, ty);

        buses.forEach(bus => {
            if (bus.type != ty)
                throw 'Type mismatch while joining busses';
            bus.ports.forEach(port => newbus.addPort(port));
        });
    }
}

export class AmbiBus extends Bus {

    order: number;

    static createForOrder(name: string, order: number, count: number)
    {
        return Bus.create(name, count, PortTypes.Ambi_O0 + order);
    }

    static createMainForOrder(order: number, count: number)
    {
        return AmbiBus.createForOrder('main', order, count);
    }
}

export class AmbiPort extends Port {
    ambi: AmbisonicsProperties;
}

export class BusProxy {

    buses: Bus[];

    main()
    {
        return this.buses.find(b => b.name == 'main');
    }
}

export class Node extends EventEmitter {

    id: number = -1;
    type: string;
    name: string;
    inputs: Bus[]  = [];
    outputs: Bus[] = [];

    sends: Connection[]    = [];
    receives: Connection[] = [];

    constructor(name: string, type: string)
    {
        super();
        this.name = name;
        this.type = type;
    }

    addBus(input: boolean, bus: Bus)
    {
        bus._set_start_idx(this.channelCount(input));

        if (input)
            this.inputs.push(bus);
        else
            this.outputs.push(bus);

        return this;
    }

    getMainInputBus()
    {
        return this.getMainBus(true);
    }

    getMainOutputBus()
    {
        return this.getMainBus(false);
    }

    getMainBus(input: boolean)
    {
        return this.getBus(input, 'main')
    }

    getInputBus(name: string)
    {
        this.getBus(true, name);
    }

    getOutputBus(name: string)
    {
        return this.getBus(false, name);
    }

    getBus(input: boolean, name: string)
    {
        if (input)
            return this.inputs.find(bus => bus.name == name);
        else
            return this.outputs.find(bus => bus.name == name);
    }

    addInputBus(bus: Bus)
    {
        return this.addBus(true, bus);
    }

    addOutputBus(bus: Bus)
    {
        return this.addBus(false, bus);
    }

    channelCount(input: boolean)
    {
        let count = 0;

        for (let bus of (input) ? this.inputs : this.outputs)
            count += bus.channelCount();

        return count;
    }

    outputChannelCount()
    {
        return this.channelCount(false);
    }

    inputChannelCount()
    {
        return this.channelCount(true);
    }

    _remove_invalid_connections()
    {
        this.sends    = this.sends.filter(con => con.repair());
        this.receives = this.receives.filter(con => con.repair());
    }

    _set_nodeid(id: number)
    {
        this.id = id;
        this.outputs.forEach(b => b._set_nodeid(id));
        this.inputs.forEach(b => b._set_nodeid(id));
    }

    _unset_nodeid(autoremove: boolean = false)
    {
        this.id = -1;
        this.outputs.forEach(b => b._set_nodeid(-1));
        this.inputs.forEach(b => b._set_nodeid(-1));

        if (autoremove)
            this._remove_invalid_connections();
    }
}

export class InputNode extends Node {
    constructor(name: string)
    {
        super(name, '__input');
    }
}

export class OutputNode extends Node {
    constructor(name: string)
    {
        super(name, '__output');
    }
}

export class PluginNode extends Node {

    plugin_identifier: string

    constructor(name: string)
    {
        super(name, 'vst_processor');
    }
}

export abstract class NativeNode extends Node {

    native_node_type: string;
    connection: COM.Connection;
    remote: COM.Requester;
    native_event_name: string;

    constructor(name: string, native_node_type: string)
    {
        super(name, 'native_processor');
        this.native_node_type = native_node_type;
    }

    attachEventListener(con: COM.Connection)
    {
        this.connection        = con;
        this.native_event_name = `${this.native_node_type}_${this.id}`;
        this.remote = this.connection.getRequester(this.native_event_name);
        this.remote.on('alive', this.onRemoteAlive.bind(this));
        this.remote.on('prepared', this.onRemotePrepared.bind(this));
        this.remoteAttached();
    }

    destroy()
    {
        log.info('Destroy native node ' + this.native_event_name);
        this.remote.removeAllListeners('alive');
        this.remote.removeAllListeners('preapred');
        this.remote.destroy();
    }

    abstract onRemotePrepared(): void;
    abstract onRemoteAlive(): void;
    abstract remoteAttached(): void;
}

export abstract class Module {
    id: number;
    graph: Graph;

    sendNotification(title: string, message: string)
    {
        log.verbose(`DSP Module notification: [${title}] ${message}`);
        let webif = this.graph.webif();
        if (webif) 
            webif.broadcastNotification(title, message);
        else
            log.warn("Could not deliver notification to Web Interface");
    }

    sendError(title: string, message: string) 
    {
        log.error(`DSP Module error: [${title}] ${message}`);
        let webif = this.graph.webif();
        if (webif) 
            webif.broadcastError(title, message);
        else
            log.warn("Could not deliver notification to Web Interface");
    }

    abstract input(graph: Graph): Bus;
    abstract output(graph: Graph): Bus;
    abstract graphChanged(graph: Graph): void;
    abstract build(graph: Graph): void;
    abstract destroy(graph: Graph): void;
}

export class Graph {

    nodes: Node[]             = [];
    connections: Connection[] = [];
    modules: Module[]         = [];

    node_count: number = 1;

    connection: COM.Connection;
    remote: COM.Requester;
    vst: VSTScanner;

    _webif: WebInterface;

    constructor(vst: VSTScanner, webif: WebInterface)
    {
        this.vst = vst;
        this._webif = webif;
    }

    attachConnection(connection: COM.Connection)
    {
        this.connection = connection;
    }

    addNode(node: Node)
    {
        let node_id = ++this.node_count;
        node._set_nodeid(node_id);

        this.nodes.push(node);

        if (node instanceof NativeNode)
            node.attachEventListener(this.connection);

        return node_id;
    }

    addConnection(connection: Connection)
    {
        this.connections.push(connection);

        let self = this;

        self.getNode(connection.sources[0].n).sends.push(connection);
        self.getNode(connection.destinations[0].n).receives.push(connection);
    }

    removeNode(node: number): Node;
    removeNode(node: Node): Node;
    removeNode(node: number|Node)
    {
        let rmv_node: Node;

        if (node instanceof Node)
            rmv_node = this.nodes.splice(this.nodes.indexOf(node), 1)[0];
        else if (typeof node == 'number')
            rmv_node = this.nodes.splice(
                this.nodes.findIndex(n => n.id === node), 1)[0];

        if (rmv_node) {
            rmv_node._unset_nodeid(true);
            if (rmv_node instanceof NativeNode)
                rmv_node.destroy();
        }

        this.fix();

        return rmv_node;
    }

    fix()
    {
        this.connections = this.connections.filter(c => c.repair());
        this.nodes.forEach(n => n._remove_invalid_connections());

        this.modules.forEach(mod => mod.graphChanged(this));
    }

    getNode(nodeId: number)
    {
        return this.nodes.find(n => n.id == nodeId);
    }

    setInputNode(count: number)
    {
        this.addNode(new InputNode('graph_input')
                         .addOutputBus(Bus.createMainAny(count)));
    }

    setOutputNode(count: number)
    {
        this.addNode(new OutputNode('graph_output')
                         .addInputBus(Bus.createMainAny(count)));
    }

    getInputNode()
    {
        return <InputNode>this.nodes.find(n => n.type == '__input');
    }

    getOutputNode()
    {
        return <OutputNode>this.nodes.find(n => n.type == '__output');
    }

    graphRootBus()
    {
        return this.getInputNode().getMainOutputBus();
    }

    graphExitBus()
    {
        return this.getOutputNode().getMainInputBus();
    }

    addModule(mod: Module)
    {
        ++this.node_count;
        mod.graph = this;
        mod.build(this);
        mod.id    = this.node_count;
        mod.graph = this;
        this.modules.push(mod);
        this.rebuild();
    }

    hasModule(mod: Module)
    {
        return this.modules.indexOf(mod) != -1;
    }

    removeModule(mod: Module)
    {
        let mod_idx = this.modules.indexOf(mod);

        if (mod_idx == -1)
            return null && log.error('Could not find Module to remove');

        let removed = this.modules.splice(mod_idx, 1)[0];

        if (removed)
            removed.destroy(this);

        return removed;
    }

    rebuild()
    {
        this.modules.forEach(mod => mod.graphChanged(this));
    }

    webif()
    {
        return this._webif;
    }

    _export_graph()
    {
        let out = {
            nodes : this.nodes.map(n => {
                let obj = <any>
                {
                }

                obj.ins_count  = n.inputChannelCount();
                obj.outs_count = n.outputChannelCount();

                obj.id             = n.id;
                obj.type           = n.type;
                obj.name           = n.name;
                obj.processor_type = (<NativeNode>n).native_node_type;

                return obj;
            }),
            connections : this.connections
        };
        this.visualize();
        return out;
    }

    graphvizlabel(thing: any)
    {
        return `${thing}`;
    }

    visualize()
    {
        let g = graphviz.digraph('dspgraph');

        let inpid = this.getInputNode().id;
        let outpid = this.getOutputNode().id;

        this.nodes.forEach(nd =>  { 
        
            if(nd.id == inpid || nd.id == outpid)
                g.addNode('' + nd.id, { label : nd.name, shape: "rect", width: 5 })
            else
                g.addNode('' + nd.id, { label : nd.name, shape: "rect" });
        });

        this.connections.forEach(connection => {
            connection.sources.forEach((source, idx) => {
                g.addEdge('' + source.n, '' + connection.destinations[0].n, {
                    label : source.c,
                    headlabel : this.graphvizlabel(connection.destinations[0].ni),
                    taillabel :   this.graphvizlabel(source.ni),
                });
            });
        });

        return g.to_dot();
    }

    clear()
    {
        [...this.modules].forEach(module => this.removeModule(module));
        this.modules     = [];
        this.node_count  = 1;
        this.nodes       = [];
        this.connections = [];
    }
}