import { AudioDevices } from './audio_devices';
import { NodeIdentification } from './communication';
import { AudioInputsManager } from './inputs';
import { SIDSPNode } from './instance';
import WebInterface from './web_interface';
import { Server, Node } from './data';
import { UsersManager } from './users';
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
    constructor(config: any);
}
