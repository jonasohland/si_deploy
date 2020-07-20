import { Node } from './core';
import { NodeIdentification } from './communication';
import { NodeAudioInputManager } from './inputs';
import { DSPController } from './dsp_process';
import { Graph } from './dsp';
import { VSTScanner } from './vst';
import { NodeAudioDevices } from './audio_devices';
import { NodeUsersManager } from './users';
import { NodeRooms } from './rooms';
export declare class DSPNode extends Node {
    init(): void;
    start(): void;
    destroy(): void;
    inputs: NodeAudioInputManager;
    users: NodeUsersManager;
    rooms: NodeRooms;
    vst: VSTScanner;
    dsp_graph: Graph;
    dsp_process: DSPController;
    audio_devices: NodeAudioDevices;
    constructor(id: NodeIdentification);
}
