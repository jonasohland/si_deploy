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
export interface CrosspointSync {
    state: boolean;
    vol: number;
    master: CrosspointVolumeSource;
    slaves: CrosspointVolumeTarget[];
}
export declare function xpEqual(lhs: Crosspoint, rhs: Crosspoint): boolean;
export declare function xpVtEqual(lhs: CrosspointVolumeTarget, rhs: CrosspointVolumeTarget): boolean;
export declare function __xpid(xp: Crosspoint): string;
export declare function xpvtid(xp_vt: CrosspointVolumeSource): string;
