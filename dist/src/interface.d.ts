import { Channel } from "./audio_devices";
import { SourceParameterSet } from "./sources";
import { Input } from "./inputs";
export declare enum InstanceTransportState {
    RUNNING = 0,
    STOPPED = 1
}
export interface InstanceInfo {
    name: string;
    id: string;
}
export interface InstanceState {
    info: InstanceInfo;
    dspuse: number;
    tc: string;
    transport_state: InstanceTransportState;
}
export interface SpatialSoundSource {
    params: SourceParameterSet;
    input: Input;
}
export interface User {
    name: string;
    id: string;
    output_channels: [Channel, Channel];
}
