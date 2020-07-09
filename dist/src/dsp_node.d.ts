import { Node } from './data';
import { NodeIdentification } from './communication';
import { NodeAudioInputManager } from './inputs';
import { DSPController } from './dsp_process';
import { Graph } from './dsp';
import { VSTScanner } from './vst';
import { NodeAudioDevices } from './audio_devices';
export declare class DSPNode extends Node {
    init(): void;
    start(): void;
    destroy(): void;
    inputs: NodeAudioInputManager;
    vst: VSTScanner;
    dsp_graph: Graph;
    dsp_process: DSPController;
    audio_devices: NodeAudioDevices;
    constructor(id: NodeIdentification);
}
