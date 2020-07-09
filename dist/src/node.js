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
const fs = __importStar(require("fs"));
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
const uuid_1 = require("uuid");
const files_1 = require("./files");
const Logger = __importStar(require("./log"));
const util_1 = require("./util");
const communication_1 = require("./communication");
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
    init() {
        this._oid = uuid_1.v4();
        this._uid = uuid_1.v4();
    }
    _export() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                object_id: this._oid, name: this._name, uid: this._uid,
                data: yield this.get()
            };
        });
    }
    _map() {
        return { oid: this._oid, uid: this._uid, name: this._name };
    }
    modify() {
        this._dirty = true;
        this._uid = uuid_1.v4();
    }
}
exports.ManagedNodeStateObject = ManagedNodeStateObject;
class ManagedNodeStateRegister {
    init(name) {
        this._name = name;
        this._uid = uuid_1.v4();
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
            let ob = yield this.insert(name, obj);
            ob._uid = obj.uid;
            ob._oid = obj.object_id;
            ob._name = obj.name;
            return ob;
        });
    }
    _wrap_remove(name, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            // log.debug(`Removing object [${obj.constructor.name}] ${name} from
            // ${this._name}`);
            delete this._objects[name];
            return this.remove(name, obj);
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
        obj.init();
        obj._name = name;
        this._objects[name] = obj;
    }
}
exports.ManagedNodeStateMapRegister = ManagedNodeStateMapRegister;
class ManagedNodeStateListRegister extends ManagedNodeStateRegister {
    constructor() {
        super();
        this._objects = [];
        this._is_map = false;
    }
    _wrap_insert(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            let nobj = yield this.insert(obj);
            nobj._uid = obj.uid;
            nobj._oid = obj.object_id;
            log.debug(`Inserting new object [${nobj.constructor.name}] ${nobj._oid} to ${this._name}`);
            return nobj;
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
    add(obj) {
        log.debug(`Insert new object [${obj.constructor.name}] into list`);
        obj.init();
        this._objects.push(obj);
    }
}
exports.ManagedNodeStateListRegister = ManagedNodeStateListRegister;
class NodeModule {
    constructor(con, target) {
        this._registers = {};
        this._name = target;
        this._uid = uuid_1.v4();
        this._state_manager = con.getRequester('state');
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
    _map() {
        let regs = [];
        let reg_keys = Object.keys(this._registers);
        for (let reg of reg_keys)
            regs.push(this._registers[reg]._map());
        return { uid: this._uid, name: this._name, registers: regs };
    }
    add(reg, name) {
        reg.init(name);
        this._registers[reg._name] = reg;
    }
    _restore(state, strategy = StateUpdateStrategy.SYNC) {
        return __awaiter(this, void 0, void 0, function* () {
            log.debug('Restoring data for module ' + this._name);
            return Promise.all(state.registers.map(reg => this._registers[reg.name]._restore(reg, strategy)));
        });
    }
    _merge(state) {
    }
}
exports.NodeModule = NodeModule;
class NodeDataController {
    addRemoteNode(session) {
    }
    removeRemoteNode(session) {
    }
}
exports.NodeDataController = NodeDataController;
class NodeDataStorage extends communication_1.NodeMessageInterceptor {
    constructor(config) {
        super();
        this._modules = {};
        this._saving = false;
        this._save_again = false;
        this._local_file = files_1.configFileDir('nodestate/')
            + sanitize_filename_1.default(config.node_name || 'default_node')
            + '.json';
        if (!fs.existsSync(files_1.configFileDir('nodestate')))
            fs.mkdirSync(files_1.configFileDir('nodestate'));
        if (!fs.existsSync(this._local_file)) {
            fs.writeFileSync(this._local_file, JSON.stringify({ modules: {} }));
        }
        else {
            this.restoreStateFromFile().then(() => {
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
                this._saving = true;
            })
                .catch(err => {
                log.error('Could not save file ' + err);
            });
        }, 5000);
    }
    target() {
        return 'state-manager';
    }
    handleMessage(msg, from_ipc) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (msg.target) {
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
        if (this._modules[msg.module]) {
            let mod = this._modules[msg.module];
            let regidx = mod.registers.findIndex(reg => reg.name == msg.register);
            if (regidx != -1) {
                let reg = mod.registers[regidx];
                if (reg.map) {
                    reg
                        .objects[msg.data.name]
                        = msg.data.data;
                }
                else {
                    let listreg = reg;
                    let objectidx = listreg.objects.findIndex(obj => obj.object_id == msg.data.object_id);
                    if (objectidx != -1)
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
//# sourceMappingURL=node.js.map