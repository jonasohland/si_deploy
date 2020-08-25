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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const eventemitter2_1 = require("eventemitter2");
const fs = __importStar(require("fs"));
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
const uuid_1 = require("uuid");
const communication_1 = require("./communication");
const files_1 = require("./files");
const Logger = __importStar(require("./log"));
const util_1 = require("./util");
const log = Logger.get('NSTATE');
var StateUpdateStrategy;
(function (StateUpdateStrategy) {
    /**
     * Overwrites everything and removes everything not present in incoming
     * data
     */
    StateUpdateStrategy[StateUpdateStrategy["OVERWRITE"] = 0] = "OVERWRITE";
    /**
     * Updates existing references and removes everything not present in
     * incoming data
     */
    StateUpdateStrategy[StateUpdateStrategy["SYNC"] = 1] = "SYNC";
    /** Updates existing references and does not remove anything */
    StateUpdateStrategy[StateUpdateStrategy["MERGE"] = 2] = "MERGE";
    /** Only update existing references */
    StateUpdateStrategy[StateUpdateStrategy["PICK"] = 3] = "PICK";
})(StateUpdateStrategy = exports.StateUpdateStrategy || (exports.StateUpdateStrategy = {}));
class ManagedNodeStateObject {
    init(parent) {
        this._oid = uuid_1.v4();
        this._uid = uuid_1.v4();
        this._parent = parent;
    }
    _export() {
        return {
            object_id: this._oid, name: this._name, uid: this._uid,
            data: this.get()
        };
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._parent._save_child(this);
        });
    }
    _map() {
        return { oid: this._oid, uid: this._uid, name: this._name };
    }
    modify() {
        this._dirty = true;
        this._uid = uuid_1.v4();
    }
    _clear() {
        this._dirty = false;
    }
}
exports.ManagedNodeStateObject = ManagedNodeStateObject;
class ManagedNodeStateRegister {
    init(name, parent) {
        this._name = name;
        this._uid = uuid_1.v4();
        this._parent = parent;
    }
    _wrap_set(data, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            obj._uid = data.uid;
            return obj.set(data.data);
        });
    }
    _object_iter() {
        if (this._is_map) {
            let self = this;
            return Object.keys(self._objects).map(key => self._objects[key]);
        }
        else {
            let self = this;
            return self._objects;
        }
    }
    _export() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._is_map) {
                let objects = {};
                for (let object of this._object_iter())
                    objects[object._name] = yield object._export();
                return {
                    name: this._name,
                    uid: this._uid,
                    map: this._is_map,
                    objects
                };
            }
            else {
                return {
                    name: this._name,
                    uid: this._uid,
                    map: this._is_map,
                    objects: yield Promise.all(this._object_iter().map(obj => obj._export()))
                };
            }
        });
    }
    _map() {
        return {
            uid: this._uid,
            name: this._name,
            map: this._is_map,
            objects: this._object_iter().map(o => o._map())
        };
    }
    modify() {
        this._dirty = true;
        this._uid = uuid_1.v4();
    }
    _clear() {
        this._dirty = false;
    }
    _save_child(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._parent._save_child(this, obj);
        });
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._parent._save_child(this);
        });
    }
    _restore(s, strategy) {
        return __awaiter(this, void 0, void 0, function* () {
            log.debug('Restoring data for register ' + this._name);
            if (this._is_map) {
                let self = this;
                return self._restore_map(s, strategy);
            }
            else {
                let self = this;
                return self._update_list(s, strategy);
            }
        });
    }
    applyObjectData(obj, name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._is_map) {
                let self = this;
                let local_obj = self._objects[name];
            }
        });
    }
}
exports.ManagedNodeStateRegister = ManagedNodeStateRegister;
class ManagedNodeStateMapRegister extends ManagedNodeStateRegister {
    constructor() {
        super();
        this._objects = {};
        this._is_map = true;
    }
    _wrap_insert(name, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            let ob = yield this.insert(name, obj.data);
            ob._parent = this;
            ob._uid = obj.uid;
            ob._oid = obj.object_id;
            ob._name = obj.name;
            return ob;
        });
    }
    contains(name) {
        return this._objects[name] != null;
    }
    removeObject(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._wrap_remove(name, null);
        });
    }
    _wrap_remove(name, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.contains(name)) {
                log.debug(`Removing object [${this._objects[name].constructor}] ${name} from
                ${this._name}`);
                delete this._objects[name];
                return this.remove(name, obj);
            }
            else
                throw new Error(`Could not remove ${name}: Object not found`);
        });
    }
    insertExt(name, data) {
        return __awaiter(this, void 0, void 0, function* () {
            this._objects[name] = yield this._wrap_insert(name, data);
        });
    }
    _restore_map(s, strategy) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!s.map)
                throw 'Did not expect list data in register ' + this._name;
            log.debug('Updating map data in register ' + this._name
                + ' with strategy ' + StateUpdateStrategy[strategy]);
            let data = s;
            if (strategy == StateUpdateStrategy.OVERWRITE) {
                // remove everything
                yield Promise.all(this._object_iter().map(ob => {
                    log.debug(`Removing object [${ob.constructor.name}] ${ob._oid} from ${this._name} (OVWRT)`);
                    return this._wrap_remove(ob._name, ob);
                }));
                // add everything
                for (let key of Object.keys(data.objects)) {
                    log.debug(`Insert new object [${key}] in ${this._name}`);
                    this._objects[key]
                        = yield this._wrap_insert(key, data.objects[key]);
                }
            }
            else {
                if (strategy == StateUpdateStrategy.SYNC
                    || strategy == StateUpdateStrategy.PICK) {
                    // remove objects from register that are not present in the
                    // update
                    for (let key of Object.keys(this._objects)) {
                        if (data.objects[key] == undefined) {
                            log.debug(`Removing object [${this._objects[key].constructor.name}] ${this._objects[key]._name} from ${this._name} because it is not in the incoming list`);
                            yield this._wrap_remove(key, this._objects[key]);
                        }
                    }
                }
                log.debug('Merging data in map register ' + this._name);
                // objects to update go here
                let updates = [];
                // update objects that with same name and different uids
                for (let key of Object.keys(data.objects)) {
                    if (this._objects[key]
                        && (this._objects[key]._uid != data.objects[key].uid)) {
                        log.debug(`Updating object [${this._objects[key].constructor.name}] ${key} in ${this._name}`);
                        updates.push([data.objects[key], this._objects[key]]);
                    }
                }
                // update all objects asynchronously
                yield Promise.all(updates.map(up => this._wrap_set(up[0], up[1])));
                let newobjects = [];
                if (strategy != StateUpdateStrategy.PICK) {
                    // find all incoming objects that are not present in the
                    // register
                    for (let key of Object.keys(data.objects)) {
                        if (this._objects[key] == null) {
                            log.info(`Adding new object ${key} to ${this._name}`);
                            newobjects.push([key, data.objects[key]]);
                        }
                    }
                    // insert new objects asynchronously
                    yield Promise.all(newobjects.map((ob) => __awaiter(this, void 0, void 0, function* () {
                        return this._objects[ob[0]]
                            = yield this._wrap_insert(ob[0], ob[1]);
                    })));
                }
            }
        });
    }
    add(name, obj) {
        obj.init(this);
        obj._name = name;
        this._objects[name] = obj;
    }
}
exports.ManagedNodeStateMapRegister = ManagedNodeStateMapRegister;
class Publisher {
    constructor() {
    }
    _pub_init(server) {
    }
}
exports.Publisher = Publisher;
class ManagedNodeStateListRegister extends ManagedNodeStateRegister {
    constructor() {
        super();
        this._objects = [];
        this._is_map = false;
    }
    _wrap_insert(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            let nobj = yield this.insert(obj.data);
            nobj._uid = obj.uid;
            nobj._oid = obj.object_id;
            nobj._parent = this;
            log.debug(`Inserting new object [${nobj.constructor.name}] ${nobj._oid} to ${this._name}`);
            return nobj;
        });
    }
    insertExt(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this._objects.push(yield this._wrap_insert(data));
        });
    }
    _update_list(s, strategy) {
        return __awaiter(this, void 0, void 0, function* () {
            if (s.map)
                throw 'Did not expect map data in register ' + this._name;
            log.debug('Updating list data in register ' + this._name
                + ' with strategy ' + StateUpdateStrategy[strategy]);
            let data = s;
            if (strategy == StateUpdateStrategy.OVERWRITE) {
                yield Promise.all(this._objects.map(ob => {
                    log.debug(`Removing object [${ob.constructor.name}] ${ob._oid} from ${this._name}`);
                    this.remove(ob);
                }));
                this._objects = yield Promise.all(data.objects.map(d => this._wrap_insert(d)));
            }
            else {
                if (strategy == StateUpdateStrategy.SYNC
                    || strategy == StateUpdateStrategy.PICK) {
                    // remove objects from register that are not present in the
                    // update
                    this._objects = this._objects.filter(obj => {
                        if (data.objects.findIndex(nob => nob.object_id == obj._oid)
                            == -1) {
                            log.debug(`Removing object [${obj.constructor.name}] ${obj._oid} from ${this._name}`);
                            return false;
                        }
                        else
                            return true;
                    });
                }
                log.debug('Merging data in list register ' + this._name);
                // objects tp update go here
                let updates = [];
                for (let obj of data.objects) {
                    // find incoming objects in register
                    let tidx = this._objects.findIndex(lobj => lobj._oid
                        == obj.object_id);
                    // we found our object
                    if (tidx != -1 && obj.uid != this._objects[tidx]._uid) {
                        log.debug(`update object ${obj.object_id} ${this._objects[tidx].constructor.name}`);
                        // add to objects to update
                        updates.push([obj, this._objects[tidx]]);
                    }
                }
                // update all objects asynchronously
                yield Promise.all(updates.map(up => this._wrap_set(up[0], up[1])));
                if (strategy != StateUpdateStrategy.PICK) {
                    // find all incoming objects that are not present in the
                    // register
                    let new_objects = data.objects.filter(ob => this._objects.findIndex(pob => pob._oid
                        == ob.object_id)
                        == -1);
                    // insert new objects asynchronously
                    return Promise.all(new_objects.map((obj) => __awaiter(this, void 0, void 0, function* () {
                        this._objects.push(yield this._wrap_insert(obj));
                    })));
                }
            }
        });
    }
    removeItem(item) {
        let itemIndex = this._objects.indexOf(item);
        if (itemIndex != -1) {
            this._objects.splice(itemIndex, 1);
            return true;
        }
        else
            return false;
    }
    add(obj) {
        log.debug(`Insert new object [${obj.constructor.name}] into list`);
        obj.init(this);
        this._objects.push(obj);
    }
}
exports.ManagedNodeStateListRegister = ManagedNodeStateListRegister;
class NodeModule extends Publisher {
    constructor(target) {
        super();
        this._registers = {};
        this._name = target;
        this._uid = uuid_1.v4();
    }
    publish(topic, event, ...data) {
        this._server._do_publish_node(this.myNodeId(), this._name, topic, event, ...data);
    }
    hasSubs(topic) {
        return this._server._check_node_has_subscribers(this.myNodeId(), this._name, topic);
    }
    _init(parent, server) {
        this._parent = parent;
        this._server = server;
        this.events = this._parent.events;
        this._pub_init(server);
        this.init();
    }
    _start(remote) {
        this.start(remote);
    }
    modify() {
        this._dirty = true;
        this._uid = uuid_1.v4();
    }
    _export() {
        return __awaiter(this, void 0, void 0, function* () {
            let regkeys = Object.keys(this._registers);
            let out = [];
            for (let reg of regkeys)
                out.push(yield this._registers[reg]._export());
            return {
                uid: this._uid,
                name: this._name,
                raw: this._data,
                registers: out
            };
        });
    }
    _save_child(reg, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._parent._save_child(this, reg, obj);
        });
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._parent._save_child(this);
        });
    }
    _clear() {
        this._dirty = false;
    }
    _map() {
        let regs = [];
        let reg_keys = Object.keys(this._registers);
        for (let reg of reg_keys)
            regs.push(this._registers[reg]._map());
        return { uid: this._uid, name: this._name, registers: regs };
    }
    add(reg, name) {
        reg.init(name, this);
        this._registers[reg._name] = reg;
    }
    isInitialized() {
        return Boolean(this._parent);
    }
    myNode() {
        return this._parent;
    }
    myNodeId() {
        let node = this.myNode();
        if (node)
            return node.id();
        else
            throw new Error("Node module not initialized");
    }
    _restore(state, strategy = StateUpdateStrategy.SYNC) {
        return __awaiter(this, void 0, void 0, function* () {
            log.debug('Restoring data for module ' + this._name);
            return Promise.all(state.registers.map(reg => this._registers[reg.name]._restore(reg, strategy)));
        });
    }
    applyModuleData(mod) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._restore(mod, StateUpdateStrategy.SYNC);
        });
    }
    applyRegisterData(name, reg) {
        return __awaiter(this, void 0, void 0, function* () {
            let lreg = this._registers[name];
            if (lreg)
                lreg._restore(reg, StateUpdateStrategy.SYNC);
        });
    }
    applyObjectData(regname, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            let lreg = this._registers[regname];
        });
    }
    emitToModule(module, event, ...data) {
        this.events.emit(`${this.myNodeId()}.${module}.${event}`, ...data);
    }
    emitToNode(event, ...data) {
        this.events.emit(`${this.myNodeId()}.${event}`, ...data);
    }
    handleNodeEvent(event, handler) {
        this.events.on(`${this.myNodeId()}.${event}`, handler);
    }
    handleModuleEvent(event, handler) {
        this.events.on(`${this.myNodeId()}.${this._name}.${event}`, handler);
    }
}
exports.NodeModule = NodeModule;
class NodeDataStorage extends communication_1.NodeMessageInterceptor {
    constructor(config, options, type) {
        super();
        this._modules = {};
        this._saving = false;
        this._save_again = false;
        this._local_file = files_1.configFileDir('nodestate/')
            + sanitize_filename_1.default(config.node_name || 'default_node')
            + '.' + communication_1.NODE_TYPE[type]
            + '.json';
        if (!fs.existsSync(files_1.configFileDir('nodestate')))
            fs.mkdirSync(files_1.configFileDir('nodestate'));
        if (options.reset) {
            if (fs.existsSync(this._local_file))
                fs.unlinkSync(this._local_file);
        }
        if (!fs.existsSync(this._local_file)) {
            fs.writeFileSync(this._local_file, JSON.stringify({ modules: {} }));
        }
        else {
            this.restoreStateFromFile().then((data) => {
                this._modules = data.modules;
                log.info('Restored state from file');
                this.saveLater();
            });
        }
    }
    restoreStateFromFile() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                fs.readFile(this._local_file, (err, data) => {
                    if (err)
                        reject(err);
                    resolve(JSON.parse(data.toString()));
                });
            });
        });
    }
    writeState() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                fs.writeFile(this._local_file, JSON.stringify({ modules: this._modules }, null, 2), err => {
                    if (err)
                        log.error(err);
                    resolve();
                });
            });
        });
    }
    saveLater() {
        if (this._save_timeout)
            clearTimeout(this._save_timeout);
        if (this._saving)
            return this._save_again = true;
        this._save_timeout = setTimeout(() => {
            log.info('Saving current state to disk');
            this.writeState()
                .then(() => {
                if (this._save_again) {
                    this._save_again = false;
                    this.saveLater();
                }
                this._saving = false;
            })
                .catch(err => {
                log.error('Could not save file ' + err);
            });
            this._saving = true;
        }, 5000);
    }
    target() {
        return 'state-manager';
    }
    handleMessage(msg, from_ipc) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (msg.field) {
                case 'update-object':
                    return this.updateObject(msg.data);
                case 'update-register':
                    return this.updateRegister(msg.data);
                case 'update-module':
                    return this.updateModule(msg.data);
                case 'get': return this.get(msg.data);
            }
        });
    }
    updateObject(msg) {
        log.verbose(`Update object ${msg.module} -> ${msg.register} -> ${msg.data.object_id}`);
        if (this._modules[msg.module]) {
            let mod = this._modules[msg.module];
            let regidx = mod.registers.findIndex(reg => reg.name == msg.register);
            if (regidx != -1) {
                let reg = mod.registers[regidx];
                if (reg.map) {
                    if (reg
                        .objects[msg.data.name] == null) {
                        reg
                            .objects[msg.data.name] = { data: msg.data.data, object_id: msg.data.object_id, uid: msg.data.uid };
                    }
                    else {
                        let obj = reg
                            .objects[msg.data.name];
                        obj.data = msg.data.data;
                        obj.object_id = msg.data.object_id;
                        obj.uid = msg.data.uid;
                    }
                }
                else {
                    let listreg = reg;
                    let objectidx = listreg.objects.findIndex(obj => obj.object_id == msg.data.object_id);
                    if (objectidx == -1)
                        util_1.ignore(listreg.objects.push(msg.data));
                    else
                        util_1.ignore(listreg.objects[objectidx] = msg.data);
                }
                return this.saveLater();
            }
            else
                throw 'Register not found';
        }
        else
            throw 'Module not found';
    }
    updateRegister(msg) {
        if (this._modules[msg.module]) {
            let mod = this._modules[msg.module];
            let regidx = mod.registers.findIndex(reg => reg.name == msg.data.name);
            if (regidx != -1)
                mod.registers[regidx] = msg.data;
            else
                mod.registers.push(msg.data);
            this.saveLater();
        }
        else
            throw 'Module not found';
    }
    updateModule(msg) {
        this._modules[msg.data.name] = msg.data;
        this.saveLater();
    }
    get(msg) {
        log.info('Comparing internal node data to incoming refs');
        let output = { modules: [], registers: [], objects: [] };
        msg.modules.forEach(mod => this._check_module(output, mod.name, mod.data));
        return output;
    }
    _check_module(out, name, modref) {
        log.debug('Check module ' + name);
        let module = this._modules[name];
        if (module) {
            log.debug('Module found.');
            if (module.uid != modref.uid) {
                log.debug('Module uid has changed. Update full module');
                out.modules.push({ name, module });
            }
            else {
                if (modref.registers) {
                    log.debug('Check registers');
                    modref.registers.forEach(regref => {
                        let reg = module.registers.findIndex(reg => reg.name == regref.name);
                        if (reg != -1) {
                            log.debug('Check register ' + regref.name);
                            this._check_register(out, module.name, module.registers[reg], regref);
                        }
                        else
                            log.warn(`Register ${regref.name} not found`);
                    });
                }
            }
        }
    }
    _check_register(out, mod, register, ref) {
        if (register.uid != ref.uid) {
            log.debug(`Register uid has changed. Update full register`);
            out.registers.push({ mod, register });
        }
        else {
            if (register.map != ref.map)
                throw `Register type mismatch for register ${register.name} in module ${mod}`;
            if (register.map) {
                let map_register = register;
                let keys = Object.keys(map_register.objects);
                for (let key of keys)
                    this._check_object(out, mod, register.name, map_register.objects[key], ref.objects[ref.objects.findIndex(r => r.name == key)]);
            }
            else {
                let list_register = register;
                list_register.objects.forEach(obj => {
                    this._check_object(out, mod, register.name, obj, ref.objects[ref.objects.findIndex(o => o.oid == obj.object_id)]);
                });
            }
        }
    }
    _check_object(out, mod, register_name, local_obj, ref) {
        log.debug(`Check object ${local_obj.object_id}`);
        if (ref) {
            if (ref.uid != local_obj.uid) {
                log.debug(`Update object [${local_obj.object_id}]`);
                out.objects.push({ mod, register_name, object: local_obj, add: false });
            }
        }
        else {
            log.debug(`Add new object [${local_obj.object_id}]`);
            out.objects.push({ mod, register_name, object: local_obj, add: true });
        }
    }
}
exports.NodeDataStorage = NodeDataStorage;
class Node {
    constructor(id) {
        this._modules = {};
        this._id = id;
    }
    _destroy() {
        this.destroy();
        if (this.events)
            this.events.removeAllListeners();
        let keys = Object.keys(this._modules);
        for (let key of keys)
            this._modules[key].destroy();
    }
    _init(remote, node_events, server) {
        return __awaiter(this, void 0, void 0, function* () {
            this.events = node_events;
            this._remote = remote;
            this._state_manager = this._remote.getRequester('state-manager');
            this.init();
            let modnames = Object.keys(this._modules);
            for (let mod of modnames) {
                this._modules[mod]._init(this, server);
            }
            log.info("Reloading data from node " + this.name());
            yield this._reload_data_from_node();
            log.info("Finished loading data from node " + this.name());
            log.info("Start node modules");
            for (let mod of modnames) {
                log.verbose("Start module " + mod);
                this._modules[mod]._start(remote);
            }
            log.info("Node modules started");
            this._start();
        });
    }
    _start() {
        this.start();
    }
    _save_child(mod, reg, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            if (reg) {
                if (obj)
                    return this._state_manager.set('update-object', {
                        module: mod._name,
                        register: reg._name,
                        data: obj._export()
                    });
                else
                    return this._state_manager.set('update-register', {
                        module: mod._name,
                        data: yield reg._export()
                    });
            }
            else {
                return this._state_manager.set('update-module', { data: yield mod._export() });
            }
        });
    }
    _reload_data_from_node() {
        return __awaiter(this, void 0, void 0, function* () {
            let mods = Object.keys(this._modules);
            let msg = { modules: [] };
            for (let mod of mods)
                msg.modules.push({ name: mod, data: this._modules[mod]._map() });
            let res = (yield this._state_manager.request('get', msg))
                .data;
            yield Promise.all(res.modules.map(mod => {
                let local_m = this._modules[mod.name];
                if (local_m)
                    return local_m._restore(mod.module, StateUpdateStrategy.SYNC);
            }));
            yield Promise.all(res.registers.map(reg => {
                let local_m = this._modules[reg.mod];
                if (local_m) {
                    let local_reg = local_m._registers[reg.register.name];
                    if (local_reg)
                        return local_reg._restore(reg.register, StateUpdateStrategy.SYNC);
                }
            }));
            res.objects.forEach((obj) => __awaiter(this, void 0, void 0, function* () {
                let local_m = this._modules[obj.mod];
                if (local_m) {
                    let local_reg = local_m._registers[obj.register_name];
                    if (local_reg) {
                        try {
                            if (local_reg._is_map) {
                                if (typeof obj.name == 'undefined')
                                    return util_1.ignore(log.error('missing name property on incoming object'));
                                let mapreg = local_reg;
                                if (obj.add) {
                                    yield mapreg.insertExt(obj.name, obj.object);
                                }
                                else {
                                    let local_obj = mapreg._objects[obj.name];
                                    if (local_obj)
                                        yield local_obj.set(obj.object);
                                    else
                                        yield mapreg.insertExt(obj.name, obj.object);
                                }
                            }
                            else {
                                let listreg = local_reg;
                                if (obj.add) {
                                    listreg.insertExt(obj.object);
                                }
                                else {
                                    let obj_idx = listreg._objects.findIndex(o => o._oid == obj.object.object_id);
                                    if (obj_idx != -1)
                                        yield listreg._objects[obj_idx].set(obj.object);
                                    else
                                        yield listreg.insertExt(obj.object);
                                }
                            }
                        }
                        catch (err) {
                            log.error(`Failed to restore object [${obj.mod}] [${obj.register_name}] [${obj.object.object_id}] ${obj.name}`);
                        }
                    }
                }
            }));
        });
    }
    name() {
        return this._id.name;
    }
    id() {
        return this._id.id;
    }
    type() {
        return this._id.type;
    }
    remote() {
        if (this.remote)
            return this._remote;
        else
            throw 'Cannot access remote before initialization';
    }
    add(module) {
        this._modules[module._name] = module;
    }
    getModule(name) {
        return this._modules[name];
    }
    emitToModule(module, event, ...data) {
        this.events.emit(`${this.id()}.${module}.${event}`, ...data);
    }
    emitToNode(event, ...data) {
        this.events.emit(`${this.id()}.${event}`, ...data);
    }
}
exports.Node = Node;
class ServerModule extends Publisher {
    constructor(name) {
        super();
        this._name = name;
    }
    _init(srv, webif, events) {
        this.webif = webif;
        this.server = srv;
        this.events = events;
        this._pub_init(this.server);
        this.init();
    }
    publish(topic, event, ...data) {
        this.server._do_publish_server(this._name, topic, event, ...data);
    }
    hasSubs(topic) {
        return this.server._check_server_has_subscribers(this._name, topic);
    }
    getNode(id) {
        return this.server._nds[id];
    }
    handleWebInterfaceEvent(event, handler) {
        this.webif.attachHandler(this, this._name, event, (socket, nodeid, data) => {
            let node = this.server._nds[nodeid];
            if (!node) {
                log.error(`Node not found for message -${this._name}.${event} - node: ${nodeid}`);
                socket.emit('showerror', `Node not found for id ${nodeid}`);
                return;
            }
            log.debug(`Dispatch event: -${this._name}.${event} - ${nodeid}`);
            handler(socket, node, data);
        });
    }
    handleGlobalWebInterfaceEvent(event, handler) {
        this.webif.attachHandler(this, this._name, event, (socket, data) => {
            handler(socket, data);
        });
    }
    emitToModule(node, module, event, ...data) {
        this.events.emit(`${node}.${module}.${event}`, ...data);
    }
    emitToNode(node, event, ...data) {
        this.events.emit(`${node}.${event}`, ...data);
    }
}
exports.ServerModule = ServerModule;
class ServerInternalsModule extends ServerModule {
    joined(socket, topic) {
        socket.emit('server.nodes.' + topic, this.nodeIdList(communication_1.NODE_TYPE[topic]));
    }
    left(socket, topic) {
    }
    nodesChanged(type) {
        this.publish(communication_1.NODE_TYPE[type], 'server.nodes.' + communication_1.NODE_TYPE[type], this.nodeIdList(type));
    }
    nodeIdList(type) {
        return this.server.nodes(type).map(n => n._id);
    }
    allNodeIds() {
        this.server.allNodes().map(n => n.id());
    }
    init() {
    }
    constructor() {
        super('server');
    }
}
exports.ServerInternalsModule = ServerInternalsModule;
class Server {
    constructor(wssrv, webif) {
        this._nds = {};
        this._modules = {};
        this._event_bus = new eventemitter2_1.EventEmitter2({ wildcard: true, delimiter: '.' });
        this._srv = wssrv;
        this._webif = webif;
        this._srv.on('add-session', this._on_add_remote.bind(this));
        this._srv.on('remove-session', this._on_remove_remote.bind(this));
        this._internals = new ServerInternalsModule();
        this.add(this._internals);
        this._event_bus.onAny((eventname) => {
            log.debug(`Server event [${eventname}]`);
        });
    }
    add(module) {
        this._modules[module._name] = module;
        module._init(this, this._webif, this._event_bus);
    }
    emitToNodeModule(node, module, event, ...data) {
        this._event_bus.emit(`${node}.${module}.${event}`, ...data);
    }
    emitToNode(node, event, ...data) {
        this._event_bus.emit(`${node}.${event}`, ...data);
    }
    nodes(type) {
        let nodeids = Object.keys(this._nds);
        let out = [];
        for (let id of nodeids) {
            if (this._nds[id].type() == type)
                out.push(this._nds[id]);
        }
        return out;
    }
    allNodes() {
        let nodeids = Object.keys(this._nds);
        let out = [];
        for (let id of nodeids)
            out.push(this._nds[id]);
        return out;
    }
    _on_add_remote(session) {
        log.info(`Create new node instance for [${communication_1.NODE_TYPE[session.id().type]}] ${session.id().name}`);
        let node = this.createNode(session.id());
        node._init(session, this._event_bus, this).then(() => {
            this._nds[node.id()] = node;
            this._internals.nodesChanged(session.id().type);
        });
    }
    _on_remove_remote(session) {
        let node = this._nds[session.id().id];
        if (node) {
            log.info(`Destroy node instance for [${communication_1.NODE_TYPE[session.id().type]}] ${session.id().name}`);
            node._destroy();
            this.destroyNode(node);
            delete this._nds[session.id().id];
            this._internals.nodesChanged(session.id().type);
        }
    }
    _check_server_has_subscribers(module, topic) {
        return this._webif.checkServerHasSubscribers(module, topic);
    }
    _check_node_has_subscribers(nodeid, module, topic) {
        return this._webif.checkNodeHasSubscribers(nodeid, module, topic);
    }
    _do_publish_server(module, topic, event, ...data) {
        this._webif.doPublishServer(module, topic, event, ...data);
    }
    _do_publish_node(nodeid, module, topic, event, ...data) {
        this._webif.doPublishNode(nodeid, module, topic, event, ...data);
    }
    _notify_join_server_room(socket, module, topic) {
        if (this._modules[module])
            this._modules[module].joined(socket, topic);
        else
            log.warn(`Server module '${module}' not found. Could not deliver join notification`);
    }
    _notify_join_node_room(socket, nodeid, module, topic) {
        if (this._nds[nodeid]) {
            if (this._nds[nodeid]._modules[module])
                this._nds[nodeid]._modules[module].joined(socket, topic);
            else
                log.warn(`Node module '${module}' not found. Could not deliver join notification`);
        }
        else
            log.warn(`Node ${nodeid} not found. Could not deliver join notification`);
    }
    _notify_leave_server_room(socket, module, topic) {
        if (this._modules[module])
            this._modules[module].left(socket, topic);
        else
            log.warn(`Server module '${module}' not found. Could not deliver leave notification`);
    }
    _notify_leave_node_room(socket, nodeid, module, topic) {
        if (this._nds[nodeid]) {
            if (this._nds[nodeid]._modules[module])
                this._nds[nodeid]._modules[module].left(socket, topic);
            else
                log.warn(`Node module '${module}' not found. Could not deliver leave notification`);
        }
        else
            log.warn(`Node ${nodeid} not found. Could not deliver leave notification`);
    }
}
exports.Server = Server;
//# sourceMappingURL=core.js.map