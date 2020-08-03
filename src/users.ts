import {Connection, NODE_TYPE} from './communication';
import {
    ManagedNodeStateListRegister,
    ManagedNodeStateObject,
    NodeModule,
    ServerModule
} from './core';
import {PortTypes, SourceParameterSet} from './dsp_defs';
import {GraphBuilderInputEvents} from './dsp_graph_builder';
import {DSPModuleNames, DSPNode} from './dsp_node';
import * as Inputs from './inputs';
import * as Logger from './log';
import {
    basicSpatializedInput,
    SpatializedInputData,
    UserAddInputsMessage,
    UserAssignHeadtrackerMessage,
    UserData,
    UserDeleteInputMessage,
    UserModifyInputMessage,
    UserPanInputMessage,
    UserInputGainChangeMessage
} from './users_defs';
import {ensurePortTypeEnum} from './util';

const log = Logger.get('USERSM');

export class User extends ManagedNodeStateObject<UserData> {

    data: UserData;
    _man: NodeUsersManager;

    constructor(data: UserData, manager: NodeUsersManager)
    {
        super();
        this.data = data;
        this._man = manager;
    }

    async set(val: UserData)
    {
        this.data = val;
    }

    get(): UserData
    {
        return this.data;
    }

    inputs()
    {
        return this._man.getUsersInputs(this.data.id);
    }
}

export class SpatializedInput extends
    ManagedNodeStateObject<SpatializedInputData> {

    data: SpatializedInputData;
    inputsModule: Inputs.NodeAudioInputManager;

    constructor(data: SpatializedInputData,
                inputsModule: Inputs.NodeAudioInputManager)
    {
        super();
        this.data         = data;
        this.inputsModule = inputsModule;
    }

    async set(val: SpatializedInputData): Promise<void>
    {
        this.data = val;
    }

    get(): SpatializedInputData
    {
        return this.data;
    }

    findSourceType()
    {
        let source = this.inputsModule.findInputForId(this.data.inputid);

        if (source)
            return ensurePortTypeEnum(source.get().type);
        else {
            log.error('Could not find input source for input ' + this.data.id
                      + ' input: ' + this.data.inputid);
            return PortTypes.Mono;
        }
    }

    findSourceChannel()
    {
        let source = this.inputsModule.findInputForId(this.data.inputid);

        if (source)
            return source.get().channel;
        else {
            log.error('Could not find input source for input ' + this.data.id
                      + ' input: ' + this.data.inputid);
            return 0;
        }
    }

    params(): SourceParameterSet
    {
        return {
            a : this.data.azm,
            e : this.data.elv,
            height : this.data.height,
            width : this.data.width
        };
    }

    isInRoom()
    {
        return this.data.room && this.data.room.length;
    }
}

class UserList extends ManagedNodeStateListRegister {

    _man: NodeUsersManager;

    constructor(manager: NodeUsersManager)
    {
        super();
    }

    async remove(obj: ManagedNodeStateObject<any>)
    {
    }

    async insert(obj: any): Promise<User>
    {
        return new User(obj, this._man);
    }
}

class SpatializedInputsList extends ManagedNodeStateListRegister {

    inputsManager: Inputs.NodeAudioInputManager;

    constructor(inputsModule: Inputs.NodeAudioInputManager)
    {
        super();
        this.inputsManager = inputsModule;
    }

    async remove(obj: ManagedNodeStateObject<any>)
    {
    }

    async insert(data: any)
    {
        return new SpatializedInput(data, this.inputsManager);
    }
}

export class NodeUsersManager extends NodeModule {

    _users: UserList;
    _inputs: SpatializedInputsList;
    _inputs_module: Inputs.NodeAudioInputManager;

    constructor(inputsModule: Inputs.NodeAudioInputManager)
    {
        super(DSPModuleNames.USERS);
        this._inputs_module = inputsModule;
        this._users         = new UserList(this);
        this._inputs        = new SpatializedInputsList(inputsModule);
        this.add(this._users, 'users');
        this.add(this._inputs, 'inputs');
    }

    addUser(userdata: UserData)
    {
        this._users.add(new User(userdata, this));
        this._users.save();
        this.updateWebInterfaces();
    }

    modifyUser(userdata: UserData)
    {
        let user = this.findUserForId(userdata.id);
        if (user) {
            user.set(userdata).then(() => {
                user.save();
            });
        }
    }

    removeUser(userid: string)
    {
        let obj
            = this._users._objects.find((obj: User) => obj.get().id === userid);
        if (obj) {
            let userdata       = <UserData>obj.get();
            let inputs_changed = false;
            userdata.inputs.forEach((input) => {
                let inp = this._inputs._objects.find(
                    (obj: SpatializedInput) => obj.get().id === input);
                if (inp) {
                    this._inputs.removeItem(inp);
                    inputs_changed = true;
                }
            });
            this._users.removeItem(obj);
            this._users.save();

            if (inputs_changed)
                this._inputs.save();

            this.updateWebInterfaces();
        }
    }

    addInputToUser(userid: string, input: Inputs.NodeAudioInput)
    {
        let user = this.findUserForId(userid);
        if (user == null)
            throw 'User not found';

        if (this.findUserInput(userid, input.get().id))
            throw 'Input already assigned';

        let newinput = basicSpatializedInput(
            input.get().id, userid, ensurePortTypeEnum(input.get().type));

        let userdata = user.get();

        if (userdata.room != null)
            newinput.room = userdata.room;

        userdata.inputs.push(newinput.id);
        user.set(userdata);
        user.save();

        let newinputobj = new SpatializedInput(newinput, this._inputs_module);
        this._inputs.add(newinputobj);
        newinputobj.save();
    }

    removeInputFromUser(userid: string, input: SpatializedInputData)
    {
        let sinput   = this.findUserInput(userid, input.inputid);
        let user     = this.findUserForId(userid);
        let userdata = user.get();

        let iidx = userdata.inputs.findIndex(uinp => uinp == input.id);

        if (iidx != -1) {
            userdata.inputs.splice(iidx, 1);
            user.set(userdata);
            user.save();
        }

        this._inputs.removeItem(sinput);
        this._inputs.save();
        this.updateWebInterfaces();
        this.publishUserInputs(userid);
    }

    modifyUserInput(userid: string, input: SpatializedInputData,
                    recompile?: boolean)
    {
        let inp = this.findInputById(input.id);
        if (inp) {
            inp.set(input).then(() => {
                inp.save();
            })
        }
    }

    joined(socket: SocketIO.Socket, topic: string)
    {
        if (topic == 'users')
            socket.emit(
                'node.users.update', this.myNodeId(), this.listRawUsersData());
        else if (topic.startsWith('userinputs-')) {
            let userid = topic.slice(11);
            try {
                let inputs = this.getUsersInputs(userid);
                socket.emit('user.inputs.update', userid,
                            inputs.map(input => input.get()));
            }
            catch (err) {
                this._server._webif.error(err);
            }
        }
    }

    left(socket: SocketIO.Socket, topic: string)
    {
    }

    init()
    {
    }

    updateWebInterfaces()
    {
        this.publish('users', 'node.users.update', this.myNodeId(),
                     this.listRawUsersData());
    }

    publishUserInputs(userid: string)
    {
        try {
            this.publish(`userinputs-${userid}`, 'user.inputs.update', userid,
                         this.getUsersInputs(userid).map(inp => inp.get()));
        }
        catch (err) {
            this.events.emit('webif-node-error', this.myNodeId(), err);
        }
    }

    listRawUsersData()
    {
        return <UserData[]>this._users._object_iter().map(obj => obj.get());
    }

    listUsers()
    {
        return <User[]>this._users._objects
    }

    findInputById(id: string)
    {
        return <SpatializedInput>this._inputs._objects.find(
            (obj: SpatializedInput) => obj.get().id === id);
    }

    findUserInput(userid: string, inputid: string)
    {
        return <SpatializedInput>this._inputs._objects.find(
            (obj: SpatializedInput) => obj.get().inputid === inputid
                                       && obj.get().userid === userid);
    }

    findUserForId(id: string)
    {
        return <User>this._users._objects.find((obj: User) => obj.get().id
                                                              === id);
    }

    start(remote: Connection)
    {
        this.save().catch(err => {
            log.error('Could write data to node ' + err);
        });
    }
    destroy()
    {
    }

    getUsersInputs(userid: string)
    {
        let user = this._users._objects.find(
            (obj: ManagedNodeStateObject<UserData>) => obj.get().id == userid);

        if (user == null)
            throw 'User not found';

        let userdata                   = <UserData>user.get();
        let inputs: SpatializedInput[] = [];

        userdata.inputs.forEach(input => {
            let ip = <SpatializedInput>this._inputs._objects.find(
                (inp: SpatializedInput) => inp.get().id === input);
            if (ip)
                inputs.push(ip);
        });

        return inputs;
    }
}

export class UsersManager extends ServerModule {

    constructor()
    {
        super('users');
    }

    joined(socket: SocketIO.Socket, topic: string)
    {
        log.verbose(`Socket joined user-topic ${topic}`);
        let topicarr = topic.split('.');
        switch (topicarr[0]) {
            default: this._join_userspecific(socket, topicarr[0], topicarr[1]);
        }
    }

    left(socket: SocketIO.Socket, topic: string)
    {
    }

    _join_userspecific(socket: SocketIO.Socket, userid: string, topic: string)
    {
        switch (topic) {
            case 'userinputs':
                this._join_userinputs(socket, userid);
        }
    }

    _join_userinputs(socket: SocketIO.Socket, userid: string)
    {
        let node = this.findNodeForUser(userid);
        if(node == null)
            return log.error(`Node with user ${userid} not found`);
     
        let user = node.users.findUserForId(userid)
        if(user == null)
            return log.error(`User ${userid} not found`);

        let inputs = node.users.getUsersInputs(userid);
        socket.emit(`${userid}.userinputs`, node.inputs.getRawInputDescriptionList(), inputs.map(input => input.get()));
    }

    findNodeForUser(userid: string): DSPNode
    {
        return <DSPNode> this.server.nodes()
            .filter(node => node.type() == NODE_TYPE.DSP_NODE)
            .find((dspnode: DSPNode) => dspnode.users.findUserForId(userid)
                                        != null);
    }

    init()
    {
        this.handleWebInterfaceEvent(
            'add.user',
            (socket: SocketIO.Socket, node: DSPNode, data: UserData) => {
                if (data.channel != null) {
                    node.users.addUser(data);
                }
                else
                    this.webif.broadcastWarning(
                        node.name(), 'Could not add user: Missing data');
            });

        this.handleWebInterfaceEvent(
            'user.add.inputs', (socket: SocketIO.Socket, node: DSPNode,
                                data: UserAddInputsMessage) => {
                data.inputs.forEach(input => {
                    let nodein = node.inputs.findInputForId(input.id);
                    if (nodein) {
                        let user = node.users.findUserForId(data.userid);
                        if (user)
                            node.users.addInputToUser(user.get().id, nodein);
                        else
                            this.webif.error(`User ${data.userid} not found`);
                    }
                    else
                        this.webif.error(`Input ${input.name} not found`);
                });
                node.users.publishUserInputs(data.userid);
                node.users.updateWebInterfaces();
            });

        this.handleWebInterfaceEvent(
            'user.delete.input', (socket: SocketIO.Socket, node: DSPNode,
                                  data: UserDeleteInputMessage) => {
                node.users.removeInputFromUser(data.userid, data.input);
            });

        this.handleWebInterfaceEvent(
            'user.modify.input', (socket: SocketIO.Socket, node: DSPNode,
                                  data: UserModifyInputMessage) => {
                node.users.modifyUserInput(
                    data.userid, data.input, data.recompile);
            });

        this.handleWebInterfaceEvent(
            'user.input.azm', (socket: SocketIO.Socket, node: DSPNode,
                               data: UserPanInputMessage) => {
                log.debug('Move ' + data.value);
                this.emitToModule(node.id(), DSPModuleNames.GRAPH_BUILDER,
                                  GraphBuilderInputEvents.AZM, data.userid,
                                  data.spid, data.value);
            });

        this.handleWebInterfaceEvent(
            'user.input.elv', (socket: SocketIO.Socket, node: DSPNode,
                               data: UserPanInputMessage) => {
                this.emitToModule(node.id(), DSPModuleNames.GRAPH_BUILDER,
                                  GraphBuilderInputEvents.ELV, data.userid,
                                  data.spid, data.value);
            });

        this.handleWebInterfaceEvent(
            'user.headtracker', (socket: SocketIO.Socket, node: DSPNode,
                                 data: UserAssignHeadtrackerMessage) => {
                this.emitToModule(node.id(), DSPModuleNames.GRAPH_BUILDER,
                                  GraphBuilderInputEvents.ASSIGN_HEADTRACKER,
                                  data.userid, data.headtrackerid);
            });

        this.handleWebInterfaceEvent(
            'user.modify',
            (socket: SocketIO.Socket, node: DSPNode, data: UserData) => {
                node.users.modifyUser(data);
            });

        this.handleGlobalWebInterfaceEvent('setgain', (socket: SocketIO.Socket, data: UserInputGainChangeMessage) => {
            let node = this.findNodeForUser(data.user);
            if(node)
                this.emitToModule(node.id(), DSPModuleNames.GRAPH_BUILDER, GraphBuilderInputEvents.SET_GAIN, data.user, data.id, data.gain);
            else
                log.error("Could not find node for user " + data.user);
        });

        this.handleGlobalWebInterfaceEvent('changegain', (socket: SocketIO.Socket, data: UserInputGainChangeMessage) => {
            let node = this.findNodeForUser(data.user);
            if(node){
                let input = node.users.findInputById(data.id);
                let idata = input.get();
                idata.gain = data.gain;
                input.set(idata).then(() => input.save()).catch(err => { log.error(`Could not set new gain: ${err}`) });

            }
            else
                log.error("Could not find node for user " + data.user);
        });
    }
}