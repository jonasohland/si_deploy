import { ServerModule, NodeModule, ManagedNodeStateListRegister, ManagedNodeStateObject, ManagedNodeStateMapRegister } from "./core";
import { Connection } from "./communication";
import { defaultRoom, RoomData } from './rooms_defs';
import * as Logger from './log';
import { DSPNode } from "./dsp_node";
import { KeyWithValue } from "./web_interface_defs";

const log = Logger.get('NROOMS');



export class Room extends ManagedNodeStateObject<RoomData> {

    _letter: string;
    _data: RoomData;

    constructor(letter: string, data: any)
    {
        super();
        this._letter = letter;
        this._data = data;
    }

    async set(val: RoomData): Promise<void> {
        this._data = val;
    }

    get(): RoomData {
        return this._data;
    }

}

export class NodeRoomsList extends ManagedNodeStateMapRegister {

    constructor()
    {
        super();
    }

    async remove(name: string, obj: ManagedNodeStateObject<any>) {

    }

    async insert(name: string, obj: any): Promise<ManagedNodeStateObject<any>> {
        return new Room(name, obj);
    }
    
}

export class NodeRooms extends NodeModule {

    _rooms: NodeRoomsList;

    init(): void {
        this._rooms.add('A', new Room('A', defaultRoom('A')));
        this._rooms.add('B', new Room('B', defaultRoom('B')));
        this._rooms.add('C', new Room('C', defaultRoom('C')));
        this._rooms.add('D', new Room('D', defaultRoom('D')));
        this._rooms.add('E', new Room('E', defaultRoom('E')));
    }

    start(remote: Connection): void {
        this.save().catch(err => {
            log.error('Could not write data to node ' + err);
        });
    }

    destroy(): void {
    }
    
    joined(socket: SocketIO.Socket, topic: string) {
        if(topic == 'rooms')
            socket.emit('node.rooms', this.listrooms());
    }

    left(socket: SocketIO.Socket, topic: string) {
        ; // we dont care
    }

    listrooms()
    {
        return this._rooms._object_iter().map(obj => obj.get())
    }

    updateRoom(data: RoomData)
    {
        if(this._rooms._objects[data.letter]){
            this._rooms._objects[data.letter].set(data);
            this._rooms._objects[data.letter].save();
            this.publish('rooms', 'node.rooms', this.listrooms());
        }
    }

    constructor()
    {
        super('rooms');
        this._rooms = new NodeRoomsList();
        this.add(this._rooms, 'rooms');
    }
}

export class Rooms extends ServerModule {

    init(): void {

        this.handle('reset', (socket: SocketIO.Socket, node: DSPNode, room: string) => {

        });

        this.handle('modify', (socket: SocketIO.Socket, node: DSPNode, data: RoomData) => {
            node.rooms.updateRoom(data);
        });

        this.handle('set-main', (socket: SocketIO.Socket, node: DSPNode, data: KeyWithValue) => {
            console.log(`SET [main] [${data.key}] ${data.value}`);
        });

        this.handle('set-attn', (socket: SocketIO.Socket, node: DSPNode, data: KeyWithValue) => {
            console.log(`SET [attn] [${data.key}] ${data.value}`);
        });

        this.handle('set-room', (socket: SocketIO.Socket, node: DSPNode, data: KeyWithValue) => {
            console.log(`SET [room] [${data.key}] ${data.value}`);
        });

        this.handle('set-eq', (socket: SocketIO.Socket, node: DSPNode, data: KeyWithValue) => {
            console.log(`SET [eq] [${data.key}] ${data.value}`);
        });
    }

    joined(socket: SocketIO.Socket, topic: string) {
    }
    
    left(socket: SocketIO.Socket, topic: string) {
    }

    constructor()
    {
        super('rooms');
    }
}