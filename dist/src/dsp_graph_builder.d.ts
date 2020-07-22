/// <reference types="socket.io" />
import { NodeModule, ServerModule } from "./core";
import { Connection } from "./communication";
import { AdvancedSpatializerModule, MulitSpatializerModule, SimpleUsersModule } from "./dsp_modules";
import { NodeUsersManager } from "./users";
import { NodeAudioInputManager } from "./inputs";
import { DSPController } from "./dsp_process";
export declare const GraphBuilderInputEvents: {
    FULL_REBUILD: string;
    REBUILD: string;
};
export declare const GraphBuilderOutputEvents: {};
export declare class NodeDSPGraphBuilder extends NodeModule {
    user_modules: Record<string, SimpleUsersModule>;
    basic_spatializers: Record<string, Record<string, MulitSpatializerModule>>;
    room_spatializers: Record<string, Record<string, AdvancedSpatializerModule>>;
    constructor();
    destroy(): void;
    joined(socket: SocketIO.Socket, topic: string): void;
    left(socket: SocketIO.Socket, topic: string): void;
    init(): void;
    start(connection: Connection): void;
    _do_rebuild_graph_full(): void;
    _build_spatializer_modules(): void;
    _build_user_modules(): void;
    nodeUsers(): NodeUsersManager;
    nodeInputs(): NodeAudioInputManager;
    dsp(): DSPController;
    graph(): import("./dsp_graph").Graph;
}
export declare class DSPGraphController extends ServerModule {
    constructor();
    init(): void;
    joined(socket: SocketIO.Socket, topic: string): void;
    left(socket: SocketIO.Socket, topic: string): void;
}
