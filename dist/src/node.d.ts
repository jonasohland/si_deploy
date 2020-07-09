/// <reference types="node" />
import { Message, NodeMessageInterceptor, Requester, SIServerWSSession } from './communication';
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
    abstract set(val: EncapsulatedType): Promise<void>;
    abstract get(): Promise<EncapsulatedType>;
    init(): void;
    _export(): Promise<ManagedNodeStateObjectData>;
    _map(): {
        oid: string;
        uid: string;
        name: string;
    };
    modify(): void;
}
export declare abstract class ManagedNodeStateRegister {
    _name: string;
    _uid: string;
    _dirty: boolean;
    _is_map: boolean;
    init(name: string): void;
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
    _restore(s: ManagedNodeStateRegisterData, strategy: StateUpdateStrategy): Promise<void | void[]>;
}
export declare abstract class ManagedNodeStateMapRegister extends ManagedNodeStateRegister {
    _objects: Record<string, ManagedNodeStateObject<any>>;
    constructor();
    abstract remove(name: string, obj: ManagedNodeStateObject<any>): Promise<void>;
    abstract insert(name: string, obj: ManagedNodeStateObjectData): Promise<ManagedNodeStateObject<any>>;
    _wrap_insert(name: string, obj: ManagedNodeStateObjectData): Promise<ManagedNodeStateObject<any>>;
    _wrap_remove(name: string, obj: ManagedNodeStateObject<any>): Promise<void>;
    _restore_map(s: ManagedNodeStateRegisterData, strategy: StateUpdateStrategy): Promise<void>;
    add(name: string, obj: ManagedNodeStateObject<any>): void;
}
export declare abstract class ManagedNodeStateListRegister extends ManagedNodeStateRegister {
    _objects: ManagedNodeStateObject<any>[];
    constructor();
    abstract remove(obj: ManagedNodeStateObject<any>): Promise<void>;
    abstract insert(obj: ManagedNodeStateObjectData): Promise<ManagedNodeStateObject<any>>;
    private _wrap_insert;
    _update_list(s: ManagedNodeStateRegisterData, strategy: StateUpdateStrategy): Promise<void[]>;
    add(obj: ManagedNodeStateObject<any>): void;
}
export declare abstract class NodeModule {
    _state_manager: Requester;
    _name: string;
    _uid: string;
    _data: any;
    _registers: Record<string, ManagedNodeStateRegister>;
    _dirty: boolean;
    abstract restore(data: any): void;
    constructor(con: SIServerWSSession, target: string);
    _export(): Promise<ManagedNodeStateModuleData>;
    _map(): ModuleReference;
    add(reg: ManagedNodeStateRegister, name: string): void;
    _restore(state: ManagedNodeStateModuleData, strategy?: StateUpdateStrategy): Promise<(void | void[])[]>;
    _merge(state: ManagedNodeStateModuleData): void;
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
    }[];
}
export declare class NodeDataController {
    nodes: Node[];
    config: any;
    addRemoteNode(session: SIServerWSSession): void;
    removeRemoteNode(session: SIServerWSSession): void;
}
export declare class NodeDataStorage extends NodeMessageInterceptor {
    _modules: Record<string, ManagedNodeStateModuleData>;
    _local_file: string;
    _save_timeout: NodeJS.Timeout;
    _saving: boolean;
    _save_again: boolean;
    constructor(config: any);
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
export {};