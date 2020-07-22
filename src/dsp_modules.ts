import { PortTypes, SourceUtils} from './dsp_defs';
import {
    AmbiBus,
    Bus,
    Connection,
    Graph,
    Module,
    NativeNode,
} from './dsp_graph'
import {GraphBuilderOutputEvents} from './dsp_graph_builder';
import * as Logger from './log';
import {OLDUser, OwnedInput, SpatializedInput, User} from './users';
import {UserData} from './users_defs';

const log = Logger.get('DSP');

function normalizeRads(value: number)
{
    if (value < 0)
        value += 4 * Math.PI;

    return (value + 2 * Math.PI) / 4 * Math.PI;
}

function normalizeDegs(value: number)
{
    return (value + 180) / 360;
}

function normalizeIEMStWidthDegs(value: number)
{
    return (value + 360) / (360 * 2);
}


export class BasicSpatializer extends NativeNode {
    onRemoteAlive(): void
    {
    }

    constructor(name: string)
    {
        super(name, 'basic_spatializer');
        this.addInputBus(Bus.createMainAny(2));
        this.addOutputBus(AmbiBus.createMainForOrder(3, 1));
    }

    remoteAttached(): void
    {
        console.log('Remote attached!');
    }

    async setAzimuthDeg(value: number)
    {
        this.remote.set('azimuth', normalizeDegs(value));
    }

    async setElevationDeg(value: number)
    {
        this.remote.set('elevation', normalizeDegs(value));
    }

    async setElevation(rad: number)
    {
        return this.remote.set('elevation', normalizeRads(rad));
    }

    async setAzimuth(rad: number)
    {
        return this.remote.set('azimuth', normalizeRads(rad));
    }

    async setStereoWidthDegs(value: number)
    {
        return this.remote.set('stereo-width', normalizeIEMStWidthDegs(value));
    }
}

export class AdvancedSpatializer extends NativeNode {

    onRemoteAlive(): void
    {
    }

    constructor(name: string)
    {
        super(name, 'advanced_spatializer');
        this.addInputBus(Bus.createMainAny(1));
        this.addOutputBus(AmbiBus.createMainForOrder(3, 1));
    }

    remoteAttached(): void
    {
        console.log('Remote attached!');
    }

    async setAzimuthDeg(value: number)
    {
        this.remote.set('azimuth', normalizeDegs(value));
    }

    async setElevationDeg(value: number)
    {
        this.remote.set('elevation', normalizeDegs(value));
    }

    async setElevation(rad: number)
    {
        return this.remote.set('elevation', normalizeRads(rad));
    }

    async setAzimuth(rad: number)
    {
        return this.remote.set('azimuth', normalizeRads(rad));
    }

    async setStereoWidthDegs(value: number)
    {
        return this.remote.set('stereo-width', normalizeIEMStWidthDegs(value));
    }
}

export class BasicBinauralDecoder extends NativeNode {
    onRemoteAlive(): void
    {
    }

    constructor(name: string, order: number)
    {
        super(name, 'basic_binaural_decoder');
        this.addInputBus(AmbiBus.createMainForOrder(order, 1));
        this.addOutputBus(Bus.createMainStereo(1));
    }

    remoteAttached()
    {
    }
}

export class AdvancedBinauralDecoder extends NativeNode {
    onRemoteAlive(): void
    {
    }

    constructor(name: string)
    {
        super(name, 'advanced_binaural_decoder');
        this.addInputBus(AmbiBus.createMainForOrder(3, 1));
        this.addOutputBus(Bus.createMainStereo(1));
    }

    remoteAttached()
    {
    }

    async setHeadtrackerId(id: number)
    {
        return this.remote.set('headtracker-id', id);
    }

    async getHeadtrackerId()
    {
        return <number>(await this.remote.request('headtracker-id')).data;
    }
}

export abstract class SpatializationModule extends Module {
    abstract setAzm(azm: number): void;
    abstract setElv(elv: number): void;
    abstract setStWidth(stwidth: number): void;
}

export class BasicSpatializerModule extends SpatializationModule {

    constructor(input: OwnedInput, user: OLDUser)
    {
        super();
        this.owned_input = input;
        this.user        = user;
    }

    encoder_nid: number = -1;
    id: number          = -1;
    owned_input: OwnedInput;
    user: OLDUser;
    inputConn: Connection;
    outputConn: Connection;
    processor: BasicSpatializer;

    setAzm(azm: number): void
    {
        if (this.processor)
            this.processor.setAzimuthDeg(azm);
    }

    setElv(elv: number): void
    {
        if (this.processor)
            this.processor.setElevationDeg(elv);
    }

    setStWidth(stwidth: number): void
    {
        if (this.processor)
            this.processor.setStereoWidthDegs(stwidth);
    }

    getProcessor()
    {
        return this.processor;
    }

    destroy(graph: Graph)
    {
        log.info(`Destroying spatializer module for Input ${
            this.owned_input.input.name} `);
        graph.removeNode(this.encoder_nid);
    }

    input(graph: Graph): Bus
    {
        return graph.getNode(this.encoder_nid).getMainInputBus();
    }

    output(graph: Graph): Bus
    {
        return graph.getNode(this.encoder_nid).getMainOutputBus();
    }

    graphChanged(graph: Graph): void
    {
    }

    build(graph: Graph): void
    {
        let node = new BasicSpatializer(this.owned_input.input.name + ' -> '
                                        + this.user.name);

        this.processor = node;

        graph.addNode(node);

        this.encoder_nid = node.id;

        this.owned_input.dspModule = this;

        let start_ch = this.owned_input.input.channels[0].i;

        if (this.owned_input.format == 'mono') {

            this.inputConn = graph.graphRootBus().connectIdxN(
                node.getMainInputBus(), start_ch, 1);
        }
        else {
            this.inputConn = graph.graphRootBus().connectIdxN(
                node.getMainInputBus(), start_ch, 2);
        }

        graph.addConnection(this.inputConn);
    }
}

export class AdvancedSpatializerModule extends SpatializationModule {

    setAzm(azm: number): void
    {
        this.cachedAzm = (azm / 360) * 2 * Math.PI;
        this.sendPosData();
    }
    setElv(elv: number): void
    {
        this.cachedElv = (elv / 360) * 2 * Math.PI;
        this.sendPosData();
    }
    setStWidth(stwidth: number): void
    {
        this.cachedStWidth = (stwidth / 360) * 2 * Math.PI;
        this.sendPosData();
    }

    setReflections(reflections: number)
    {

        if (this.processorR) {

            this.processorL.remote.set('reflections', 0);
            this.processorR.remote.set('reflections', 0);
        }
        else
            this.processorL.remote.set('reflections', reflections);
    }

    setRoomCharacter(character: number)
    {

        this.processorL.remote.set('room_character', character);

        if (this.processorR)
            this.processorR.remote.set('room_character', character);
    }

    constructor(input: OwnedInput, user: OLDUser)
    {
        super();
        this.owned_input = input;
        this.user        = user;
    }

    encoder_l_nid: number = -1;
    encoder_r_nid: number = -1;
    id: number            = -1;
    owned_input: OwnedInput;
    user: OLDUser;
    inputConnL: Connection;
    inputConnR: Connection;
    processorL: AdvancedSpatializer;
    processorR: AdvancedSpatializer;

    cachedElv: number     = 0;
    cachedAzm: number     = 0;
    cachedStWidth: number = 0;

    destroy(graph: Graph)
    {
        log.info(`Destroying _advanced_ spatializer module for Input ${
            this.owned_input.input.name} `);
        graph.removeNode(this.encoder_l_nid);

        if (this.encoder_r_nid != -1)
            graph.removeNode(this.encoder_r_nid);
    }

    input(graph: Graph): Bus
    {
        return graph.getNode(this.encoder_l_nid).getMainInputBus();
    }

    output(graph: Graph): Bus
    {
        return graph.getNode(this.encoder_l_nid).getMainOutputBus();
    }

    graphChanged(graph: Graph): void
    {
    }

    build(graph: Graph): void
    {
        this.owned_input.dspModule = this;
        let start_ch               = this.owned_input.input.channels[0].i;


        let node = new AdvancedSpatializer(this.owned_input.input.name
                                           + '_L -> ' + this.user.name + '');

        this.processorL = node;

        graph.addNode(node);

        this.encoder_l_nid = node.id;

        this.inputConnL = graph.graphRootBus().connectIdxN(
            node.getMainInputBus(), start_ch, 1);


        graph.addConnection(this.inputConnL);

        if (this.owned_input.format == 'stereo') {

            let rnode = new AdvancedSpatializer(this.owned_input.input.name
                                                + '_R -> ' + this.user.name);

            this.processorR = rnode;

            graph.addNode(rnode);

            this.encoder_r_nid = rnode.id;

            this.inputConnR = graph.graphRootBus().connectIdxN(
                rnode.getMainInputBus(), start_ch + 1, 1);

            graph.addConnection(this.inputConnR);
        }
    }

    sendPosData()
    {

        let azmL = (this.owned_input.format == 'stereo')
                       ? this.cachedAzm - (this.cachedStWidth / 2)
                       : this.cachedAzm;

        let X = Math.cos(azmL) * Math.cos(this.cachedElv) * 0.15 + 0.5;
        let Y = Math.sin(azmL) * Math.cos(this.cachedElv) * 0.15 + 0.5;
        let Z = Math.sin(this.cachedElv) * 0.15 + 0.5;

        console.log(X, Y, Z);

        this.processorL.remote.set('xyz', { x : X, y : Y, z : Z });

        if (this.processorR) {

            let azmR = this.cachedAzm + (this.cachedStWidth / 2);

            let X2 = Math.cos(azmR) * Math.cos(this.cachedElv) * 0.15 + 0.5;
            let Y2 = Math.sin(azmR) * Math.cos(this.cachedElv) * 0.15 + 0.5;
            let Z2 = Math.sin(this.cachedElv) * 0.15 + 0.5;

            this.processorR.remote.set('xyz', { x : X2, y : Y2, z : Z2 });
        }
    }
}

export class BasicUserModule extends Module {

    decoder_nid: number = -1;
    id: number          = -1;
    user: OLDUser
    outputConn: Connection;
    inputCons: Connection[] = [];
    graph: Graph;
    node: AdvancedBinauralDecoder;

    constructor(user: OLDUser)
    {
        super();
        this.user = user;
    }

    input(graph: Graph): Bus
    {
        return graph.getNode(this.decoder_nid).getMainInputBus();
    }

    output(graph: Graph): Bus
    {
        return graph.getNode(this.decoder_nid).getMainOutputBus();
    }

    async assignHeadtracker(id: number)
    {
        if (this.node)
            return this.node.setHeadtrackerId(id);
    }

    graphChanged(graph: Graph): void
    {
        this.inputCons = this.inputCons.filter(con => con.valid());

        this.user.inputs.forEach(input => {
            if (!graph.hasModule(input.dspModule))
                return;

            if (this.user.advanced) {
                console.log(`Checking input ${input.input.name} - nid: ${
                    (<AdvancedSpatializerModule>input.dspModule)
                        .encoder_l_nid}`);

                if (this.inputCons.find(
                        con => con.sources.length
                               && (con.sources[0].n
                                   == (<AdvancedSpatializerModule>input
                                           .dspModule)
                                          .encoder_l_nid)))
                    return;

                if (input.format == 'stereo') {
                    if (this.inputCons.find(
                            con => con.sources.length
                                   && (con.sources[0].n
                                       == (<AdvancedSpatializerModule>input
                                               .dspModule)
                                              .encoder_r_nid)))
                        return;
                }

                let conL = (<AdvancedSpatializerModule>input.dspModule)
                               .processorL.getMainOutputBus()
                               .connect(this.input(graph));

                this.inputCons.push(conL);
                graph.addConnection(conL);

                if (input.format == 'stereo') {
                    let conR = (<AdvancedSpatializerModule>input.dspModule)
                                   .processorR.getMainOutputBus()
                                   .connect(this.input(graph));

                    this.inputCons.push(conR);
                    graph.addConnection(conR);
                }
            }
            else {
                console.log(`Checking input ${input.input.name} - nid: ${
                    (<BasicSpatializerModule>input.dspModule).encoder_nid}`);

                if (input.dspModule) {

                    console.log(this.decoder_nid);

                    if (this.inputCons.find(
                            con => con.sources.length
                                   && (con.sources[0].n
                                       == (<BasicSpatializerModule>input
                                               .dspModule)
                                              .encoder_nid)))
                        return;

                    console.log('Adding inputs for Module ' + input.input.name);

                    let con = input.dspModule.output(graph).connect(
                        this.input(graph));

                    this.inputCons.push(con);
                    graph.addConnection(con);
                }
            }
        });
    }

    build(graph: Graph): void
    {
        let node = new AdvancedBinauralDecoder(this.user.name);

        graph.addNode(node);

        this.node  = node;
        this.graph = graph;

        this.user.dspModule = this;

        this.outputConn = node.getMainOutputBus().connectOtherIdx(
            graph.graphExitBus(), this.user.outputChannels[0].i);

        this.decoder_nid = node.id;

        graph.addConnection(this.outputConn);
    }

    destroy(graph: Graph)
    {
        graph.removeNode(this.decoder_nid);
    }
}

export interface MultiSpatializerChannelSettings {
    a: number;
    e: number;
    gain: number;
    mute: number;
    solo: number;
};

export class MultiSpatializer extends NativeNode {

    _chtype: PortTypes;
    _chcount: number;
    _chs: MultiSpatializerChannelSettings[];

    setElevations(elevations: number[], startindex: number = 0)
    {
        for(let i = 0; i < elevations.length; ++i) {
            if(i + startindex >= this._chcount)
                break;

            this._chs[i + startindex].e = elevations[i];
        }
    }

    setAzimuths(azmths: number[], startindex: number = 0)
    {
        for(let i = 0; i < azmths.length; ++i) {
            if(i + startindex >= this._chcount)
                break;

            this._chs[i + startindex].a = azmths[i];
        }
    }

    onRemoteAlive()
    {
        log.info('MultiSpatializer remote alive');
    }

    remoteAttached()
    {
    }

    _set_all_channels() {
        return this.remote.set('allchannels', this._chs);
    }

    constructor(name: string, type: PortTypes)
    {
        super(name, 'multi_spatializer');
        this._chtype = type;
        this._chcount = SourceUtils[type].channels;
        this.addInputBus(Bus.createMain(1, type));
        this.addOutputBus(Bus.createMain(1, PortTypes.Ambi_O3));
    }
}

export class SimpleUsersModule extends Module {

    _usr: User;
    _decoder_id: number;

    constructor(user: User)
    {
        super();
        this._usr = user;
    }

    input(graph: Graph): Bus
    {
        return graph.getNode(this._decoder_id).getMainInputBus();
    }

    output(graph: Graph): Bus
    {
        return graph.getNode(this._decoder_id).getMainOutputBus();
    }

    graphChanged(graph: Graph): void
    {
    }

    build(graph: Graph): void
    {

        let node         = new BasicBinauralDecoder(this._usr.get().name, 3);
        this._decoder_id = graph.addNode(node);

        let spatializers = <MulitSpatializerModule[]>graph.modules.filter(
            module => module instanceof MulitSpatializerModule);
        let my_spatializers = spatializers.filter(sp => sp._input.get().userid
                                                        === this._usr.get().id);

        my_spatializers.forEach(spatializer => {
            let con = spatializer.output(graph).connect(node.getMainInputBus());
            if (con)
                graph.addConnection(con);
        });

        let output_con = node.getMainOutputBus().connectOtherIdx(
            graph.graphExitBus(), this._usr.get().channel);

        graph.addConnection(output_con);
    }

    destroy(graph: Graph): void
    {
        if (graph.removeNode(this._decoder_id))
            log.debug(
                `Removed decoder module for user ${this._usr.get().name}`);
        else
            log.warn(`Could not remove decoder module for user ${
                this._usr.get().name}`);
    }
}

export class MulitSpatializerModule extends Module {

    _input: SpatializedInput;
    _spatializer_node_id: number;

    input(graph: Graph): Bus
    {
        return graph.getNode(this._spatializer_node_id).getMainInputBus();
    }

    output(graph: Graph): Bus
    {
        return graph.getNode(this._spatializer_node_id).getMainOutputBus();
    }

    graphChanged(graph: Graph): void
    {
    }

    build(graph: Graph): void
    {

        let node = new MultiSpatializer(
            `MultiSpatializer [${this._input.findSourceType()}]`,
            this._input.findSourceType());
        this._spatializer_node_id = graph.addNode(node);

        let mainInputConnection = graph.graphRootBus().connectIdx(
            node.getMainInputBus(), this._input.findSourceChannel());

        graph.addConnection(mainInputConnection);
    }


    destroy(graph: Graph): void
    {
        if (graph.removeNode(this._spatializer_node_id))
            log.debug(
                `Removed spatializer from graph node for spatializer module for input ${
                    this._input.get().id}`);
        else
            log.warn(
                `Could not remove spatializer node from graph for spatializer module for input ${
                    this._input.get().id}`);
    }

    constructor(input: SpatializedInput)
    {
        super();
        this._input = input;
    }
};
