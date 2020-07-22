import { PortTypes } from './dsp_defs';
import { Bus, Connection, Graph, Module, NativeNode } from './dsp_graph';
import { OLDUser, OwnedInput, SpatializedInput, User } from './users';
export declare class BasicSpatializer extends NativeNode {
    onRemoteAlive(): void;
    constructor(name: string);
    remoteAttached(): void;
    setAzimuthDeg(value: number): Promise<void>;
    setElevationDeg(value: number): Promise<void>;
    setElevation(rad: number): Promise<import("./communication").Message>;
    setAzimuth(rad: number): Promise<import("./communication").Message>;
    setStereoWidthDegs(value: number): Promise<import("./communication").Message>;
}
export declare class AdvancedSpatializer extends NativeNode {
    onRemoteAlive(): void;
    constructor(name: string);
    remoteAttached(): void;
    setAzimuthDeg(value: number): Promise<void>;
    setElevationDeg(value: number): Promise<void>;
    setElevation(rad: number): Promise<import("./communication").Message>;
    setAzimuth(rad: number): Promise<import("./communication").Message>;
    setStereoWidthDegs(value: number): Promise<import("./communication").Message>;
}
export declare class BasicBinauralDecoder extends NativeNode {
    onRemoteAlive(): void;
    constructor(name: string, order: number);
    remoteAttached(): void;
}
export declare class AdvancedBinauralDecoder extends NativeNode {
    onRemoteAlive(): void;
    constructor(name: string);
    remoteAttached(): void;
    setHeadtrackerId(id: number): Promise<import("./communication").Message>;
    getHeadtrackerId(): Promise<number>;
}
export declare abstract class SpatializationModule extends Module {
    abstract setAzm(azm: number): void;
    abstract setElv(elv: number): void;
    abstract setStWidth(stwidth: number): void;
}
export declare class BasicSpatializerModule extends SpatializationModule {
    constructor(input: OwnedInput, user: OLDUser);
    encoder_nid: number;
    id: number;
    owned_input: OwnedInput;
    user: OLDUser;
    inputConn: Connection;
    outputConn: Connection;
    processor: BasicSpatializer;
    setAzm(azm: number): void;
    setElv(elv: number): void;
    setStWidth(stwidth: number): void;
    getProcessor(): BasicSpatializer;
    destroy(graph: Graph): void;
    input(graph: Graph): Bus;
    output(graph: Graph): Bus;
    graphChanged(graph: Graph): void;
    build(graph: Graph): void;
}
export declare class AdvancedSpatializerModule extends SpatializationModule {
    setAzm(azm: number): void;
    setElv(elv: number): void;
    setStWidth(stwidth: number): void;
    setReflections(reflections: number): void;
    setRoomCharacter(character: number): void;
    constructor(input: OwnedInput, user: OLDUser);
    encoder_l_nid: number;
    encoder_r_nid: number;
    id: number;
    owned_input: OwnedInput;
    user: OLDUser;
    inputConnL: Connection;
    inputConnR: Connection;
    processorL: AdvancedSpatializer;
    processorR: AdvancedSpatializer;
    cachedElv: number;
    cachedAzm: number;
    cachedStWidth: number;
    destroy(graph: Graph): void;
    input(graph: Graph): Bus;
    output(graph: Graph): Bus;
    graphChanged(graph: Graph): void;
    build(graph: Graph): void;
    sendPosData(): void;
}
export declare class BasicUserModule extends Module {
    decoder_nid: number;
    id: number;
    user: OLDUser;
    outputConn: Connection;
    inputCons: Connection[];
    graph: Graph;
    node: AdvancedBinauralDecoder;
    constructor(user: OLDUser);
    input(graph: Graph): Bus;
    output(graph: Graph): Bus;
    assignHeadtracker(id: number): Promise<import("./communication").Message>;
    graphChanged(graph: Graph): void;
    build(graph: Graph): void;
    destroy(graph: Graph): void;
}
export interface MultiSpatializerChannelSettings {
    a: number;
    e: number;
    gain: number;
    mute: number;
    solo: number;
}
export declare class MultiSpatializer extends NativeNode {
    _chtype: PortTypes;
    _chcount: number;
    _chs: MultiSpatializerChannelSettings[];
    setElevations(elevations: number[], startindex?: number): void;
    setAzimuths(azmths: number[], startindex?: number): void;
    onRemoteAlive(): void;
    remoteAttached(): void;
    _set_all_channels(): Promise<import("./communication").Message>;
    constructor(name: string, type: PortTypes);
}
export declare class SimpleUsersModule extends Module {
    _usr: User;
    _decoder_id: number;
    constructor(user: User);
    input(graph: Graph): Bus;
    output(graph: Graph): Bus;
    graphChanged(graph: Graph): void;
    build(graph: Graph): void;
    destroy(graph: Graph): void;
}
export declare class MulitSpatializerModule extends Module {
    _input: SpatializedInput;
    _spatializer_node_id: number;
    input(graph: Graph): Bus;
    output(graph: Graph): Bus;
    graphChanged(graph: Graph): void;
    build(graph: Graph): void;
    destroy(graph: Graph): void;
    constructor(input: SpatializedInput);
}
