import { AudioDevices } from './audio_devices';
import { NodeIdentification } from './communication';
import { Headtracking } from './headtracking';
import { AudioInputsManager } from './inputs';
import { SIDSPNode } from './instance';
import WebInterface from './web_interface';
import { Server, Node } from './core';
import { UsersManager } from './users';
import { Rooms } from './rooms';
import { DSPGraphController } from './dsp_graph_builder';
export interface SocketAndInstance {
    instance: SIDSPNode;
}
export declare class SpatialIntercomServer extends Server {
    createNode(id: NodeIdentification): Node;
    destroyNode(node: Node): void;
    webif: WebInterface;
    audio_devices: AudioDevices;
    inputs: AudioInputsManager;
    users: UsersManager;
    rooms: Rooms;
    headtracking: Headtracking;
    graphcontroller: DSPGraphController;
    constructor(config: any);
}
