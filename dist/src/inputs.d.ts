/// <reference types="socket.io" />
import { AudioDeviceManager, Channel } from './audio_devices';
import { ManagedNodeStateMapRegister, ManagedNodeStateObject, ManagedNodeStateObjectData, NodeModule } from './data';
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
    devices: AudioDeviceManager;
    webif: WebInterface;
    constructor(webif: WebInterface, audioDevMan: AudioDeviceManager, sfm: ShowfileManager);
    updateInterface(sock: SocketIO.Socket | SocketIO.Server): Promise<void>;
    addInput(input: any): Promise<void>;
}
export interface NodeAudioInputDescription {
    name: string;
    channel: number;
}
export declare class NodeAudioInput extends ManagedNodeStateObject<NodeAudioInputDescription> {
    _description: NodeAudioInputDescription;
    set(val: NodeAudioInputDescription): Promise<void>;
    get(): Promise<NodeAudioInputDescription>;
    constructor(name: string, channel: number);
}
export declare class NodeAudioInputList extends ManagedNodeStateMapRegister {
    remove(name: string, obj: ManagedNodeStateObject<NodeAudioInputDescription>): Promise<void>;
    insert(name: string, obj: ManagedNodeStateObjectData): Promise<NodeAudioInput>;
    constructor();
}
export declare class NodeAudioInputManager extends NodeModule {
    destroy(): void;
    init(): void;
    start(): void;
    _input_list: NodeAudioInputList;
    constructor();
}
export {};
