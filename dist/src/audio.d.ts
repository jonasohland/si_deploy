import { Requester, Connection } from './communication';
export declare class DSPHost {
    remote: Requester;
    constructor(con: Connection);
    enable(): Promise<import("./communication").Message>;
    disable(): Promise<import("./communication").Message>;
}
