export interface SpatializedInputData {
    id: string;
    inputid: string;
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
export declare function basicUserData(name: string, channel: number): UserData;
