/// <reference types="socket.io" />
import { AudioDeviceManager, Channel } from './audio_devices';
import * as DSP from './dsp';
import { SpatialIntercomInstance } from './instance';
interface NodeAndInputs {
    max_id: 0;
    si: SpatialIntercomInstance;
    inputs: Input[];
}
export declare class Input {
    id: number;
    name: string;
    format: DSP.PortTypes;
    channels: Channel[];
}
export declare class InputManager {
    nodes: NodeAndInputs[];
    devices: AudioDeviceManager;
    server: SocketIO.Server;
    constructor(io: SocketIO.Server, audioDevMan: AudioDeviceManager);
    updateInterface(sock: SocketIO.Socket | SocketIO.Server): Promise<void>;
    addInput(input: any): Promise<void>;
}
export {};
