export interface RoomData {
    letter: string;
    enabled: boolean;
    reflections: number;
    room: {
        size: number;
        depth: number;
        height: number;
        width: number;
    };
    attn: {
        front: number;
        back: number;
        left: number;
        right: number;
        ceiling: number;
        floor: number;
    };
    eq: {
        high: {
            freq: number;
            gain: number;
        };
        low: {
            freq: number;
            gain: number;
        };
    };
}
export declare function defaultRoom(letter: string): RoomData;
