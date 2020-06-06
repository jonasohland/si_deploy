/// <reference types="node" />
import { EventEmitter } from 'events';
import * as IPC from './ipc';
export declare enum PortTypes {
    Any = 0,
    Mono = 1,
    Stereo = 2,
    Quad = 3,
    Surround_5_1 = 4,
    Surround_7_1 = 5,
    Surround_10_2 = 6,
    Surround_11_1 = 7,
    Surround_22_2 = 8,
    x3D_5_4_1 = 9,
    x3D_7_4_1 = 10,
    x3D_4_0_4 = 11,
    Ambi_O0 = 12,
    Ambi_O1 = 13,
    Ambi_O2 = 14,
    Ambi_O3 = 15,
    Ambi_O4 = 16,
    Ambi_O5 = 17,
    Ambi_O6 = 18,
    Ambi_O7 = 19,
    Ambi_O8 = 20,
    Ambi_O9 = 21,
    Ambi_O10 = 22,
    Ambi_O11 = 23
}
export declare function stringToPortType(str: string): PortTypes.Any | PortTypes.Mono | PortTypes.Stereo | PortTypes.Surround_5_1;
export declare const PortTypeChannelCount: number[];
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
    mainIn(): Bus;
    mainOut(): Bus;
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
    processor_type: string;
    connection: IPC.Connection;
    remote: IPC.Requester;
    native_event_name: string;
    constructor(name: string, native_node_type: string);
    attachEventListener(con: IPC.Connection): void;
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
    remote: IPC.Requester;
    process: IPC.Connection;
    constructor(process: IPC.Connection);
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
    sync(): Promise<void>;
    rebuild(): void;
    _export(): {
        nodes: any[];
        connections: Connection[];
    };
}
