/// <reference types="socket.io" />
import { AudioDeviceManager, Channel } from './audio_devices';
import * as DSP from './dsp';
import { SpatialIntercomInstance } from './instance';
import { ShowfileRecord } from './showfiles';
interface NodeAndInputs {
    max_id: 0;
    si: SpatialIntercomInstance;
    inputs: Input[];
}
export declare class Input extends ShowfileRecord {
    plain(): {};
    restore(data: any): void;
    save(): void;
    build(data: any): void;
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
