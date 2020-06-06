import * as IPC from './ipc';
export declare class DSPHost {
    remote: IPC.Requester;
    constructor(con: IPC.Connection);
    enable(): Promise<IPC.Message>;
    disable(): Promise<IPC.Message>;
}
