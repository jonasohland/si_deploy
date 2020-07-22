/// <reference types="socket.io" />
/// <reference types="node" />
import { EventEmitter2 } from 'eventemitter2';
import { Connection, Message, NODE_TYPE, NodeIdentification, NodeMessageInterceptor, Requester, SIServerWSServer, SIServerWSSession } from './communication';
import WebInterface from './web_interface';
export declare enum StateUpdateStrategy {
    /**
     * Overwrites everything and removes everything not present in incoming
     * data
     */
    OVERWRITE = 0,
    /**
     * Updates existing references and removes everything not present in
     * incoming data
     */
    SYNC = 1,
    /** Updates existing references and does not remove anything */
    MERGE = 2,
    /** Only update existing references */
    PICK = 3
}
/**
 * Contains the state data of a single object.
 * Uniquely identifiable by its object_id troughout its lifetime.
 */
export interface ManagedNodeStateObjectData {
    object_id: string;
    uid: string;
    data: any;
}
/**
 * Base interface for a single register that stores some state of a module
 */
export interface ManagedNodeStateRegisterData {
    name: string;
    uid: string;
    map: boolean;
}
/**
 * Raw data for a register type that stores its data in a simple list
 */
export interface ManagedNodeStateListRegisterData extends ManagedNodeStateRegisterData {
    objects: ManagedNodeStateObjectData[];
}
/**
 * Raw data for a register type that stores its data in a map
 */
export interface ManagedNodeStateMapRegisterData extends ManagedNodeStateRegisterData {
    objects: Record<string, ManagedNodeStateObjectData>;
}
/**
 * Raw node state data
 */
export interface ManagedNodeStateModuleData {
    name: string;
    uid: string;
    raw: any;
    registers: ManagedNodeStateRegisterData[];
}
export interface ObjectReference {
    name?: string;
    oid: string;
    uid: string;
}
export interface RegisterReference {
    uid: string;
    name: string;
    map: boolean;
    objects: ObjectReference[];
}
/**
 * Map for all state-ids of a module
 */
export interface ModuleReference {
    uid: string;
    name: string;
    registers?: RegisterReference[];
}
export declare abstract class ManagedNodeStateObject<EncapsulatedType extends any> {
    _uid: string;
    _oid: string;
    _dirty: boolean;
    _name: string;
    _parent: ManagedNodeStateRegister;
    abstract set(val: EncapsulatedType): Promise<void>;
    abstract get(): EncapsulatedType;
    init(parent: ManagedNodeStateRegister): void;
    _export(): ManagedNodeStateObjectData;
    save(): Promise<Message>;
    _map(): {
        oid: string;
        uid: string;
        name: string;
    };
    modify(): void;
    _clear(): void;
}
export declare abstract class ManagedNodeStateRegister {
    _name: string;
    _uid: string;
    _dirty: boolean;
    _is_map: boolean;
    _parent: NodeModule;
    init(name: string, parent: NodeModule): void;
    _wrap_set(data: ManagedNodeStateObjectData, obj: ManagedNodeStateObject<any>): Promise<void>;
    _object_iter(): ManagedNodeStateObject<any>[];
    _export(): Promise<ManagedNodeStateRegisterData>;
    _map(): {
        uid: string;
        name: string;
        map: boolean;
        objects: {
            oid: string;
            uid: string;
            name: string;
        }[];
    };
    modify(): void;
    _clear(): void;
    _save_child(obj: ManagedNodeStateObject<any>): Promise<Message>;
    save(): Promise<Message>;
    _restore(s: ManagedNodeStateRegisterData, strategy: StateUpdateStrategy): Promise<void | void[]>;
    applyObjectData(obj: ManagedNodeStateObjectData, name?: string): Promise<void>;
}
export declare abstract class ManagedNodeStateMapRegister extends ManagedNodeStateRegister {
    _objects: Record<string, ManagedNodeStateObject<any>>;
    constructor();
    abstract remove(name: string, obj: ManagedNodeStateObject<any>): Promise<void>;
    abstract insert(name: string, obj: any): Promise<ManagedNodeStateObject<any>>;
    _wrap_insert(name: string, obj: ManagedNodeStateObjectData): Promise<ManagedNodeStateObject<any>>;
    _wrap_remove(name: string, obj: ManagedNodeStateObject<any>): Promise<void>;
    insertExt(name: string, data: ManagedNodeStateObjectData): Promise<void>;
    _restore_map(s: ManagedNodeStateRegisterData, strategy: StateUpdateStrategy): Promise<void>;
    add(name: string, obj: ManagedNodeStateObject<any>): void;
}
export declare abstract class Publisher {
    constructor();
    abstract joined(socket: SocketIO.Socket, topic: string): void;
    abstract left(socket: SocketIO.Socket, topic: string): void;
    abstract publish(topic: string, event: string, ...data: any[]): void;
    abstract hasSubs(topic: string): boolean;
    _pub_init(server: Server): void;
}
export declare abstract class ManagedNodeStateListRegister extends ManagedNodeStateRegister {
    _objects: ManagedNodeStateObject<any>[];
    constructor();
    abstract remove(obj: ManagedNodeStateObject<any>): Promise<void>;
    abstract insert(obj: any): Promise<ManagedNodeStateObject<any>>;
    private _wrap_insert;
    insertExt(data: ManagedNodeStateObjectData): Promise<void>;
    _update_list(s: ManagedNodeStateRegisterData, strategy: StateUpdateStrategy): Promise<void[]>;
    removeItem(item: ManagedNodeStateObject<any>): boolean;
    add(obj: ManagedNodeStateObject<any>): void;
}
export declare abstract class NodeModule extends Publisher {
    _parent: Node;
    _server: Server;
    _name: string;
    _uid: string;
    _data: any;
    _registers: Record<string, ManagedNodeStateRegister>;
    _dirty: boolean;
    events: EventEmitter2;
    abstract init(): void;
    abstract start(remote: Connection): void;
    abstract destroy(): void;
    constructor(target: string);
    publish(topic: string, event: string, ...data: any[]): void;
    hasSubs(topic: string): boolean;
    _init(parent: Node, server: Server): void;
    _start(remote: Connection): void;
    modify(): void;
    _export(): Promise<ManagedNodeStateModuleData>;
    _save_child(reg: ManagedNodeStateRegister, obj?: ManagedNodeStateObject<any>): Promise<Message>;
    save(): Promise<Message>;
    _clear(): void;
    _map(): ModuleReference;
    add(reg: ManagedNodeStateRegister, name: string): void;
    isInitialized(): boolean;
    myNode(): Node;
    myNodeId(): string;
    _restore(state: ManagedNodeStateModuleData, strategy?: StateUpdateStrategy): Promise<(void | void[])[]>;
    applyModuleData(mod: ManagedNodeStateModuleData): Promise<(void | void[])[]>;
    applyRegisterData(name: string, reg: ManagedNodeStateRegisterData): Promise<void>;
    applyObjectData(regname: string, obj: ManagedNodeStateObjectData): Promise<void>;
    emitToModule(module: string, event: string, ...data: any[]): void;
    emitToNode(event: string, ...data: any[]): void;
    handleNodeEvent(event: string, handler: (...data: any[]) => void): void;
    handleModuleEvent(event: string, handler: (...data: any[]) => void): void;
}
interface UpdateObjectMessage {
    module: string;
    register: string;
    data: ManagedNodeStateObjectData;
}
interface UpdateRegisterMessage {
    module: string;
    data: ManagedNodeStateRegisterData;
}
interface UpdateModuleMessage {
    data: ManagedNodeStateModuleData;
}
interface GetNodeStateMessage {
    modules: {
        name: string;
        data: ModuleReference;
    }[];
}
interface ReturnNodeStateMessage {
    modules: {
        name: string;
        module: ManagedNodeStateModuleData;
    }[];
    registers: {
        mod: string;
        register: ManagedNodeStateRegisterData;
    }[];
    objects: {
        mod: string;
        register_name: string;
        object: ManagedNodeStateObjectData;
        add?: boolean;
        name?: string;
    }[];
}
export declare class NodeDataStorage extends NodeMessageInterceptor {
    _modules: Record<string, ManagedNodeStateModuleData>;
    _local_file: string;
    _save_timeout: NodeJS.Timeout;
    _saving: boolean;
    _save_again: boolean;
    constructor(config: any, options: any);
    restoreStateFromFile(): Promise<any>;
    writeState(): Promise<unknown>;
    saveLater(): boolean;
    target(): string;
    handleMessage(msg: Message, from_ipc: boolean): Promise<boolean | void | ReturnNodeStateMessage>;
    updateObject(msg: UpdateObjectMessage): boolean;
    updateRegister(msg: UpdateRegisterMessage): void;
    updateModule(msg: UpdateModuleMessage): void;
    get(msg: GetNodeStateMessage): ReturnNodeStateMessage;
    _check_module(out: ReturnNodeStateMessage, name: string, modref: ModuleReference): void;
    _check_register(out: ReturnNodeStateMessage, mod: string, register: ManagedNodeStateRegisterData, ref: RegisterReference): void;
    _check_object(out: ReturnNodeStateMessage, mod: string, register_name: string, local_obj: ManagedNodeStateObjectData, ref: ObjectReference): void;
}
export declare abstract class Node {
    _id: NodeIdentification;
    _remote: Connection;
    _modules: Record<string, NodeModule>;
    _state_manager: Requester;
    events: EventEmitter2;
    constructor(id: NodeIdentification);
    abstract init(): void;
    abstract start(): void;
    abstract destroy(): void;
    _destroy(): void;
    _init(remote: Connection, node_events: EventEmitter2, server: Server): Promise<void>;
    _start(): void;
    _save_child(mod: NodeModule, reg?: ManagedNodeStateRegister, obj?: ManagedNodeStateObject<any>): Promise<Message>;
    _reload_data_from_node(): Promise<void>;
    name(): string;
    id(): string;
    type(): NODE_TYPE;
    remote(): Connection;
    add(module: NodeModule): void;
    getModule<ModuleType>(name: string): ModuleType;
    emitToModule(module: string, event: string, ...data: any[]): void;
    emitToNode(event: string, ...data: any[]): void;
}
export declare type WEBIFNodeEventHandler = (socket: SocketIO.Socket, node: Node, data: any, transaction?: TransactionID) => void;
export declare type WEBIFEventHandler = (socket: SocketIO.Socket, data: any) => void;
export declare type TransactionID = string;
export declare abstract class ServerModule extends Publisher {
    _name: string;
    events: EventEmitter2;
    server: Server;
    webif: WebInterface;
    _init(srv: Server, webif: WebInterface, events: EventEmitter2): void;
    publish(topic: string, event: string, ...data: any[]): void;
    hasSubs(topic: string): boolean;
    abstract init(): void;
    constructor(name: string);
    getNode(id: string): Node;
    handleWebInterfaceEvent(event: string, handler: WEBIFNodeEventHandler): void;
    handleGlobalWebInterfaceEvent(event: string, handler: WEBIFEventHandler): void;
    emitToModule(node: string, module: string, event: string, ...data: any[]): void;
    emitToNode(node: string, event: string, ...data: any[]): void;
}
export declare class ServerInternalsModule extends ServerModule {
    joined(socket: SocketIO.Socket, topic: string): void;
    left(socket: SocketIO.Socket, topic: string): void;
    nodesChanged(): void;
    nodeIdList(): NodeIdentification[];
    init(): void;
    constructor();
}
export declare abstract class Server {
    _srv: SIServerWSServer;
    _nodes: Record<string, Node>;
    _modules: Record<string, ServerModule>;
    _webif: WebInterface;
    _event_bus: EventEmitter2;
    _internals: ServerInternalsModule;
    constructor(wssrv: SIServerWSServer, webif: WebInterface);
    add(module: ServerModule): void;
    emitToNodeModule(node: string, module: string, event: string, ...data: any[]): void;
    emitToNode(node: string, event: string, ...data: any[]): void;
    _on_add_remote(session: SIServerWSSession): void;
    _on_remove_remote(session: SIServerWSSession): void;
    _check_server_has_subscribers(module: string, topic: string): boolean;
    _check_node_has_subscribers(nodeid: string, module: string, topic: string): boolean;
    _do_publish_server(module: string, topic: string, event: string, ...data: any[]): void;
    _do_publish_node(nodeid: string, module: string, topic: string, event: string, ...data: any[]): void;
    _notify_join_server_room(socket: SocketIO.Socket, module: string, topic: string): void;
    _notify_join_node_room(socket: SocketIO.Socket, nodeid: string, module: string, topic: string): void;
    _notify_leave_server_room(socket: SocketIO.Socket, module: string, topic: string): void;
    _notify_leave_node_room(socket: SocketIO.Socket, nodeid: string, module: string, topic: string): void;
    abstract createNode(id: NodeIdentification): Node;
    abstract destroyNode(node: Node): void;
}
export {};
