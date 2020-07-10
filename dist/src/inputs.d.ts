/// <reference types="socket.io" />
import { Channel } from './audio_devices';
import { ManagedNodeStateListRegister, ManagedNodeStateObject, NodeModule, ServerModule } from './data';
import * as DSP from './dsp';
import { SIDSPNode } from './instance';
import { ShowfileManager, ShowfileRecord, ShowfileTarget } from './showfiles';
import WebInterface from './web_interface';
interface NodeAndInputs {
    max_id: 0;
    si: SIDSPNode;
    inputs: Input[];
}
export declare class Input extends ShowfileRecord {
    constructor(id: number, name: string, format: DSP.PortTypes);
    plain(): Promise<{
        id: number;
        name: DSP.PortTypes;
        format: DSP.PortTypes;
        channels: {
            i: number;
            name: string;
        }[];
    }>;
    restore(data: any): void;
    build(data: any): void;
    id: number;
    name: string;
    format: DSP.PortTypes;
    channels: Channel[];
}
export declare class InputManager extends ShowfileTarget {
    targetName(): string;
    onEmptyShowfileCreate(s: import('./showfiles').Showfile): void;
    nodes: NodeAndInputs[];
    webif: WebInterface;
    constructor(webif: WebInterface, audioDevMan: any, sfm: ShowfileManager);
    updateInterface(sock: SocketIO.Socket | SocketIO.Server): Promise<void>;
    addInput(input: any): Promise<void>;
}
export interface NodeAudioInputDescription {
    name: string;
    channel: number;
    type: DSP.PortTypes;
    id: string;
    default_roomencode: boolean;
    default_encodingorder: number;
    default_gain: number;
}
export declare function basicNodeAudioInputDescription(name: string, channel: number, type: DSP.PortTypes): NodeAudioInputDescription;
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
    _input_list: NodeAudioInputList;
    constructor();
}
export declare class AudioInputsManager extends ServerModule {
    init(): void;
    constructor();
}
export {};
