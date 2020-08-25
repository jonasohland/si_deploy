import { PortTypes, Source, SourceParameterSet } from './dsp_defs';
import { Bus, Connection, Graph, Module, NativeNode } from './dsp_graph';
import { RoomData } from './rooms_defs';
import { SpatializedInput, User } from './users';
import { XTCSettings } from './users_defs';
export declare class GainNode extends NativeNode {
    _remote_alive: boolean;
    _gain: number;
    constructor(name: string, ty: PortTypes);
    setGain(gain: number): void;
    onRemotePrepared(): void;
    onRemoteAlive(): void;
    remoteAttached(): void;
}
export declare class BasicSpatializer extends NativeNode {
    onRemotePrepared(): void;
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
    onRemotePrepared(): void;
    onRemoteAlive(): void;
    constructor(name: string, order: number);
    remoteAttached(): void;
}
export declare class AdvancedBinauralDecoder extends NativeNode {
    _htrk_id: number;
    _ref_in: Bus;
    _ref_out: Bus;
    _xtc: XTCSettings;
    setXTCSettings(xtc: XTCSettings): void;
    onRemotePrepared(): void;
    onRemoteAlive(): void;
    constructor(name: string, order: number, headtracker_id: number, xtc: XTCSettings);
    refIn(): Bus;
    refOut(): Bus;
    remoteAttached(): void;
    setHeadtrackerId(id: number): Promise<import("./communication").Message>;
    getHeadtrackerId(): Promise<number>;
}
export declare class BasicSpatializerModule {
    encoder_nid: number;
    id: number;
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
export declare abstract class SpatializationModule extends Module {
    abstract pan(params: SourceParameterSet): void;
    abstract setAzimuth(a: number): void;
    abstract setElevation(e: number): void;
    abstract setHeight(h: number): void;
    abstract setWidth(w: number): void;
    abstract setGain(gain: number): void;
    abstract userId(): string;
    abstract outputBuses(graph: Graph): Bus[];
    abstract monoRefBuses(): Bus[];
    abstract stereoRefBuses(): Bus[];
}
export declare class MultiSpatializer extends NativeNode {
    _chtype: PortTypes;
    _chcount: number;
    _params: SourceParameterSet;
    _mute: boolean;
    _gain: number;
    _stereoref: Bus;
    _monoref: Bus;
    stereoRefBus(): Bus;
    monoRefBus(): Bus;
    setElevation(elevation: number): void;
    setAzimuth(azimuth: number): void;
    setGain(gain: number): void;
    pan(params: SourceParameterSet): void;
    onRemoteAlive(): void;
    onRemotePrepared(): void;
    remoteAttached(): void;
    mute(): Promise<void>;
    unmute(): Promise<void>;
    _apply_all_parameters(): Promise<import("./communication").Message>;
    _apply_sources(): Promise<import("./communication").Message>;
    _apply_gain(): Promise<import("./communication").Message>;
    constructor(name: string, type: PortTypes);
}
export declare class RoomSpatializer extends NativeNode {
    _cached_source: Source;
    _remote_alive: boolean;
    _roomdata: RoomData;
    _gain: number;
    _monoref: Bus;
    _stereoref: Bus;
    constructor(name: string);
    stereoRefBus(): Bus;
    monoRefBus(): Bus;
    remoteAttached(): void;
    onRemoteAlive(): void;
    onRemotePrepared(): void;
    panSource(source: Source): void;
    setGain(gain: number): void;
    setRoomData(room: RoomData): void;
    setRoomEnabled(room: RoomData): void;
    setRoomReflections(room: RoomData): void;
    setRoomAttn(room: RoomData): void;
    setRoomShape(room: RoomData): void;
    setRoomHighshelf(room: RoomData): void;
    setRoomLowshelf(room: RoomData): void;
    _set_roomdata(): Promise<void>;
    _setxyz(a: number, e: number): Promise<import("./communication").Message>;
}
export declare class SimpleUsersModule extends Module {
    _usr: User;
    _decoder_id: number;
    _decoder: AdvancedBinauralDecoder;
    _xtcsettings: XTCSettings;
    constructor(user: User);
    input(graph: Graph): Bus;
    output(graph: Graph): Bus;
    graphChanged(graph: Graph): void;
    setHeadtrackerId(id: number): void;
    setXTCSettings(xtc: XTCSettings): void;
    build(graph: Graph): void;
    destroy(graph: Graph): void;
}
export declare class RoomSpatializerModule extends SpatializationModule {
    _input: SpatializedInput;
    _encoder_nids: number[];
    _encoders: RoomSpatializer[];
    _gain_node: GainNode;
    _gain: number;
    _cached_params: SourceParameterSet;
    _roomdata: RoomData;
    constructor(input: SpatializedInput, roomdata: RoomData);
    userId(): string;
    room(): string;
    pan(params: SourceParameterSet): void;
    setAzimuth(a: number): void;
    setElevation(e: number): void;
    setGain(gain: number): void;
    setHeight(h: number): void;
    setWidth(w: number): void;
    setRoomData(room: RoomData): void;
    setRoomEnabled(room: RoomData): void;
    setRoomReflections(room: RoomData): void;
    setRoomAttn(room: RoomData): void;
    setRoomShape(room: RoomData): void;
    setRoomHighshelf(room: RoomData): void;
    setRoomLowshelf(room: RoomData): void;
    input(graph: Graph): Bus;
    output(graph: Graph): Bus;
    outputBuses(graph: Graph): Bus[];
    monoRefBuses(): Bus[];
    stereoRefBuses(): Bus[];
    graphChanged(graph: Graph): void;
    build(graph: Graph): void;
    destroy(graph: Graph): void;
}
export declare class MultiSpatializerModule extends SpatializationModule {
    _input: SpatializedInput;
    _node_id: number;
    _spatializer_node: MultiSpatializer;
    _gain_node: GainNode;
    _params_cached: SourceParameterSet;
    _cached_gain: number;
    _ambi: boolean;
    pan(params: SourceParameterSet): void;
    setAzimuth(a: number): void;
    setElevation(e: number): void;
    setGain(gain: number): void;
    setHeight(h: number): void;
    setWidth(w: number): void;
    input(graph: Graph): Bus;
    output(graph: Graph): Bus;
    outputBuses(graph: Graph): Bus[];
    monoRefBuses(): Bus[];
    stereoRefBuses(): Bus[];
    graphChanged(graph: Graph): void;
    userId(): string;
    build(graph: Graph): void;
    destroy(graph: Graph): void;
    constructor(input: SpatializedInput);
}
