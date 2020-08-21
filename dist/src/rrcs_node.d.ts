/// <reference types="socket.io" />
import { ValidateFunction } from 'ajv';
import { Connection, NodeIdentification, Requester } from './communication';
import { ManagedNodeStateMapRegister, ManagedNodeStateObject, Node, NodeModule, ServerModule } from './core';
import { ArtistState } from './rrcs';
import { CrosspointSync, CrosspointVolumeTarget } from './rrcs_defs';
declare class Sync extends ManagedNodeStateObject<CrosspointSync> {
    data: CrosspointSync;
    constructor(sync: CrosspointSync);
    addSlaves(slvs: CrosspointVolumeTarget[]): void;
    setState(state: boolean): void;
    set(val: any): Promise<void>;
    get(): CrosspointSync;
}
declare class SyncList extends ManagedNodeStateMapRegister {
    remove(name: string, obj: ManagedNodeStateObject<any>): Promise<void>;
    insert(name: string, obj: any): Promise<Sync>;
    allSyncs(): CrosspointSync[];
    getSyncForMaster(sync: CrosspointSync | string): ManagedNodeStateObject<any>;
}
declare class RRCSNodeModule extends NodeModule {
    rrcs: Requester;
    syncs: SyncList;
    _xpstates: Record<string, boolean>;
    _cached: ArtistState;
    constructor();
    init(): void;
    addXpSync(sync: CrosspointSync): void;
    start(remote: Connection): void;
    joined(socket: SocketIO.Socket, topic: string): void;
    left(socket: SocketIO.Socket, topic: string): void;
    destroy(): void;
    _artist_online(): void;
    _artist_offline(): void;
    _gateway_online(): void;
    _gateway_offline(): void;
    _config_changed(): void;
    _xp_states_changed(msg: any): void;
    _reload_artist_state(): void;
    _set_sync_list(): void;
    _webif_update_sync_list(): void;
    _webif_update_connection(): void;
}
export declare class RRCSServerModule extends ServerModule {
    xpsync_validator: ValidateFunction;
    constructor();
    init(): void;
    joined(socket: SocketIO.Socket, topic: string): void;
    left(socket: SocketIO.Socket, topic: string): void;
}
export declare class RRCSNode extends Node {
    rrcs: RRCSNodeModule;
    constructor(id: NodeIdentification);
    init(): void;
    start(): void;
    destroy(): void;
}
export {};
