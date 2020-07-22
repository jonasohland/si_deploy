/// <reference types="node" />
import { EventEmitter } from 'events';
import * as COM from './communication';
import { PortTypes } from './dsp_defs';
import { VSTScanner } from './vst';
export declare class AmbisonicsProperties {
    order: number;
    normalization: string;
}
/**
 * Base class for an Input/Output of a node
 */
export declare class Port {
    name: string;
    type: PortTypes;
    i: number;
    ni: number;
    n: number;
    /**
     * Total number of channels per port
     */
    c: number;
    constructor(name: string, type: PortTypes);
    isAmbiPort(): boolean;
}
export declare class Connection {
    sources: Port[];
    destinations: Port[];
    constructor(sources: Port[], destinations: Port[]);
    repair(): boolean;
    valid(): number;
    channelCount(): number;
    destChannelCount(): number;
    srcChannelCount(): number;
    _channel_count(src: boolean): number;
}
export declare class Bus {
    name: string;
    type: PortTypes;
    ports: Port[];
    constructor(name: string, type: PortTypes);
    channelCount(): number;
    portCount(): number;
    connect(other: Bus): Connection;
    connectIdx(other: Bus, thisIndex: number): Connection;
    connectIdxN(other: Bus, thisIndex: number, thisCount: number): Connection;
    connectIdxIdx(other: Bus, thisIndex: number, otherIndex: number): Connection;
    connectIdxNIdx(other: Bus, thisIndex: number, thisCount: number, otherIndex: number): Connection;
    _set_start_idx(idx: number): void;
    _set_nodeid(id: number): void;
    static _with_ports(count: number, bus: Bus, type: PortTypes): Bus;
    static createAny(name: string, count: number): Bus;
    static createMono(name: string, count: number): Bus;
    static createStereo(name: string, count: number): Bus;
    static create(name: string, count: number, type: PortTypes): Bus;
    static createMain(count: number, type: PortTypes): Bus;
    static createMainAny(count: number): Bus;
    static createMainMono(count: number): Bus;
    static createMainStereo(count: number): Bus;
}
export declare class AmbiBus extends Bus {
    order: number;
    static createForOrder(name: string, order: number, count: number): Bus;
    static createMainForOrder(order: number, count: number): Bus;
}
export declare class AmbiPort extends Port {
    ambi: AmbisonicsProperties;
}
export declare class BusProxy {
    buses: Bus[];
    main(): Bus;
}
export declare class Node extends EventEmitter {
    id: number;
    type: string;
    name: string;
    inputs: Bus[];
    outputs: Bus[];
    sends: Connection[];
    receives: Connection[];
    constructor(name: string, type: string);
    addBus(input: boolean, bus: Bus): this;
    getMainInputBus(): Bus;
    getMainOutputBus(): Bus;
    getMainBus(input: boolean): Bus;
    getInputBus(name: string): void;
    getOutputBus(name: string): Bus;
    getBus(input: boolean, name: string): Bus;
    addInputBus(bus: Bus): this;
    addOutputBus(bus: Bus): this;
    channelCount(input: boolean): number;
    outputChannelCount(): number;
    inputChannelCount(): number;
    _remove_invalid_connections(): void;
    _set_nodeid(id: number): void;
    _unset_nodeid(autoremove?: boolean): void;
}
export declare class InputNode extends Node {
    constructor(name: string);
}
export declare class OutputNode extends Node {
    constructor(name: string);
}
export declare class PluginNode extends Node {
    plugin_identifier: string;
    constructor(name: string);
}
export declare abstract class NativeNode extends Node {
    native_node_type: string;
    connection: COM.Connection;
    remote: COM.Requester;
    native_event_name: string;
    constructor(name: string, native_node_type: string);
    attachEventListener(con: COM.Connection): void;
    abstract onRemoteAlive(): void;
    abstract remoteAttached(): void;
}
export declare abstract class Module {
    id: number;
    graph: Graph;
    abstract input(graph: Graph): Bus;
    abstract output(graph: Graph): Bus;
    abstract graphChanged(graph: Graph): void;
    abstract build(graph: Graph): void;
    abstract destroy(graph: Graph): void;
}
export declare class Graph {
    nodes: Node[];
    connections: Connection[];
    modules: Module[];
    node_count: number;
    connection: COM.Connection;
    remote: COM.Requester;
    vst: VSTScanner;
    constructor(vst: VSTScanner);
    addNode(node: Node): number;
    addConnection(connection: Connection): void;
    removeNode(node: number): Node;
    removeNode(node: Node): Node;
    fix(): void;
    getNode(nodeId: number): Node;
    setInputNode(count: number): void;
    setOutputNode(count: number): void;
    getInputNode(): InputNode;
    getOutputNode(): OutputNode;
    mainInBus(): Bus;
    mainOutBus(): Bus;
    addModule(mod: Module): void;
    hasModule(mod: Module): boolean;
    removeModule(mod: Module): Module;
    rebuild(): void;
    _export_graph(): {
        nodes: any[];
        connections: Connection[];
    };
    clear(): void;
}
