import { Node } from './core';
import { NodeIdentification } from './communication';
import { NodeAudioInputManager } from './inputs';
import { DSPController } from './dsp_process';
import { Graph } from './dsp_graph';
import { VSTScanner } from './vst';
import { NodeAudioDevices } from './audio_devices';
import { NodeUsersManager } from './users';
import { NodeRooms } from './rooms';
import { NodeDSPGraphBuilder } from './dsp_graph_builder';
import WebInterface from './web_interface';
export declare const DSPModuleNames: {
    INPUTS: string;
    USERS: string;
    ROOMS: string;
    DSP_PROCESS: string;
    VST_SCANNER: string;
    AUDIO_DEVICES: string;
    GRAPH_BUILDER: string;
};
export declare class DSPNode extends Node {
    init(): void;
    start(): void;
    destroy(): void;
    inputs: NodeAudioInputManager;
    users: NodeUsersManager;
    rooms: NodeRooms;
    vst: VSTScanner;
    dsp_graph: Graph;
    dsp_graph_builder: NodeDSPGraphBuilder;
    dsp_process: DSPController;
    audio_devices: NodeAudioDevices;
    constructor(id: NodeIdentification, webif: WebInterface);
}
