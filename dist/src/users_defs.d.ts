import { NodeAudioInputDescription } from "./inputs_defs";
import { PortTypes } from './dsp_defs';
import { Port } from './rrcs_defs';
export interface SpatializedInputData {
    id: string;
    inputid: string;
    userid: string;
    room?: string;
    azm: number;
    elv: number;
    gain: number;
    height?: number;
    width?: number;
}
export interface XTCSettings {
    accuracy: number;
    enabled_st: boolean;
    enabled_bin: boolean;
    dist_spk: number;
    dist_ears: number;
    dist_listener: number;
}
export interface UserData {
    name: string;
    id: string;
    channel: number;
    headtracker: number;
    room?: string;
    xtc: XTCSettings;
    artist: ArtistSyncSettings;
    inputs: string[];
}
export interface UserAddInputsMessage {
    userid: string;
    inputs: NodeAudioInputDescription[];
}
export interface UserDeleteInputMessage {
    userid: string;
    input: SpatializedInputData;
}
export interface UserModifyInputMessage {
    userid: string;
    recompile: boolean;
    input: SpatializedInputData;
}
export interface UserPanInputMessage {
    userid: string;
    spid: string;
    value: number;
}
export interface UserAssignHeadtrackerMessage {
    userid: string;
    headtrackerid: number;
}
export interface UserInputGainChangeMessage {
    gain: number;
    id: string;
    user: string;
}
export interface UserModifyXTCMessage {
    xtc: XTCSettings;
    user: string;
}
export interface ManagedPort {
    port: Port;
    input: SpatializedInputData;
}
export interface ArtistSyncSettings {
    settings: {
        node: number;
        first_port: number;
        last_port: number;
        first_device_channel: number;
    };
    user_panel: Port;
}
export declare function basicArtistSyncSettings(panel?: Port): ArtistSyncSettings;
export declare function basicSpatializedInput(inputid: string, userid: string, type: PortTypes): SpatializedInputData;
export declare function basicXTCData(): {
    enabled_bin: boolean;
    enabled_st: boolean;
    accuracy: number;
    dist_spk: number;
    dist_ears: number;
    dist_listener: number;
};
export declare function basicUserData(name: string, channel: number, panel?: Port): UserData;
