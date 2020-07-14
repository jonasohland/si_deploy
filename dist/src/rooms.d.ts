/// <reference types="socket.io" />
import { ServerModule, NodeModule, ManagedNodeStateObject, ManagedNodeStateMapRegister } from "./data";
import { Connection } from "./communication";
import { RoomData } from './rooms_defs';
export declare class Room extends ManagedNodeStateObject<RoomData> {
    _letter: string;
    _data: RoomData;
    constructor(letter: string, data: any);
    set(val: RoomData): Promise<void>;
    get(): RoomData;
}
export declare class NodeRoomsList extends ManagedNodeStateMapRegister {
    constructor();
    remove(name: string, obj: ManagedNodeStateObject<any>): Promise<void>;
    insert(name: string, obj: any): Promise<ManagedNodeStateObject<any>>;
}
export declare class NodeRooms extends NodeModule {
    _rooms: NodeRoomsList;
    init(): void;
    start(remote: Connection): void;
    destroy(): void;
    joined(socket: SocketIO.Socket, topic: string): void;
    left(socket: SocketIO.Socket, topic: string): void;
    listrooms(): any[];
    updateRoom(data: RoomData): void;
    constructor();
}
export declare class Rooms extends ServerModule {
    init(): void;
    joined(socket: SocketIO.Socket, topic: string): void;
    left(socket: SocketIO.Socket, topic: string): void;
    constructor();
}
