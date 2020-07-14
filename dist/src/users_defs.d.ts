export declare class UserData {
    name: string;
    id: string;
    channel: number;
    headtracker: number;
    room: string;
    input_ids: string[];
}
export declare function basicUserData(name: string, channel: number): UserData;
