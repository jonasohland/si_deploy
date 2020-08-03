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
const communication_1 = require("./communication");
const core_1 = require("./core");
const dsp_defs_1 = require("./dsp_defs");
const dsp_graph_builder_1 = require("./dsp_graph_builder");
const dsp_node_1 = require("./dsp_node");
const Logger = __importStar(require("./log"));
const users_defs_1 = require("./users_defs");
const util_1 = require("./util");
const log = Logger.get('USERSM');
class User extends core_1.ManagedNodeStateObject {
    constructor(data, manager) {
        super();
        this.data = data;
        this._man = manager;
    }
    set(val) {
        return __awaiter(this, void 0, void 0, function* () {
            this.data = val;
        });
    }
    get() {
        return this.data;
    }
    inputs() {
        return this._man.getUsersInputs(this.data.id);
    }
}
exports.User = User;
class SpatializedInput extends core_1.ManagedNodeStateObject {
    constructor(data, inputsModule) {
        super();
        this.data = data;
        this.inputsModule = inputsModule;
    }
    set(val) {
        return __awaiter(this, void 0, void 0, function* () {
            this.data = val;
        });
    }
    get() {
        return this.data;
    }
    findSourceType() {
        let source = this.inputsModule.findInputForId(this.data.inputid);
        if (source)
            return util_1.ensurePortTypeEnum(source.get().type);
        else {
            log.error('Could not find input source for input ' + this.data.id
                + ' input: ' + this.data.inputid);
            return dsp_defs_1.PortTypes.Mono;
        }
    }
    findSourceChannel() {
        let source = this.inputsModule.findInputForId(this.data.inputid);
        if (source)
            return source.get().channel;
        else {
            log.error('Could not find input source for input ' + this.data.id
                + ' input: ' + this.data.inputid);
            return 0;
        }
    }
    params() {
        return {
            a: this.data.azm,
            e: this.data.elv,
            height: this.data.height,
            width: this.data.width
        };
    }
    isInRoom() {
        return this.data.room && this.data.room.length;
    }
}
exports.SpatializedInput = SpatializedInput;
class UserList extends core_1.ManagedNodeStateListRegister {
    constructor(manager) {
        super();
    }
    remove(obj) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    insert(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            return new User(obj, this._man);
        });
    }
}
class SpatializedInputsList extends core_1.ManagedNodeStateListRegister {
    constructor(inputsModule) {
        super();
        this.inputsManager = inputsModule;
    }
    remove(obj) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    insert(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return new SpatializedInput(data, this.inputsManager);
        });
    }
}
class NodeUsersManager extends core_1.NodeModule {
    constructor(inputsModule) {
        super(dsp_node_1.DSPModuleNames.USERS);
        this._inputs_module = inputsModule;
        this._users = new UserList(this);
        this._inputs = new SpatializedInputsList(inputsModule);
        this.add(this._users, 'users');
        this.add(this._inputs, 'inputs');
    }
    addUser(userdata) {
        this._users.add(new User(userdata, this));
        this._users.save();
        this.updateWebInterfaces();
    }
    modifyUser(userdata) {
        let user = this.findUserForId(userdata.id);
        if (user) {
            user.set(userdata).then(() => {
                user.save();
            });
        }
    }
    removeUser(userid) {
        let obj = this._users._objects.find((obj) => obj.get().id === userid);
        if (obj) {
            let userdata = obj.get();
            let inputs_changed = false;
            userdata.inputs.forEach((input) => {
                let inp = this._inputs._objects.find((obj) => obj.get().id === input);
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
    addInputToUser(userid, input) {
        let user = this.findUserForId(userid);
        if (user == null)
            throw 'User not found';
        if (this.findUserInput(userid, input.get().id))
            throw 'Input already assigned';
        let newinput = users_defs_1.basicSpatializedInput(input.get().id, userid, util_1.ensurePortTypeEnum(input.get().type));
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
    removeInputFromUser(userid, input) {
        let sinput = this.findUserInput(userid, input.inputid);
        let user = this.findUserForId(userid);
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
    modifyUserInput(userid, input, recompile) {
        let inp = this.findInputById(input.id);
        if (inp) {
            inp.set(input).then(() => {
                inp.save();
            });
        }
    }
    joined(socket, topic) {
        if (topic == 'users')
            socket.emit('node.users.update', this.myNodeId(), this.listRawUsersData());
        else if (topic.startsWith('userinputs-')) {
            let userid = topic.slice(11);
            try {
                let inputs = this.getUsersInputs(userid);
                socket.emit('user.inputs.update', userid, inputs.map(input => input.get()));
            }
            catch (err) {
                this._server._webif.error(err);
            }
        }
    }
    left(socket, topic) {
    }
    init() {
    }
    updateWebInterfaces() {
        this.publish('users', 'node.users.update', this.myNodeId(), this.listRawUsersData());
    }
    publishUserInputs(userid) {
        try {
            this.publish(`userinputs-${userid}`, 'user.inputs.update', userid, this.getUsersInputs(userid).map(inp => inp.get()));
        }
        catch (err) {
            this.events.emit('webif-node-error', this.myNodeId(), err);
        }
    }
    listRawUsersData() {
        return this._users._object_iter().map(obj => obj.get());
    }
    listUsers() {
        return this._users._objects;
    }
    findInputById(id) {
        return this._inputs._objects.find((obj) => obj.get().id === id);
    }
    findUserInput(userid, inputid) {
        return this._inputs._objects.find((obj) => obj.get().inputid === inputid
            && obj.get().userid === userid);
    }
    findUserForId(id) {
        return this._users._objects.find((obj) => obj.get().id
            === id);
    }
    start(remote) {
        this.save().catch(err => {
            log.error('Could write data to node ' + err);
        });
    }
    destroy() {
    }
    getUsersInputs(userid) {
        let user = this._users._objects.find((obj) => obj.get().id == userid);
        if (user == null)
            throw 'User not found';
        let userdata = user.get();
        let inputs = [];
        userdata.inputs.forEach(input => {
            let ip = this._inputs._objects.find((inp) => inp.get().id === input);
            if (ip)
                inputs.push(ip);
        });
        return inputs;
    }
}
exports.NodeUsersManager = NodeUsersManager;
class UsersManager extends core_1.ServerModule {
    constructor() {
        super('users');
    }
    joined(socket, topic) {
        log.verbose(`Socket joined user-topic ${topic}`);
        let topicarr = topic.split('.');
        switch (topicarr[0]) {
            default: this._join_userspecific(socket, topicarr[0], topicarr[1]);
        }
    }
    left(socket, topic) {
    }
    _publish_userinput_list(node, userid) {
        let inputs = node.users.getUsersInputs(userid);
        this.publish(`${userid}.userinputs`, `${userid}.userinputs`, node.inputs.getRawInputDescriptionList(), inputs);
    }
    _join_userspecific(socket, userid, topic) {
        switch (topic) {
            case 'userinputs':
                this._join_userinputs(socket, userid);
        }
    }
    _join_userinputs(socket, userid) {
        let node = this.findNodeForUser(userid);
        if (node == null)
            return log.error(`Node with user ${userid} not found`);
        let user = node.users.findUserForId(userid);
        if (user == null)
            return log.error(`User ${userid} not found`);
        let inputs = node.users.getUsersInputs(userid);
        socket.emit(`${userid}.userinputs`, node.inputs.getRawInputDescriptionList(), inputs.map(input => input.get()));
    }
    findNodeForUser(userid) {
        return this.server.nodes()
            .filter(node => node.type() == communication_1.NODE_TYPE.DSP_NODE)
            .find((dspnode) => dspnode.users.findUserForId(userid)
            != null);
    }
    init() {
        this.handleWebInterfaceEvent('add.user', (socket, node, data) => {
            if (data.channel != null) {
                node.users.addUser(data);
            }
            else
                this.webif.broadcastWarning(node.name(), 'Could not add user: Missing data');
        });
        this.handleWebInterfaceEvent('user.add.inputs', (socket, node, data) => {
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
            this._publish_userinput_list(node, data.userid);
            node.users.updateWebInterfaces();
        });
        this.handleWebInterfaceEvent('user.delete.input', (socket, node, data) => {
            node.users.removeInputFromUser(data.userid, data.input);
            this._publish_userinput_list(node, data.userid);
        });
        this.handleWebInterfaceEvent('user.modify.input', (socket, node, data) => {
            node.users.modifyUserInput(data.userid, data.input, data.recompile);
        });
        this.handleWebInterfaceEvent('user.input.azm', (socket, node, data) => {
            log.debug('Move ' + data.value);
            this.emitToModule(node.id(), dsp_node_1.DSPModuleNames.GRAPH_BUILDER, dsp_graph_builder_1.GraphBuilderInputEvents.AZM, data.userid, data.spid, data.value);
        });
        this.handleWebInterfaceEvent('user.input.elv', (socket, node, data) => {
            this.emitToModule(node.id(), dsp_node_1.DSPModuleNames.GRAPH_BUILDER, dsp_graph_builder_1.GraphBuilderInputEvents.ELV, data.userid, data.spid, data.value);
        });
        this.handleWebInterfaceEvent('user.headtracker', (socket, node, data) => {
            this.emitToModule(node.id(), dsp_node_1.DSPModuleNames.GRAPH_BUILDER, dsp_graph_builder_1.GraphBuilderInputEvents.ASSIGN_HEADTRACKER, data.userid, data.headtrackerid);
        });
        this.handleWebInterfaceEvent('user.modify', (socket, node, data) => {
            node.users.modifyUser(data);
        });
        this.handleGlobalWebInterfaceEvent('setgain', (socket, data) => {
            let node = this.findNodeForUser(data.user);
            if (node)
                this.emitToModule(node.id(), dsp_node_1.DSPModuleNames.GRAPH_BUILDER, dsp_graph_builder_1.GraphBuilderInputEvents.SET_GAIN, data.user, data.id, data.gain);
            else
                log.error("Could not find node for user " + data.user);
        });
        this.handleGlobalWebInterfaceEvent('changegain', (socket, data) => {
            let node = this.findNodeForUser(data.user);
            if (node) {
                let input = node.users.findInputById(data.id);
                let idata = input.get();
                idata.gain = data.gain;
                input.set(idata).then(() => input.save()).catch(err => { log.error(`Could not set new gain: ${err}`); });
            }
            else
                log.error("Could not find node for user " + data.user);
        });
    }
}
exports.UsersManager = UsersManager;
//# sourceMappingURL=users.js.map