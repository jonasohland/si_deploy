import { Bus, Connection, Graph, Module, NativeNode } from './dsp';
import { OwnedInput, User } from './users';
export declare class BasicSpatializer extends NativeNode {
    constructor(name: string);
    remoteAttached(): void;
    setAzimuthDeg(value: number): Promise<void>;
    setElevationDeg(value: number): Promise<void>;
    setElevation(rad: number): Promise<import("./communication").Message>;
    setAzimuth(rad: number): Promise<import("./communication").Message>;
    setStereoWidthDegs(value: number): Promise<import("./communication").Message>;
}
export declare class AdvancedSpatializer extends NativeNode {
    constructor(name: string);
    remoteAttached(): void;
    setAzimuthDeg(value: number): Promise<void>;
    setElevationDeg(value: number): Promise<void>;
    setElevation(rad: number): Promise<import("./communication").Message>;
    setAzimuth(rad: number): Promise<import("./communication").Message>;
    setStereoWidthDegs(value: number): Promise<import("./communication").Message>;
}
export declare class BasicBinauralDecoder extends NativeNode {
    constructor(name: string);
    remoteAttached(): void;
}
export declare class AdvancedBinauralDecoder extends NativeNode {
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
    constructor(input: OwnedInput, user: User);
    encoder_nid: number;
    id: number;
    owned_input: OwnedInput;
    user: User;
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
    constructor(input: OwnedInput, user: User);
    encoder_l_nid: number;
    encoder_r_nid: number;
    id: number;
    owned_input: OwnedInput;
    user: User;
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
    user: User;
    outputConn: Connection;
    inputCons: Connection[];
    graph: Graph;
    node: AdvancedBinauralDecoder;
    constructor(user: User);
    input(graph: Graph): Bus;
    output(graph: Graph): Bus;
    assignHeadtracker(id: number): Promise<import("./communication").Message>;
    graphChanged(graph: Graph): void;
    build(graph: Graph): void;
    destroy(graph: Graph): void;
}
