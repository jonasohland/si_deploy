/// <reference types="socket.io" />
import { Connection } from './communication';
import { ManagedNodeStateListRegister, ManagedNodeStateObject, NodeModule, ServerModule } from './core';
import { PortTypes, SourceParameterSet } from './dsp_defs';
import { DSPNode } from './dsp_node';
import * as Inputs from './inputs';
import { SpatializedInputData, UserData } from './users_defs';
import { ValidateFunction } from 'ajv';
export declare class User extends ManagedNodeStateObject<UserData> {
    data: UserData;
    _man: NodeUsersManager;
    constructor(data: UserData, manager: NodeUsersManager);
    set(val: UserData): Promise<void>;
    get(): UserData;
    inputs(): SpatializedInput[];
}
export declare class SpatializedInput extends ManagedNodeStateObject<SpatializedInputData> {
    data: SpatializedInputData;
    inputsModule: Inputs.NodeAudioInputManager;
    constructor(data: SpatializedInputData, inputsModule: Inputs.NodeAudioInputManager);
    set(val: SpatializedInputData): Promise<void>;
    get(): SpatializedInputData;
    findSourceType(): PortTypes.Any | PortTypes;
    findSourceChannel(): number;
    params(): SourceParameterSet;
    isInRoom(): number;
}
declare class UserList extends ManagedNodeStateListRegister {
    _man: NodeUsersManager;
    constructor(manager: NodeUsersManager);
    remove(obj: ManagedNodeStateObject<any>): Promise<void>;
    insert(obj: any): Promise<User>;
}
declare class SpatializedInputsList extends ManagedNodeStateListRegister {
    inputsManager: Inputs.NodeAudioInputManager;
    constructor(inputsModule: Inputs.NodeAudioInputManager);
    remove(obj: ManagedNodeStateObject<any>): Promise<void>;
    insert(data: any): Promise<SpatializedInput>;
}
export declare class NodeUsersManager extends NodeModule {
    _users: UserList;
    _inputs: SpatializedInputsList;
    _inputs_module: Inputs.NodeAudioInputManager;
    constructor(inputsModule: Inputs.NodeAudioInputManager);
    addUser(userdata: UserData): void;
    modifyUser(userdata: UserData): void;
    removeUser(userid: string): void;
    addInputToUser(userid: string, input: Inputs.NodeAudioInput): void;
    removeInputFromUser(userid: string, input: SpatializedInputData): void;
    modifyUserInput(userid: string, input: SpatializedInputData, recompile?: boolean): void;
    joined(socket: SocketIO.Socket, topic: string): void;
    left(socket: SocketIO.Socket, topic: string): void;
    init(): void;
    updateWebInterfaces(): void;
    publishUserInputs(userid: string): void;
    listRawUsersData(): UserData[];
    listUsers(): User[];
    findInputById(id: string): SpatializedInput;
    findUserInput(userid: string, inputid: string): SpatializedInput;
    findUserForId(id: string): User;
    start(remote: Connection): void;
    destroy(): void;
    getUsersInputs(userid: string): SpatializedInput[];
}
export declare class UsersManager extends ServerModule {
    validate_userdata: ValidateFunction;
    constructor();
    joined(socket: SocketIO.Socket, topic: string): void;
    left(socket: SocketIO.Socket, topic: string): void;
    _publish_userinput_list(node: DSPNode, userid: string): void;
    _join_userspecific(socket: SocketIO.Socket, userid: string, topic: string): void;
    _join_userinputs(socket: SocketIO.Socket, userid: string): import("winston").Logger;
    findNodeForUser(userid: string): DSPNode;
    init(): void;
}
export {};
