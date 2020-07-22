import { NodeModule, ServerModule } from "./core";
import { Connection } from "./communication";
import { BasicUserModule, BasicSpatializer, AdvancedSpatializerModule, BasicSpatializerModule, SpatializationModule, MulitSpatializerModule } from "./dsp_modules";
import  * as Logger from './log';
import { DSPModuleNames } from "./dsp_node";
import { NodeUsersManager } from "./users";
import { NodeAudioInputManager } from "./inputs";
import { DSPController } from "./dsp_process";

const log = Logger.get('DSPBLD');

export const GraphBuilderInputEvents = {
    FULL_REBUILD: 'rebuildgraph-full',
    REBUILD: 'rebuildgraph-partial'
}

export const GraphBuilderOutputEvents = {

}

export class NodeDSPGraphBuilder extends NodeModule {

    user_modules: Record<string, BasicUserModule> = {};
    basic_spatializers: Record<string, Record<string, MulitSpatializerModule>> = {};
    room_spatializers: Record<string, Record<string, AdvancedSpatializerModule>> = {};

    constructor()
    {
        super(DSPModuleNames.GRAPH_BUILDER);
    }

    destroy()
    {

    }

    joined(socket: SocketIO.Socket, topic: string)
    {
        
    }

    left(socket: SocketIO.Socket, topic: string)
    {

    }

    init()
    {
        this.handleModuleEvent(GraphBuilderInputEvents.FULL_REBUILD, this._do_rebuild_graph_full.bind(this));
    }

    start(connection: Connection)
    {

    }

    _do_rebuild_graph_full() 
    {
        this.dsp().resetGraph().then(() => {
            this._build_spatializer_modules();
            this._build_user_modules();
        }).catch(err => {
            log.error("Could not reset graph: " + err);
        })
    }

    _build_spatializer_modules()
    {
        this.nodeUsers().listUsers().forEach(usr => {

            log.verbose("Build input modules for user " + usr.name);
            this.basic_spatializers[usr.id] = {};

            this.nodeUsers().getUsersInputs(usr.id).forEach(input => {
                
                log.verbose(`Build input module for ${input.get().id}`);
                let mod = new MulitSpatializerModule(input);
                this.basic_spatializers[usr.id][input.get().id] = mod;  
            });

            
        });
    }

    _build_user_modules() 
    {
        this.nodeUsers().listUsers().forEach((usr) => {
            
        });
    }

    nodeUsers() {
        return <NodeUsersManager> this.myNode().getModule(DSPModuleNames.USERS);
    }

    nodeInputs() {
        return <NodeAudioInputManager> this.myNode().getModule(DSPModuleNames.INPUTS);
    }

    dsp() {
        return <DSPController> this.myNode().getModule(DSPModuleNames.DSP_PROCESS);
    }

    graph() {
        return this.dsp().graph();
    }

}

export class DSPGraphController extends ServerModule {

    constructor()
    {
        super("graph-controller");
    }

    init()
    {

    }

    joined(socket: SocketIO.Socket, topic: string)
    {

    }

    left(socket: SocketIO.Socket, topic: string)
    {

    }
}