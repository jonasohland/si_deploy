/// <reference types="node" />
import { EventEmitter2 } from 'eventemitter2';
import xmlrpc from 'xmlrpc';
import { Crosspoint, CrosspointState, CrosspointSync, CrosspointVolumeSource, CrosspointVolumeSourceState, CrosspointVolumeTarget, Port, XPSyncModifySlavesMessage } from './rrcs_defs';
export interface ArtistPortInfo {
    Input: boolean;
    KeyCount: number;
    Label: string;
    Name: string;
    Node: number;
    ObjectID: number;
    Output: boolean;
    PageCount: number;
    Port: number;
    PortType: string;
    Subtitle?: string;
    Alias?: string;
    HasSecondChannel?: boolean;
}
export interface ArtistState {
    gateway: boolean;
    artist: boolean;
    artist_nodes: ArtistNodeInfo[];
}
export interface ArtistNodeInfo {
    id: number;
    ports: ArtistPortInfo[];
}
declare class ArtistNodePort {
    info: ArtistPortInfo;
    _srv: RRCSServer;
    constructor(srv: RRCSServer, info: ArtistPortInfo);
    destroy(): void;
}
declare class ArtistNode {
    _id: number;
    _ports: ArtistNodePort[];
    _srv: RRCSServer;
    constructor(srv: RRCSServer, id: number);
    getPort(portidx: number, input: boolean, output: boolean): ArtistNodePort;
    getPortFromInfo(info: ArtistPortInfo): ArtistNodePort;
    removePort(portidx: number, input: boolean, output: boolean): ArtistNodePort[];
    addPort(info: ArtistPortInfo): void;
    reset(): void;
    destroy(): void;
    nodeID(): number;
}
export declare abstract class RRCSServer extends EventEmitter2 {
    _cl: xmlrpc.Client;
    _srv: xmlrpc.Server;
    _artist_online: boolean;
    _gateway_online: boolean;
    _local_port: number;
    _local_ip: string;
    _trs_cnt: number;
    _connect_retry_timeout: NodeJS.Timeout;
    _nodes: ArtistNode[];
    _options: any;
    abstract onArtistConfigurationChanged(): void;
    abstract onXpValueChanged(crosspoint: Crosspoint, single?: number, conf?: number): void;
    abstract onXpsChanged(xps: CrosspointState[]): void;
    abstract xpsToListenTo(): Crosspoint[];
    abstract onArtistOnline(): Promise<void>;
    constructor(options: any);
    rrcsAvailable(): void;
    getArtistNode(id: number): ArtistNode;
    getAllNodes(): ArtistNodeInfo[];
    getArtistState(): ArtistState;
    getObjectPropertyNames(objectid: number): Promise<unknown>;
    getObjectProperty(id: number, name: string): Promise<unknown>;
    getPortAlias(port: Port): Promise<unknown>;
    getGatewayState(): Promise<unknown>;
    setStateWorking(): Promise<unknown>;
    setStateStandby(): Promise<unknown>;
    getAlive(): Promise<unknown>;
    getArtistConnected(): Promise<boolean>;
    setXPVolume(xp: Crosspoint, volume: number, single?: boolean, conf?: boolean): Promise<void>;
    getXpStatus(xp: Crosspoint): Promise<boolean>;
    getActiveXps(): Promise<Crosspoint[]>;
    getXpsInRange(xp: Crosspoint): Promise<Crosspoint[]>;
    setXP(xp: Crosspoint): Promise<unknown>;
    killXP(xp: Crosspoint): Promise<unknown>;
    _perform_method_call(method: string, ...params: any[]): Promise<unknown>;
    private _modify_notifications;
    private _setup_notifications;
    resetXPVolNotifyRegistry(): Promise<unknown>;
    addToXPVolNotifyRegistry(xps: Crosspoint[]): Promise<unknown>;
    removeFromXPVolNotifyRegistry(xps: Crosspoint[]): Promise<unknown>;
    private _gateway_went_online;
    private _gateway_went_offline;
    private _artist_went_online;
    private _artist_went_offline;
    private _begin_connect;
    private _ping_artist;
    private _reset;
    private _refresh_nodes;
    private _load_cached;
    private _is_trs_key;
    private _get_trs_key;
}
export declare class RRCSService extends RRCSServer {
    _synced_ex: Record<string, CrosspointSync>;
    _synced: Record<string, CrosspointSync>;
    xpsToListenTo(): Crosspoint[];
    setXPSyncs(syncs: CrosspointSync[]): void;
    xpSyncAddSlaves(msg: XPSyncModifySlavesMessage): Promise<void>;
    xpSyncRemoveSlaves(msg: XPSyncModifySlavesMessage): Promise<void>;
    newXPSync(master: CrosspointVolumeSource, slaves: CrosspointVolumeTarget[], excluded?: Crosspoint[]): void;
    addXPSync(master: CrosspointVolumeSource, slaves: CrosspointVolumeTarget[]): void;
    removeXPSync(id: string): Promise<void>;
    getAllXPStates(): void;
    updateStateForCrosspointSync(sync: CrosspointSync): Promise<void>;
    updateStateForWildcardSync(sync: CrosspointSync): Promise<void>;
    updateCrosspoint(xpv: CrosspointVolumeTarget, vol: number): void;
    onArtistOnline(): Promise<void>;
    onArtistConfigurationChanged(): void;
    onXpValueChanged(crosspoint: Crosspoint, single: number, conf: number): void;
    onXpsChanged(xps: CrosspointState[]): Promise<void>;
    trySyncCrosspointForMaster(masterid: string, xpstate: CrosspointState, updated: CrosspointVolumeSourceState[]): void;
    trySyncCrosspointForWildcardMaster(masterid: string, xpstate: CrosspointState, updated: CrosspointVolumeSourceState[]): Promise<void>;
    syncCrosspointsForMaster(sync: CrosspointSync, state: boolean): Promise<void>;
    syncCrosspointsForWildcardMaster(sync: CrosspointSync, newstate: boolean): Promise<boolean>;
    refreshAllXPs(): Promise<void>;
    private _do_update_xp;
    private _find_volume_master;
    private _clear_all_xpstates;
    private _set_sync_state_on;
    private _try_set_xp;
    private _try_kill_xp;
}
export {};
