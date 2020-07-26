/// <reference types="socket.io" />
import { NodeModule, ServerModule } from "./core";
import { Connection } from "./communication";
import { MulitSpatializerModule, SimpleUsersModule, RoomSpatializerModule } from "./dsp_modules";
import { NodeUsersManager } from "./users";
import { NodeAudioInputManager } from "./inputs";
import { DSPController } from "./dsp_process";
import { SourceParameterSet } from "./dsp_defs";
import { NodeRooms } from "./rooms";
import { RoomData } from "./rooms_defs";
export declare const GraphBuilderInputEvents: {
    FULL_REBUILD: string;
    REBUILD: string;
    PAN: string;
    AZM: string;
    ELV: string;
    ROOM_ENABLED: string;
    ROOM_REFLECTIONS: string;
    ROOM_SHAPE: string;
    ROOM_ATTN: string;
    ROOM_HIGHSHELF: string;
    ROOM_LOWSHELF: string;
    ASSIGN_HEADTRACKER: string;
};
export declare const GraphBuilderOutputEvents: {};
export declare class NodeDSPGraphBuilder extends NodeModule {
    user_modules: Record<string, SimpleUsersModule>;
    basic_spatializers: Record<string, Record<string, MulitSpatializerModule>>;
    room_spatializers: Record<string, Record<string, RoomSpatializerModule>>;
    constructor();
    destroy(): void;
    joined(socket: SocketIO.Socket, topic: string): void;
    left(socket: SocketIO.Socket, topic: string): void;
    init(): void;
    start(connection: Connection): void;
    _do_rebuild_graph_full(): void;
    _build_spatializer_modules(): void;
    _dispatch_azimuth_pan(userid: string, spid: string, azm: number): void;
    _dispatch_elevation_pan(userid: string, spid: string, elv: number): void;
    _dispatch_pan(userid: string, spid: string, params: SourceParameterSet): void;
    _dispatch_room_enabled(roomid: string, room: RoomData): void;
    _dispatch_room_reflections(roomid: string, room: RoomData): void;
    _dispatch_room_attn(roomid: string, room: RoomData): void;
    _dispatch_room_shape(roomid: string, room: RoomData): void;
    _dispatch_room_highshelf(roomid: string, room: RoomData): void;
    _dispatch_room_lowshelf(roomid: string, room: RoomData): void;
    _dispatch_assign_headtracker(userid: string, headtrackerid: number): void;
    _build_user_modules(): void;
    _find_spatializer(userid: string, spid: string): MulitSpatializerModule | RoomSpatializerModule;
    _find_spatializers_for_room(room: string): RoomSpatializerModule[];
    getRooms(): NodeRooms;
    nodeUsers(): NodeUsersManager;
    nodeInputs(): NodeAudioInputManager;
    headtrackers(): import("./headtracking").Headtracking;
    dsp(): DSPController;
    graph(): import("./dsp_graph").Graph;
}
export declare class DSPGraphController extends ServerModule {
    constructor();
    init(): void;
    joined(socket: SocketIO.Socket, topic: string): void;
    left(socket: SocketIO.Socket, topic: string): void;
}