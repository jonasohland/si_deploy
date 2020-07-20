/// <reference types="socket.io" />
import { Requester, Connection } from './communication';
import { NodeModule } from './core';
export interface PluginDescription {
    category: string;
    display_name: string;
    manufacturer: string;
    name: string;
    platform_id: string;
    version: string;
}
export declare class VSTScanner extends NodeModule {
    destroy(): void;
    init(): void;
    start(remote: Connection): void;
    knownPlugins: PluginDescription[];
    requester: Requester;
    constructor();
    joined(socket: SocketIO.Socket, topic: string): void;
    left(socket: SocketIO.Socket, topic: string): void;
    waitPluginsScanned(): Promise<boolean>;
    isPluginInList(name: string): boolean;
    findPlugin(name: string): PluginDescription;
}
