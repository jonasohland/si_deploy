"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const dsp_defs_1 = require("./dsp_defs");
const dsp_graph_1 = require("./dsp_graph");
const Logger = __importStar(require("./log"));
const util_1 = require("./util");
const log = Logger.get('DSP');
function normalizeRads(value) {
    if (value < 0)
        value += 4 * Math.PI;
    return (value + 2 * Math.PI) / 4 * Math.PI;
}
function normalizeDegs(value) {
    return (value + 180) / 360;
}
function normalizeIEMStWidthDegs(value) {
    return (value + 360) / (360 * 2);
}
class BasicSpatializer extends dsp_graph_1.NativeNode {
    onRemotePrepared() {
    }
    onRemoteAlive() {
    }
    constructor(name) {
        super(name, 'basic_spatializer');
        this.addInputBus(dsp_graph_1.Bus.createMainAny(2));
        this.addOutputBus(dsp_graph_1.AmbiBus.createMainForOrder(3, 1));
    }
    remoteAttached() {
        console.log('Remote attached!');
    }
    setAzimuthDeg(value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.remote.set('azimuth', normalizeDegs(value));
        });
    }
    setElevationDeg(value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.remote.set('elevation', normalizeDegs(value));
        });
    }
    setElevation(rad) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.remote.set('elevation', normalizeRads(rad));
        });
    }
    setAzimuth(rad) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.remote.set('azimuth', normalizeRads(rad));
        });
    }
    setStereoWidthDegs(value) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.remote.set('stereo-width', normalizeIEMStWidthDegs(value));
        });
    }
}
exports.BasicSpatializer = BasicSpatializer;
class AdvancedSpatializer extends dsp_graph_1.NativeNode {
    constructor(name) {
        super(name, 'advanced_spatializer');
        this.addInputBus(dsp_graph_1.Bus.createMainAny(1));
        this.addOutputBus(dsp_graph_1.AmbiBus.createMainForOrder(3, 1));
    }
    onRemotePrepared() {
    }
    remoteAttached() {
        console.log('Remote attached!');
    }
    onRemoteAlive() {
    }
    panSource(source) {
        this._cached_source = source;
        this._setxyz(source.a, source.e);
    }
    _setxyz(a, e) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.remote) {
                let x = Math.cos(a) * Math.cos(e) * 0.15 + 0.5;
                let y = Math.sin(a) * Math.cos(e) * 0.15 + 0.5;
                let z = Math.sin(e) * 0.15 + 0.5;
                return this.remote.set('xyz', { x, y, z });
            }
        });
    }
}
exports.AdvancedSpatializer = AdvancedSpatializer;
class BasicBinauralDecoder extends dsp_graph_1.NativeNode {
    onRemotePrepared() {
    }
    onRemoteAlive() {
    }
    constructor(name, order) {
        super(name, 'basic_binaural_decoder');
        this.addInputBus(dsp_graph_1.AmbiBus.createMainForOrder(order, 1));
        this.addOutputBus(dsp_graph_1.Bus.createMainStereo(1));
    }
    remoteAttached() {
    }
}
exports.BasicBinauralDecoder = BasicBinauralDecoder;
class AdvancedBinauralDecoder extends dsp_graph_1.NativeNode {
    constructor(name, order, headtracker_id) {
        super(name, 'advanced_binaural_decoder');
        this._htrk_id = -1;
        this.addInputBus(dsp_graph_1.AmbiBus.createMainForOrder(order, 1));
        this.addOutputBus(dsp_graph_1.Bus.createMainStereo(1));
        this._htrk_id = headtracker_id;
    }
    onRemotePrepared() {
    }
    onRemoteAlive() {
        if (this._htrk_id != -1) {
            this.setHeadtrackerId(this._htrk_id).catch(err => {
                log.error("Could not set headtracker id");
            });
        }
    }
    remoteAttached() {
    }
    setHeadtrackerId(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this._htrk_id = id;
            if (this._htrk_id != -1)
                return this.remote.set('headtracker-id', id);
        });
    }
    getHeadtrackerId() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.remote.request('headtracker-id')).data;
        });
    }
}
exports.AdvancedBinauralDecoder = AdvancedBinauralDecoder;
class BasicSpatializerModule {
    constructor() {
        this.encoder_nid = -1;
        this.id = -1;
    }
    setAzm(azm) {
        if (this.processor)
            this.processor.setAzimuthDeg(azm);
    }
    setElv(elv) {
        if (this.processor)
            this.processor.setElevationDeg(elv);
    }
    setStWidth(stwidth) {
        if (this.processor)
            this.processor.setStereoWidthDegs(stwidth);
    }
    getProcessor() {
        return this.processor;
    }
    destroy(graph) {
        graph.removeNode(this.encoder_nid);
    }
    input(graph) {
        return graph.getNode(this.encoder_nid).getMainInputBus();
    }
    output(graph) {
        return graph.getNode(this.encoder_nid).getMainOutputBus();
    }
    graphChanged(graph) {
    }
    build(graph) {
    }
}
exports.BasicSpatializerModule = BasicSpatializerModule;
class AdvancedSpatializerModule {
    constructor() {
        this.encoder_l_nid = -1;
        this.encoder_r_nid = -1;
        this.id = -1;
        this.cachedElv = 0;
        this.cachedAzm = 0;
        this.cachedStWidth = 0;
    }
    setAzm(azm) {
        this.cachedAzm = (azm / 360) * 2 * Math.PI;
        this.sendPosData();
    }
    setElv(elv) {
        this.cachedElv = (elv / 360) * 2 * Math.PI;
        this.sendPosData();
    }
    setStWidth(stwidth) {
        this.cachedStWidth = (stwidth / 360) * 2 * Math.PI;
        this.sendPosData();
    }
    setReflections(reflections) {
        if (this.processorR) {
            this.processorL.remote.set('reflections', 0);
            this.processorR.remote.set('reflections', 0);
        }
        else
            this.processorL.remote.set('reflections', reflections);
    }
    setRoomCharacter(character) {
        this.processorL.remote.set('room_character', character);
        if (this.processorR)
            this.processorR.remote.set('room_character', character);
    }
    destroy(graph) {
    }
    input(graph) {
        return graph.getNode(this.encoder_l_nid).getMainInputBus();
    }
    output(graph) {
        return graph.getNode(this.encoder_l_nid).getMainOutputBus();
    }
    graphChanged(graph) {
    }
    build(graph) {
    }
    sendPosData() {
        let azmL = this.cachedAzm;
        let X = Math.cos(azmL) * Math.cos(this.cachedElv) * 0.15 + 0.5;
        let Y = Math.sin(azmL) * Math.cos(this.cachedElv) * 0.15 + 0.5;
        let Z = Math.sin(this.cachedElv) * 0.15 + 0.5;
        this.processorL.remote.set('xyz', { x: X, y: Y, z: Z });
        if (this.processorR) {
            let azmR = this.cachedAzm + (this.cachedStWidth / 2);
            let X2 = Math.cos(azmR) * Math.cos(this.cachedElv) * 0.15 + 0.5;
            let Y2 = Math.sin(azmR) * Math.cos(this.cachedElv) * 0.15 + 0.5;
            let Z2 = Math.sin(this.cachedElv) * 0.15 + 0.5;
            this.processorR.remote.set('xyz', { x: X2, y: Y2, z: Z2 });
        }
    }
}
exports.AdvancedSpatializerModule = AdvancedSpatializerModule;
class SpatializationModule extends dsp_graph_1.Module {
}
exports.SpatializationModule = SpatializationModule;
class MultiSpatializer extends dsp_graph_1.NativeNode {
    constructor(name, type) {
        super(name, 'multi_spatializer');
        this._mute = false;
        this._chtype = type;
        this._chcount = dsp_defs_1.SourceUtils[type].channels;
        this.addInputBus(dsp_graph_1.Bus.createMain(1, type));
        this.addOutputBus(dsp_graph_1.Bus.createMain(1, dsp_defs_1.PortTypes.Ambi_O3));
        this._params = dsp_defs_1.SourceUtils[type].defaults();
        this._params.e = -10;
    }
    setElevation(elevation) {
        this._params.e = elevation;
        if (this.remote)
            this._apply_sources().catch(err => { });
    }
    setAzimuth(azimuth) {
        this._params.a = azimuth;
        if (this.remote)
            this._apply_sources().catch(err => { });
    }
    pan(params) {
        this._params = params;
        if (this.remote)
            this._apply_sources().catch(err => { });
    }
    onRemoteAlive() {
    }
    onRemotePrepared() {
        log.info('MultiSpatializer remote prepared');
        this._apply_all_parameters().catch(err => {
            log.error("Could not apply all parameters for Spatializer " + this.id + " " + err);
        });
    }
    remoteAttached() {
    }
    mute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.remote.set('mute', true);
        });
    }
    unmute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.remote.set('mute', false);
        });
    }
    _apply_all_parameters() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.remote.set('mute', this._mute);
            return this._apply_sources();
        });
    }
    _apply_sources() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.remote.set('sources', dsp_defs_1.SourceUtils[this._chtype].pan(this._params));
        });
    }
}
exports.MultiSpatializer = MultiSpatializer;
class RoomSpatializer extends dsp_graph_1.NativeNode {
    constructor(name) {
        super(name, 'advanced_spatializer');
        this._remote_alive = false;
        this.addInputBus(dsp_graph_1.Bus.createMainAny(1));
        this.addOutputBus(dsp_graph_1.AmbiBus.createMainForOrder(3, 1));
    }
    remoteAttached() {
    }
    onRemoteAlive() {
    }
    onRemotePrepared() {
        this._remote_alive = true;
        this.panSource(this._cached_source);
        this._set_roomdata().catch(err => log.error(err));
    }
    panSource(source) {
        this._cached_source = source;
        this._setxyz(source.a, source.e);
    }
    setRoomData(room) {
        this._roomdata = room;
        this._set_roomdata().catch(err => log.error(err));
    }
    setRoomEnabled(room) {
        this._roomdata = room;
        if (this._remote_alive) {
            if (this._roomdata.enabled)
                this.remote.set('reflections', this._roomdata.reflections);
            else
                this.remote.set('reflections', 0.);
        }
    }
    setRoomReflections(room) {
        this.setRoomEnabled(room);
    }
    setRoomAttn(room) {
        this._roomdata = room;
        if (this._remote_alive)
            this.remote.set('attn', this._roomdata.attn);
    }
    setRoomShape(room) {
        this._roomdata = room;
        if (this._remote_alive)
            this.remote.set('shape', this._roomdata.room);
    }
    setRoomHighshelf(room) {
        this._roomdata = room;
        if (this._remote_alive)
            this.remote.set('highshelf', this._roomdata.eq.high);
    }
    setRoomLowshelf(room) {
        this._roomdata = room;
        if (this._remote_alive)
            this.remote.set('lowshelf', this._roomdata.eq.low);
    }
    _set_roomdata() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.remote.set('shape', this._roomdata.room);
            yield this.remote.set('highshelf', this._roomdata.eq.high);
            yield this.remote.set('lowshelf', this._roomdata.eq.low);
            yield this.remote.set('attn', this._roomdata.attn);
            if (this._roomdata.enabled)
                yield this.remote.set('reflections', this._roomdata.reflections);
            else
                yield this.remote.set('reflections', 0.);
        });
    }
    _setxyz(a, e) {
        return __awaiter(this, void 0, void 0, function* () {
            a = a * Math.PI / 180;
            e = e * Math.PI / 180;
            if (this._remote_alive) {
                let x = Math.cos(a) * Math.cos(e) * 0.15 + 0.5;
                let y = Math.sin(a) * Math.cos(e) * 0.15 + 0.5;
                let z = Math.sin(e) * 0.15 + 0.5;
                return this.remote.set('xyz', { x, y, z });
            }
        });
    }
}
exports.RoomSpatializer = RoomSpatializer;
class SimpleUsersModule extends dsp_graph_1.Module {
    constructor(user) {
        super();
        this._usr = user;
    }
    input(graph) {
        return graph.getNode(this._decoder_id).getMainInputBus();
    }
    output(graph) {
        return graph.getNode(this._decoder_id).getMainOutputBus();
    }
    graphChanged(graph) {
    }
    setHeadtrackerId(id) {
        this._decoder;
    }
    build(graph) {
        this._decoder = new AdvancedBinauralDecoder(this._usr.get().name, 3, this._usr.get().headtracker || -1);
        this._decoder_id = graph.addNode(this._decoder);
        let spatializers = graph.modules.filter(module => module instanceof SpatializationModule);
        let my_spatializers = spatializers.filter(sp => sp.userId()
            === this._usr.get().id);
        my_spatializers.forEach(spatializer => {
            spatializer.outputBuses(graph).forEach(bus => {
                let con = bus.connect(this._decoder.getMainInputBus());
                if (con)
                    graph.addConnection(con);
            });
        });
        let output_con = this._decoder.getMainOutputBus().connectOtherIdx(graph.graphExitBus(), this._usr.get().channel);
        graph.addConnection(output_con);
    }
    destroy(graph) {
        if (graph.removeNode(this._decoder_id))
            log.debug(`Removed decoder module for user ${this._usr.get().name}`);
        else
            log.warn(`Could not remove decoder module for user ${this._usr.get().name}`);
    }
}
exports.SimpleUsersModule = SimpleUsersModule;
class RoomSpatializerModule extends SpatializationModule {
    constructor(input, roomdata) {
        super();
        this._encoder_nids = [];
        this._encoders = [];
        this._input = input;
        this._cached_params = dsp_defs_1.SourceUtils[input.findSourceType()].defaults();
        this._roomdata = roomdata;
    }
    userId() {
        return this._input.get().userid;
    }
    room() {
        return this._input.get().room;
    }
    pan(params) {
        this._cached_params = params;
        let sources = dsp_defs_1.SourceUtils[this._input.findSourceType()].pan(params);
        sources.forEach((source, idx) => {
            if (this._encoders[idx])
                this._encoders[idx].panSource(source);
        });
    }
    setAzimuth(a) {
        this._cached_params.a = a;
        this.pan(this._cached_params);
    }
    setElevation(e) {
        this._cached_params.e = e;
        this.pan(this._cached_params);
    }
    setRoomData(room) {
        this._encoders.forEach(encoder => encoder.setRoomData(room));
    }
    setRoomEnabled(room) {
        this._encoders.forEach(encoder => encoder.setRoomEnabled(room));
    }
    setRoomReflections(room) {
        this._encoders.forEach(encoder => encoder.setRoomReflections(room));
    }
    setRoomAttn(room) {
        this._encoders.forEach(encoder => encoder.setRoomAttn(room));
    }
    setRoomShape(room) {
        this._encoders.forEach(encoder => encoder.setRoomShape(room));
    }
    setRoomHighshelf(room) {
        this._encoders.forEach(encoder => encoder.setRoomHighshelf(room));
    }
    setRoomLowshelf(room) {
        this._encoders.forEach(encoder => encoder.setRoomLowshelf(room));
    }
    input(graph) {
        util_1.ignore(graph);
        return null;
    }
    output(graph) {
        util_1.ignore(graph);
        return null;
    }
    outputBuses(graph) {
        return this._encoders.map(encoder => encoder.getMainOutputBus());
    }
    graphChanged(graph) {
    }
    build(graph) {
        let sourcetype = this._input.findSourceType();
        let sourcechcount = dsp_defs_1.SourceUtils[sourcetype].channels;
        let firstchannel = this._input.findSourceChannel();
        for (let i = 0; i < sourcechcount; ++i) {
            let node = new RoomSpatializer('' + i);
            node.setRoomData(this._roomdata);
            this._encoder_nids.push(graph.addNode(node));
            this._encoders.push(node);
            let connection = graph.graphRootBus().connectIdx(node.getMainInputBus(), firstchannel + i);
            if (connection)
                graph.addConnection(connection);
            else {
                log.error(`Could not connect input for RoomSpatializer ${this._input.get().inputid}`);
            }
        }
        this.pan(this._cached_params);
    }
    destroy(graph) {
        this._encoders.forEach(enc => graph.removeNode(enc));
    }
}
exports.RoomSpatializerModule = RoomSpatializerModule;
class MulitSpatializerModule extends SpatializationModule {
    constructor(input) {
        super();
        this._input = input;
        this._params_cached = dsp_defs_1.SourceUtils[input.findSourceType()].defaults();
    }
    pan(params) {
        this._params_cached = params;
        if (this._spatializer_node)
            this._spatializer_node.pan(params);
    }
    setAzimuth(a) {
        console.log("Multispatializer " + a);
        this._params_cached.a = a;
        if (this._spatializer_node)
            this._spatializer_node.setAzimuth(a);
    }
    setElevation(e) {
        this._params_cached.e = e;
        if (this._spatializer_node)
            this._spatializer_node.setElevation(e);
    }
    input(graph) {
        return graph.getNode(this._spatializer_node_id).getMainInputBus();
    }
    output(graph) {
        return graph.getNode(this._spatializer_node_id).getMainOutputBus();
    }
    outputBuses(graph) {
        return [graph.getNode(this._spatializer_node_id).getMainOutputBus()];
    }
    graphChanged(graph) {
    }
    userId() {
        return this._input.get().userid;
    }
    build(graph) {
        let node = new MultiSpatializer(`MultiSpatializer [${this._input.findSourceType()}]`, this._input.findSourceType());
        this._spatializer_node = node;
        this._spatializer_node_id = graph.addNode(node);
        this._spatializer_node.pan(this._params_cached);
        let mainInputConnection = graph.graphRootBus().connectIdx(node.getMainInputBus(), this._input.findSourceChannel());
        graph.addConnection(mainInputConnection);
    }
    destroy(graph) {
        if (graph.removeNode(this._spatializer_node_id))
            log.debug(`Removed spatializer from graph node for spatializer module for input ${this._input.get().id}`);
        else
            log.warn(`Could not remove spatializer node from graph for spatializer module for input ${this._input.get().id}`);
    }
}
exports.MulitSpatializerModule = MulitSpatializerModule;
;
//# sourceMappingURL=dsp_modules.js.map