import { User } from "./interface";
import { v4 as uniqueId } from 'uuid';

export interface SpatializedInputData {
    id: string,
    inputid: string,
    room: string,
    azm: number,
    elv:  number,
    height?: number,
    width?: number,
}

export interface UserData {
    name: string;
    id: string;
    channel: number;
    headtracker: number;
    room: string;
    inputs: string[];
}

export function basicUserData(name: string, channel: number): UserData {
    return {
        name,
        channel,
        id: uniqueId(),
        headtracker: -1,
        inputs: [],
        room: null,
    }
}