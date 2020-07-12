export declare class UserData {
    name: string;
    id: string;
    channel: number;
    headtracker: number;
    source_ids: string[];
}
export declare function basicUserData(name: string, channel: number): UserData;
