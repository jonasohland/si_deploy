import { User } from "./interface";
import { v4 as uniqueId } from 'uuid';

export class UserData {
    name: string;
    id: string;
    channel: number;
    headtracker: number;
    room: string;
    input_ids: string[];
}

export function basicUserData(name: string, channel: number): UserData {
    return {
        name,
        channel,
        id: uniqueId(),
        headtracker: -1,
        input_ids: [],
        room: null,
    }
}