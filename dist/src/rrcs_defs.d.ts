export interface Port {
    Node: number;
    Port: number;
    IsInput: boolean;
}
export interface Crosspoint {
    Source: Port;
    Destination: Port;
}
export interface CrosspointState {
    xp: Crosspoint;
    state: boolean;
}
export interface CrosspointVolumeSource {
    range?: Crosspoint;
    xp: Crosspoint;
    conf: boolean;
}
export interface CrosspointVolumeSourceState {
    xpid: string;
    state: boolean;
}
export interface CrosspointVolumeTarget {
    xp: Crosspoint;
    conf: boolean;
    single: boolean;
    set: boolean;
}
export interface AddCrosspointVolumeTargetMessage {
    masterid: string;
    slave: CrosspointVolumeTarget;
}
export interface XPSyncModifySlavesMessage {
    master: string;
    slaves: CrosspointVolumeTarget[];
}
export declare enum CrosspointSyncType {
    SINGLE = 0,
    WILDCARD_SRC = 1,
    WILDCARD_DST = 2
}
export interface CrosspointSync {
    state: boolean;
    vol: number;
    type: CrosspointSyncType;
    master: CrosspointVolumeSource;
    slaves: CrosspointVolumeTarget[];
    exclude: Crosspoint[];
}
export declare function makeSingleVolumeTarget(xp: Crosspoint): CrosspointVolumeTarget;
export declare function makeConferenceVolumeTarget(xp: Crosspoint): CrosspointVolumeTarget;
export declare function makeXPSetterTarget(xp: Crosspoint, single?: boolean, conf?: boolean): CrosspointVolumeTarget;
export declare function makeXPVolumeSource(xp: Crosspoint, conf: boolean): CrosspointVolumeSource;
export declare function makeXPSync(master: CrosspointVolumeSource): CrosspointSync;
export declare function isLoopbackXP(xp: Crosspoint): boolean;
export declare function getLoopbackXPForWildcard(xp: Crosspoint): Crosspoint;
export declare function portEqual(lhs: Port, rhs: Port): boolean;
export declare function xpEqual(lhs: Crosspoint, rhs: Crosspoint): boolean;
export declare function xpVtEqual(lhs: CrosspointVolumeTarget, rhs: CrosspointVolumeTarget): boolean;
export declare function __xpid(xp: Crosspoint): string;
export declare function xpvtid(xp_vt: CrosspointVolumeSource): string;
export declare function makeWildcardPort(): Port;
export declare function isWildcardPort(port: Port): boolean;
export declare function isWildcardXP(xp: Crosspoint): boolean;
export declare function destinationPortIsWildcard(xp: Crosspoint): boolean;
export declare function sourcePortIsWildcard(xp: Crosspoint): boolean;
export declare function withSourceAsSourceWildcard(xp: Crosspoint): Crosspoint;
export declare function withSourceAsDestinationWildcard(xp: Crosspoint): Crosspoint;
export declare function withDestinationeAsSourceWildcard(xp: Crosspoint): Crosspoint;
export declare function withDestinationAsDestinationWildcard(xp: Crosspoint): Crosspoint;
