import _ from 'lodash';

export interface Port {
    Node: number, Port: number, IsInput: boolean
}

export interface Crosspoint {
    Source: Port, Destination: Port
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
    xpid: string, state: boolean
}

export interface CrosspointVolumeTarget {
    xp: Crosspoint, conf: boolean, single: boolean, set: boolean
}

export interface AddCrosspointVolumeTargetMessage {
    masterid: string, slave: CrosspointVolumeTarget
}

export interface XPSyncModifySlavesMessage {
    master: string, slaves: CrosspointVolumeTarget[]
}

export enum CrosspointSyncType {
    SINGLE,
    WILDCARD_SRC,
    WILDCARD_DST
}

export interface CrosspointSync {
    state: boolean;
    vol: number;
    // TODO: sync types
    type: CrosspointSyncType;
    master: CrosspointVolumeSource;
    slaves: CrosspointVolumeTarget[];
    exclude: Crosspoint[];
}

export function makeSingleVolumeTarget(xp: Crosspoint): CrosspointVolumeTarget
{
    return { xp, single : true, conf : false, set : false };
}

export function makeConferenceVolumeTarget(xp: Crosspoint):
    CrosspointVolumeTarget
{
    return { xp, single : false, conf : true, set : false };
}

export function makeXPSetterTarget(xp: Crosspoint, single: boolean = true,
                                   conf: boolean = true): CrosspointVolumeTarget
{
    return { xp, single, conf, set : true };
}

export function makeXPVolumeSource(
    xp: Crosspoint, conf: boolean): CrosspointVolumeSource
{
    return { xp, conf };
}

export function makeXPSync(master: CrosspointVolumeSource): CrosspointSync
{
    return {
        state : false,
        vol : 0,
        type : CrosspointSyncType.SINGLE,
        master,
        slaves : [],
        exclude : []
    };
}

export function isLoopbackXP(xp: Crosspoint)
{
    return xp.Source.Port === xp.Destination.Port
           && xp.Source.Node === xp.Destination.Node
           && xp.Source.IsInput != xp.Destination.IsInput;
}

export function getLoopbackXPForWildcard(xp: Crosspoint): Crosspoint
{
    if (isWildcardPort(xp.Source))
        return {
            Source : _.cloneDeep(xp.Destination),
            Destination : _.cloneDeep(xp.Destination)
        };
    else
        return {
            Source : _.cloneDeep(xp.Source),
            Destination : _.cloneDeep(xp.Source)
        };
}

export function portEqual(lhs: Port, rhs: Port)
{
    return lhs.Node === rhs.Node && lhs.Port === rhs.Port
           && lhs.IsInput === rhs.IsInput;
}

export function xpEqual(lhs: Crosspoint, rhs: Crosspoint)
{
    return portEqual(lhs.Source, rhs.Source)
           && portEqual(lhs.Destination, rhs.Destination);
}

export function xpVtEqual(
    lhs: CrosspointVolumeTarget, rhs: CrosspointVolumeTarget)
{
    return xpEqual(lhs.xp, rhs.xp) && lhs.single === rhs.single
           && lhs.conf === rhs.conf;
}

export function __xpid(xp: Crosspoint)
{
    return `${xp.Source.Node}.${xp.Source.Port}x${xp.Destination.Node}.${
        xp.Destination.Port}`
}

export function xpvtid(xp_vt: CrosspointVolumeSource)
{
    if (isWildcardXP(xp_vt.xp))
        return `${__xpid(xp_vt.xp)}|*`;
    return `${__xpid(xp_vt.xp)}${xp_vt.conf ? '|c' : '|s'}`;
}

export function makeWildcardPort(): Port
{
    return { Node : -1, Port : -1, IsInput : null };
}

export function isWildcardPort(port: Port)
{
    return port.Node == -1 || port.Port == -1;
}

export function isWildcardXP(xp: Crosspoint)
{
    return isWildcardPort(xp.Source) || isWildcardPort(xp.Destination);
}

export function destinationPortIsWildcard(xp: Crosspoint)
{
    return isWildcardPort(xp.Destination);
}

export function sourcePortIsWildcard(xp: Crosspoint)
{
    return isWildcardPort(xp.Source);
}

export function withSourceAsSourceWildcard(xp: Crosspoint): Crosspoint
{
    return {
        Source : makeWildcardPort(),
        Destination : _.cloneDeep(xp.Source)
    };
}

export function withSourceAsDestinationWildcard(xp: Crosspoint): Crosspoint
{
    return {
        Source : _.cloneDeep(xp.Source),
        Destination : makeWildcardPort()
    };
}

export function withDestinationeAsSourceWildcard(xp: Crosspoint): Crosspoint
{
    return {
        Source : makeWildcardPort(),
        Destination : _.cloneDeep(xp.Destination)
    };
}

export function withDestinationAsDestinationWildcard(xp: Crosspoint): Crosspoint
{
    return {
        Source : _.cloneDeep(xp.Destination),
        Destination : makeWildcardPort()
    };
}