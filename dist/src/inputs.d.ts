/// <reference types="socket.io" />
import { ManagedNodeStateListRegister, ManagedNodeStateObject, NodeModule, ServerModule } from './core';
import { DSPNode } from './dsp_node';
import { NodeAudioInputDescription } from './inputs_defs';
export declare class NodeAudioInput extends ManagedNodeStateObject<NodeAudioInputDescription> {
    _description: NodeAudioInputDescription;
    set(val: NodeAudioInputDescription): Promise<void>;
    get(): NodeAudioInputDescription;
    constructor(desc: NodeAudioInputDescription);
}
export declare class NodeAudioInputList extends ManagedNodeStateListRegister {
    remove(obj: ManagedNodeStateObject<NodeAudioInputDescription>): Promise<void>;
    insert(data: NodeAudioInputDescription): Promise<NodeAudioInput>;
}
export declare class NodeAudioInputManager extends NodeModule {
    addInput(input: NodeAudioInputDescription): Promise<import("./communication").Message>;
    removeInput(id: string): Promise<import("./communication").Message>;
    getRawInputDescriptionList(): NodeAudioInputDescription[];
    findInputForId(id: string): NodeAudioInput;
    destroy(): void;
    init(): void;
    start(): void;
    joined(socket: SocketIO.Socket, topic: string): void;
    left(socket: SocketIO.Socket, topic: string): void;
    _input_list: NodeAudioInputList;
    constructor();
}
export declare class AudioInputsManager extends ServerModule {
    joined(socket: SocketIO.Socket, topic: string): void;
    left(socket: SocketIO.Socket, topic: string): void;
    broadcastUpdate(node: DSPNode): void;
    init(): void;
    constructor();
}
