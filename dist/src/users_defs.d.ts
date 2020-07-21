import { NodeAudioInputDescription } from "./inputs_defs";
export interface SpatializedInputData {
    id: string;
    inputid: string;
    userid: string;
    room: string;
    azm: number;
    elv: number;
    height?: number;
    width?: number;
}
export interface UserData {
    name: string;
    id: string;
    channel: number;
    headtracker: number;
    room: string;
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
export declare function basicSpatializedInput(inputid: string, userid: string): SpatializedInputData;
export declare function basicUserData(name: string, channel: number): UserData;
