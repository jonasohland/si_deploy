import {EventEmitter} from 'events';
import {EventEmitter2} from 'eventemitter2';
import * as fs from 'fs';
import safe_filename from 'sanitize-filename';
import {v4 as uniqueId} from 'uuid';

import {
    Connection,
    Message,
    NODE_TYPE,
    NodeIdentification,
    NodeMessageInterceptor,
    Requester,
    SIServerWSServer,
    SIServerWSSession
} from './communication';
import {configFileDir} from './files';
import * as Logger from './log';
import {ignore} from './util';
import WebInterface from './web_interface';
import { lowerFirst } from 'lodash';
import { DSPNode } from './dsp_node';

const log = Logger.get('NSTATE');

export enum StateUpdateStrategy {
    /**
     * Overwrites everything and removes everything not present in incoming
     * data
     */
    OVERWRITE,

    /**
     * Updates existing references and removes everything not present in
     * incoming data
     */
    SYNC,

    /** Updates existing references and does not remove anything */
    MERGE,

    /** Only update existing references */
    PICK
}

/**
 * Contains the state data of a single object.
 * Uniquely identifiable by its object_id troughout its lifetime.
 */
export interface ManagedNodeStateObjectData {
    object_id: string, uid: string, data: any
}

/**
 * Base interface for a single register that stores some state of a module
 */
export interface ManagedNodeStateRegisterData {
    name: string, uid: string, map: boolean
}

/**
 * Raw data for a register type that stores its data in a simple list
 */
export interface ManagedNodeStateListRegisterData extends
    ManagedNodeStateRegisterData {
    objects: ManagedNodeStateObjectData[];
}

/**
 * Raw data for a register type that stores its data in a map
 */
export interface ManagedNodeStateMapRegisterData extends
    ManagedNodeStateRegisterData {
    objects: Record<string, ManagedNodeStateObjectData>;
}

/**
 * Raw node state data
 */
export interface ManagedNodeStateModuleData {
    name: string, uid: string, raw: any,
        registers: ManagedNodeStateRegisterData[]
}

export interface ObjectReference {
    name?: string, oid: string, uid: string
}

export interface RegisterReference {
    uid: string;
    name: string;
    map: boolean;
    objects: ObjectReference[]
}
/**
 * Map for all state-ids of a module
 */
export interface ModuleReference {
    uid: string, name: string, registers?: RegisterReference[]
}

export abstract class ManagedNodeStateObject<EncapsulatedType extends any> {

    _uid: string;
    _oid: string;
    _dirty: boolean;
    _name: string;
    _parent: ManagedNodeStateRegister;

    abstract async set(val: EncapsulatedType): Promise<void>;
    abstract get(): EncapsulatedType;

    init(parent: ManagedNodeStateRegister)
    {
        this._oid    = uniqueId();
        this._uid    = uniqueId();
        this._parent = parent;
    }

    _export()
    {
        return <ManagedNodeStateObjectData>
        {
            object_id: this._oid, name: this._name, uid: this._uid,
            data: this.get()
        }
    }

    async save(): Promise<Message>
    {
        return this._parent._save_child(this);
    }

    _map()
    {
        return { oid : this._oid, uid : this._uid, name : this._name };
    }

    modify()
    {
        this._dirty = true;
        this._uid   = uniqueId();
    }

    _clear()
    {
        this._dirty = false;
    }
}

export abstract class ManagedNodeStateRegister {

    _name: string;
    _uid: string;
    _dirty: boolean;
    _is_map: boolean;
    _parent: NodeModule;

    init(name: string, parent: NodeModule)
    {
        this._name   = name;
        this._uid    = uniqueId();
        this._parent = parent;
    }

    async _wrap_set(data: ManagedNodeStateObjectData,
                    obj: ManagedNodeStateObject<any>)
    {
        obj._uid = data.uid;
        return obj.set(data.data);
    }

    _object_iter(): ManagedNodeStateObject<any>[]
    {
        if (this._is_map) {
            let self = <ManagedNodeStateMapRegister><unknown>this;
            return Object.keys(self._objects).map(key => self._objects[key]);
        }
        else {
            let self = <ManagedNodeStateListRegister><unknown>this;
            return self._objects;
        }
    }

    async _export()
    {
        if (this._is_map) {
            let objects: Record<string, ManagedNodeStateObjectData> = {};

            for (let object of this._object_iter())
                objects[object._name] = await object._export();

            return <ManagedNodeStateRegisterData>{
                name : this._name,
                uid : this._uid,
                map : this._is_map,
                objects
            };
        }
        else {
            return <ManagedNodeStateListRegisterData>{
                name : this._name,
                uid : this._uid,
                map : this._is_map,
                objects : await Promise.all(
                    this._object_iter().map(obj => obj._export()))
            };
        }
    }

    _map()
    {
        return {
            uid : this._uid,
            name : this._name,
            map : this._is_map,
            objects : this._object_iter().map(o => o._map())
        };
    }

    modify()
    {
        this._dirty = true;
        this._uid   = uniqueId();
    }

    _clear()
    {
        this._dirty = false;
    }

    async _save_child(obj: ManagedNodeStateObject<any>)
    {
        return this._parent._save_child(this, obj);
    }

    async save()
    {
        return this._parent._save_child(this);
    }

    async _restore(s: ManagedNodeStateRegisterData,
                   strategy: StateUpdateStrategy)
    {
        log.debug('Restoring data for register ' + this._name);
        if (this._is_map) {
            let self = <ManagedNodeStateMapRegister><unknown>this;
            return self._restore_map(s, strategy);
        }
        else {
            let self = <ManagedNodeStateListRegister><unknown>this;
            return self._update_list(s, strategy);
        }
    }

    async applyObjectData(obj: ManagedNodeStateObjectData, name?: string)
    {
        if (this._is_map) {
            let self      = <ManagedNodeStateMapRegister><unknown>this;
            let local_obj = self._objects[name];
        }
    }
}

export abstract class ManagedNodeStateMapRegister extends
    ManagedNodeStateRegister {
    _objects: Record<string, ManagedNodeStateObject<any>> = {};

    constructor()
    {
        super();
        this._is_map = true;
    }

    abstract async remove(name: string,
                          obj: ManagedNodeStateObject<any>): Promise<void>;
    abstract async insert(name: string, obj: any):
        Promise<ManagedNodeStateObject<any>>;

    async _wrap_insert(name: string, obj: ManagedNodeStateObjectData)
    {
        let ob   = await this.insert(name, obj.data)
        ob._parent = this;
        ob._uid  = obj.uid;
        ob._oid  = obj.object_id;
        ob._name = (<any>obj).name
        return ob;
    }

    contains(name: string)
    {
        return this._objects[name] != null;
    }

    async removeObject(name: string)
    {
        return this._wrap_remove(name, null);
    }

    async _wrap_remove(name: string, obj: ManagedNodeStateObject<any>)
    {
        if (this.contains(name)) {
            log.debug(`Removing object [${this._objects[name].constructor.name}] ${name} from
                ${this._name}`);
            delete this._objects[name];
            return this.remove(name, obj);
        } else
            throw new Error(`Could not remove ${name}: Object not found`);
    }

    async insertExt(name: string, data: ManagedNodeStateObjectData)
    {
        this._objects[name] = await this._wrap_insert(name, data);
    }

    async _restore_map(s: ManagedNodeStateRegisterData,
                       strategy: StateUpdateStrategy)
    {
        if (!s.map)
            throw 'Did not expect list data in register ' + this._name;

        log.debug('Updating map data in register ' + this._name
                  + ' with strategy ' + StateUpdateStrategy[strategy]);

        let data = <ManagedNodeStateMapRegisterData>s;

        if (strategy == StateUpdateStrategy.OVERWRITE) {

            // remove everything
            await Promise.all(this._object_iter().map(ob => {
                log.debug(`Removing object [${ob.constructor.name}] ${
                    ob._oid} from ${this._name} (OVWRT)`);
                return this._wrap_remove(ob._name, ob);
            }));

            // add everything
            for (let key of Object.keys(data.objects)) {
                log.debug(`Insert new object [${key}] in ${this._name}`);
                this._objects[key]
                    = await this._wrap_insert(key, data.objects[key]);
            }
        }
        else {
            if (strategy == StateUpdateStrategy.SYNC
                || strategy == StateUpdateStrategy.PICK) {
                // remove objects from register that are not present in the
                // update
                for (let key of Object.keys(this._objects)) {
                    if (data.objects[key] == undefined) {
                        log.debug(`Removing object [${
                            this._objects[key].constructor.name}] ${
                            this._objects[key]._name} from ${
                            this._name} because it is not in the incoming list`);
                        await this._wrap_remove(key, this._objects[key]);
                    }
                }
            }

            log.debug('Merging data in map register ' + this._name);

            // objects to update go here
            let updates:
                [ ManagedNodeStateObjectData, ManagedNodeStateObject<any>][] =
                    [];

            // update objects that with same name and different uids
            for (let key of Object.keys(data.objects)) {
                if (this._objects[key]
                    && (this._objects[key]._uid != data.objects[key].uid)) {

                    log.debug(`Updating object [${
                        this._objects[key].constructor.name}] ${key} in ${
                        this._name}`);

                    updates.push([ data.objects[key], this._objects[key] ]);
                }
            }

            // update all objects asynchronously
            await Promise.all(updates.map(up => this._wrap_set(up[0], up[1])));

            let newobjects: [ string, ManagedNodeStateObjectData ][] = [];

            if (strategy != StateUpdateStrategy.PICK) {
                // find all incoming objects that are not present in the
                // register
                for (let key of Object.keys(data.objects)) {
                    if (this._objects[key] == null) {
                        log.info(`Adding new object ${key} to ${this._name}`);
                        newobjects.push([ key, data.objects[key] ]);
                    }
                }

                // insert new objects asynchronously
                await Promise.all(
                    newobjects.map(async ob => this._objects[ob[0]]
                                   = await this._wrap_insert(ob[0], ob[1])));
            }
        }
    }

    add(name: string, obj: ManagedNodeStateObject<any>)
    {
        obj.init(this);
        obj._name           = name;
        this._objects[name] = obj;
    }
}

export abstract class Publisher {
    constructor() {

    }

    abstract joined(socket: SocketIO.Socket, topic: string): void;
    abstract left(socket: SocketIO.Socket, topic: string): void;
    abstract publish(topic: string, event: string, ...data: any[]): void;
    abstract hasSubs(topic: string): boolean;

    _pub_init(server: Server) {

    }
}

export abstract class ManagedNodeStateListRegister extends
    ManagedNodeStateRegister {
    _objects: ManagedNodeStateObject<any>[] = [];

    constructor()
    {
        super();
        this._is_map = false;
    }

    abstract async remove(obj: ManagedNodeStateObject<any>): Promise<void>;
    abstract async insert(obj: any):
        Promise<ManagedNodeStateObject<any>>;

    private async _wrap_insert(obj: ManagedNodeStateObjectData)
    {
        let nobj  = await this.insert(obj.data);
        nobj._uid = obj.uid;
        nobj._oid = obj.object_id;
        nobj._parent = this;
        log.debug(`Inserting new object [${nobj.constructor.name}] ${
            nobj._oid} to ${this._name}`);
        return nobj;
    }

    async insertExt(data: ManagedNodeStateObjectData)
    {
        this._objects.push(await this._wrap_insert(data));
    }

    async _update_list(s: ManagedNodeStateRegisterData,
                       strategy: StateUpdateStrategy)
    {
        if (s.map)
            throw 'Did not expect map data in register ' + this._name;

        log.debug('Updating list data in register ' + this._name
                  + ' with strategy ' + StateUpdateStrategy[strategy]);

        let data = <ManagedNodeStateListRegisterData>s;

        if (strategy == StateUpdateStrategy.OVERWRITE) {
            await Promise.all(this._objects.map(ob => {
                log.debug(`Removing object [${ob.constructor.name}] ${
                    ob._oid} from ${this._name}`);
                this.remove(ob);
            }));

            this._objects = await Promise.all(
                data.objects.map(d => this._wrap_insert(d)));
        }
        else {
            if (strategy == StateUpdateStrategy.SYNC
                || strategy == StateUpdateStrategy.PICK) {

                // remove objects from register that are not present in the
                // update
                this._objects = this._objects.filter(obj => {
                    if (data.objects.findIndex(nob => nob.object_id == obj._oid)
                        == -1) {
                        log.debug(`Removing object [${obj.constructor.name}] ${
                            obj._oid} from ${this._name}`)
                        return false;
                    }
                    else
                        return true;
                });
            }

            log.debug('Merging data in list register ' + this._name);

            // objects tp update go here
            let updates:
                [ ManagedNodeStateObjectData, ManagedNodeStateObject<any>][] =
                    [];

            for (let obj of data.objects) {

                // find incoming objects in register
                let tidx = this._objects.findIndex(lobj => lobj._oid
                                                           == obj.object_id);

                // we found our object
                if (tidx != -1 && obj.uid != this._objects[tidx]._uid) {

                    log.debug(`update object ${obj.object_id} ${
                        this._objects[tidx].constructor.name}`);

                    // add to objects to update
                    updates.push([ obj, this._objects[tidx] ]);
                }
            }

            // update all objects asynchronously
            await Promise.all(updates.map(up => this._wrap_set(up[0], up[1])));

            if (strategy != StateUpdateStrategy.PICK) {
                // find all incoming objects that are not present in the
                // register
                let new_objects = data.objects.filter(
                    ob => this._objects.findIndex(pob => pob._oid
                                                         == ob.object_id)
                          == -1);

                // insert new objects asynchronously
                return Promise.all(
                    new_objects.map(async obj => { this._objects.push(
                                        await this._wrap_insert(obj)) }));
            }
        }
    }

    removeItem(item: ManagedNodeStateObject<any>)
    {
        let itemIndex = this._objects.indexOf(item);
        if(itemIndex != -1) {
            this._objects.splice(itemIndex, 1);
            return true;
        }
        else 
            return false;
    }

    add(obj: ManagedNodeStateObject<any>)
    {
        log.debug(`Insert new object [${obj.constructor.name}] into list`);
        obj.init(this);
        this._objects.push(obj);
    }
}

export abstract class NodeModule extends Publisher {

    _parent: Node;
    _server: Server;
    _name: string;
    _uid: string;
    _data: any;
    _registers: Record<string, ManagedNodeStateRegister> = {};
    _dirty: boolean;
    events: EventEmitter2;

    abstract init(): void;
    abstract start(remote: Connection): void;
    abstract destroy(): void;

    constructor(target: string)
    {
        super();
        this._name = target;
        this._uid  = uniqueId();
    }

    publish(topic: string, event: string, ...data: any[])
    {
        this._server._do_publish_node(this.myNodeId(), this._name, topic, event, ...data);
    }

    hasSubs(topic: string) 
    {
        return this._server._check_node_has_subscribers(this.myNodeId(), this._name, topic);
    }

    _init(parent: Node, server: Server)
    {
        this._parent = parent;
        this._server = server;
        this.events = this._parent.events;
        this._pub_init(server);
        this.init();
    }

    _start(remote: Connection)
    {
        this.start(remote);
    }

    modify()
    {
        this._dirty = true;
        this._uid   = uniqueId();
    }

    async _export()
    {
        let regkeys                             = Object.keys(this._registers);
        let out: ManagedNodeStateRegisterData[] = [];

        for (let reg of regkeys)
            out.push(await this._registers[reg]._export());

        return <ManagedNodeStateModuleData>{
            uid : this._uid,
            name : this._name,
            raw : this._data,
            registers : out
        };
    }

    async _save_child(reg: ManagedNodeStateRegister,
                      obj?: ManagedNodeStateObject<any>)
    {
        return this._parent._save_child(this, reg, obj);
    }

    async save()
    {
        return this._parent._save_child(this);
    }

    _clear()
    {
        this._dirty = false;
    }

    _map(): ModuleReference
    {
        let regs     = [];
        let reg_keys = Object.keys(this._registers);

        for (let reg of reg_keys)
            regs.push(this._registers[reg]._map());

        return { uid : this._uid, name : this._name, registers : regs };
    }

    add(reg: ManagedNodeStateRegister, name: string)
    {
        reg.init(name, this);
        this._registers[reg._name] = reg;
    }

    isInitialized()
    {
        return Boolean(this._parent);
    }

    myNode()
    {
        return this._parent;
    }

    myNodeId()
    {
        let node = this.myNode();
        if(node)
            return node.id();
        else
            throw new Error("Node module not initialized");
    }

    async _restore(state: ManagedNodeStateModuleData,
                   strategy: StateUpdateStrategy = StateUpdateStrategy.SYNC)
    {
        log.debug('Restoring data for module ' + this._name);
        return Promise.all(state.registers.map(
            reg => this._registers[reg.name]._restore(reg, strategy)));
    }

    async applyModuleData(mod: ManagedNodeStateModuleData)
    {
        return this._restore(mod, StateUpdateStrategy.SYNC);
    }

    async applyRegisterData(name: string, reg: ManagedNodeStateRegisterData)
    {
        let lreg = this._registers[name];
        if (lreg)
            lreg._restore(reg, StateUpdateStrategy.SYNC);
    }

    async applyObjectData(regname: string, obj: ManagedNodeStateObjectData)
    {
        let lreg = this._registers[regname];
    }

    emitToModule(module: string, event: string, ...data: any[]) {
        this.events.emit(`${this.myNodeId()}.${module}.${event}`, ...data);
    }

    emitToNode(event: string, ...data: any[]) {
        this.events.emit(`${this.myNodeId()}.${event}`, ...data);
    }

    handleNodeEvent(event: string, handler: (...data: any[]) => void) {
        this.events.on(`${this.myNodeId()}.${event}`, handler);
    }

    handleModuleEvent(event: string, handler: (...data: any[]) => void) {
        this.events.on(`${this.myNodeId()}.${this._name}.${event}`, handler);
    }
}

interface UpdateObjectMessage {
    module: string;
    register: string;
    data: ManagedNodeStateObjectData;
}

interface UpdateRegisterMessage {
    module: string;
    data: ManagedNodeStateRegisterData;
}

interface UpdateModuleMessage {
    data: ManagedNodeStateModuleData;
}

interface GetNodeStateMessage {
    modules: { name: string, data: ModuleReference }[];
}

interface ReturnNodeStateMessage {
    modules: { name: string, module: ManagedNodeStateModuleData }[];
    registers: { mod: string, register: ManagedNodeStateRegisterData }[];
    objects: {
        mod: string,
        register_name: string,
        object: ManagedNodeStateObjectData,
        add?: boolean,
        name?: string
    }[];
}

export class NodeDataStorage extends NodeMessageInterceptor {

    _modules: Record<string, ManagedNodeStateModuleData> = {};
    _local_file: string;
    _save_timeout: NodeJS.Timeout;
    _saving: boolean     = false;
    _save_again: boolean = false

    constructor(config: any, options: any, type: NODE_TYPE)
    {
        super();
        this._local_file = configFileDir('nodestate/')
                           + safe_filename(config.node_name || 'default_node')
                           + '.' + NODE_TYPE[type]
                           + '.json';
        if (!fs.existsSync(configFileDir('nodestate')))
            fs.mkdirSync(configFileDir('nodestate'));

        if(options.reset) {
            if(fs.existsSync(this._local_file))
                fs.unlinkSync(this._local_file);
        }

        if (!fs.existsSync(this._local_file)) {
            fs.writeFileSync(this._local_file, JSON.stringify({ modules : {} }))
        }
        else {
            this.restoreStateFromFile().then((data) => {
                this._modules = data.modules;
                log.info('Restored state from file');
                this.saveLater();
            });
        }
    }

    async restoreStateFromFile(): Promise<any>
    {
        return new Promise((resolve, reject) => {
            fs.readFile(this._local_file, (err, data) => {
                if (err)
                    reject(err);
                resolve(JSON.parse(data.toString()));
            });
        });
    }

    async writeState()
    {
        return new Promise((resolve, reject) => {
            fs.writeFile(this._local_file,
                         JSON.stringify({ modules : this._modules }, null, 2),
                         err => {
                             if (err)
                                 log.error(err);

                             resolve();
                         });
        });
    }

    saveLater()
    {
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
                    this._saving = false
                })
                .catch(err => {
                    log.error('Could not save file ' + err);
                });
                this._saving = true;
        }, 5000);
    }

    target(): string
    {
        return 'state-manager';
    }

    async handleMessage(msg: Message, from_ipc: boolean)
    {
        switch (msg.field) {
            case 'update-object':
                return this.updateObject(<UpdateObjectMessage>msg.data);
            case 'update-register':
                return this.updateRegister(<UpdateRegisterMessage>msg.data);
            case 'update-module':
                return this.updateModule(<UpdateModuleMessage>msg.data);
            case 'get': return this.get(<GetNodeStateMessage>msg.data);
        }
    }

    updateObject(msg: UpdateObjectMessage)
    {
        log.verbose(`Update object ${msg.module} -> ${msg.register} -> ${msg.data.object_id}`);
        if (this._modules[msg.module]) {
            let mod = this._modules[msg.module];
            let regidx
                = mod.registers.findIndex(reg => reg.name == msg.register);
            if (regidx != -1) {
                let reg = mod.registers[regidx];
                if (reg.map) {
                    if((<ManagedNodeStateMapRegisterData>reg)
                        .objects[(<any>msg.data).name] == null) {

                            (<ManagedNodeStateMapRegisterData>reg)
                            .objects[(<any>msg.data).name] = { data: msg.data.data, object_id: msg.data.object_id, uid: msg.data.uid };
                    } else {
                        let obj = (<ManagedNodeStateMapRegisterData>reg)
                        .objects[(<any>msg.data).name]

                            obj.data = msg.data.data;
                            obj.object_id = msg.data.object_id;
                            obj.uid = msg.data.uid;
                    }
                }
                else {
                    let listreg   = <ManagedNodeStateListRegisterData>reg;
                    let objectidx = listreg.objects.findIndex(
                        obj => obj.object_id == msg.data.object_id);

                    if (objectidx == -1)
                        ignore(listreg.objects.push(msg.data));
                    else
                        ignore(listreg.objects[objectidx] = msg.data);
                }
                return this.saveLater();
            }
            else
                throw 'Register not found';
        }
        else
            throw 'Module not found';
    }

    updateRegister(msg: UpdateRegisterMessage)
    {
        if (this._modules[msg.module]) {
            let mod = this._modules[msg.module];
            let regidx
                = mod.registers.findIndex(reg => reg.name == msg.data.name);

            if (regidx != -1)
                mod.registers[regidx] = msg.data;
            else
                mod.registers.push(msg.data);

            this.saveLater();
        }
        else
            throw 'Module not found';
    }

    updateModule(msg: UpdateModuleMessage)
    {
        this._modules[msg.data.name] = msg.data;
        this.saveLater();
    }

    get(msg: GetNodeStateMessage)
    {
        log.info('Comparing internal node data to incoming refs')
        let output: ReturnNodeStateMessage
            = { modules : [], registers : [], objects : [] };

        msg.modules.forEach(
            mod => this._check_module(output, mod.name, mod.data));

        return output;
    }

    _check_module(out: ReturnNodeStateMessage, name: string,
                  modref: ModuleReference)
    {
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
                        let reg = module.registers.findIndex(
                            reg => reg.name == regref.name);
                        if (reg != -1) {
                            log.debug('Check register ' + regref.name);
                            this._check_register(out, module.name,
                                                 module.registers[reg], regref);
                        }
                        else
                            log.warn(`Register ${regref.name} not found`);
                    });
                }
            }
        }
    }

    _check_register(out: ReturnNodeStateMessage, mod: string,
                    register: ManagedNodeStateRegisterData,
                    ref: RegisterReference)
    {
        if (register.uid != ref.uid) {
            log.debug(`Register uid has changed. Update full register`);
            out.registers.push({ mod, register })
        }
        else {
            if (register.map != ref.map)
                throw `Register type mismatch for register ${
                    register.name} in module ${mod}`;

            if (register.map) {
                let map_register = <ManagedNodeStateMapRegisterData>register;
                let keys         = Object.keys(map_register.objects);
                for (let key of keys)
                    this._check_object(
                        out, mod, register.name, map_register.objects[key],
                        ref.objects[ref.objects.findIndex(r => r.name == key)]);
            }
            else {
                let list_register = <ManagedNodeStateListRegisterData>register;
                list_register.objects.forEach(obj => {
                    this._check_object(out, mod, register.name, obj,
                                       ref.objects[ref.objects.findIndex(
                                           o => o.oid == obj.object_id)]);
                });
            }
        }
    }

    _check_object(out: ReturnNodeStateMessage, mod: string,
                  register_name: string, local_obj: ManagedNodeStateObjectData,
                  ref: ObjectReference)
    {
        log.debug(`Check object ${local_obj.object_id}`);
        if (ref) {
            if (ref.uid != local_obj.uid) {
                log.debug(`Update object [${local_obj.object_id}]`);
                out.objects.push(
                    { mod, register_name, object : local_obj, add : false });
            }
        }
        else {
            log.debug(`Add new object [${local_obj.object_id}]`);
            out.objects.push(
                { mod, register_name, object : local_obj, add : true });
        }
    }
}

export abstract class Node {

    _id: NodeIdentification;
    _remote: Connection;
    _modules: Record<string, NodeModule> = {};
    _state_manager: Requester;
    events: EventEmitter2;

    constructor(id: NodeIdentification)
    {
        this._id = id;
    }

    abstract init(): void;
    abstract start(): void;
    abstract destroy(): void;

    _destroy()
    {
        this.destroy();

        if(this.events)
            this.events.removeAllListeners();

        let keys = Object.keys(this._modules);
        for(let key of keys)
            this._modules[key].destroy();
    }

    async _init(remote: Connection, node_events: EventEmitter2, server: Server)
    {
        this.events         = node_events;
        this._remote        = remote;
        this._state_manager = this._remote.getRequester('state-manager');

        this.init();

        let modnames = Object.keys(this._modules);
        for (let mod of modnames) {
            this._modules[mod]._init(this, server);
        }

        log.info("Reloading data from node " + this.name());
        await this._reload_data_from_node()
        log.info("Finished loading data from node " + this.name());

        log.info("Start node modules");
        for (let mod of modnames) {
            log.verbose("Start module " + mod);
            this._modules[mod]._start(remote);
        }
        log.info("Node modules started");

        this._start();
    }

    _start()
    {
        this.start();
    }

    async _save_child(mod: NodeModule, reg?: ManagedNodeStateRegister,
                      obj?: ManagedNodeStateObject<any>)
    {
        if (reg) {
            if (obj)
                return this._state_manager.set(
                    'update-object', <UpdateObjectMessage>{
                        module : mod._name,
                        register : reg._name,
                        data : obj._export()
                    });
            else
                return this._state_manager.set(
                    'update-register', <UpdateRegisterMessage>{
                        module : mod._name,
                        data : await reg._export()
                    });
        }
        else {
            return this._state_manager.set(
                'update-module',
                <UpdateModuleMessage>{ data : await mod._export() })
        }
    }

    async _reload_data_from_node()
    {
        let mods                     = Object.keys(this._modules);
        let msg: GetNodeStateMessage = { modules : [] };

        for (let mod of mods)
            msg.modules.push({ name : mod, data : this._modules[mod]._map() });

        let res = <ReturnNodeStateMessage>(
                      await this._state_manager.request('get', msg))
                      .data;

        await Promise.all(res.modules.map(mod => {
            let local_m = this._modules[mod.name];
            if (local_m)
                return local_m._restore(mod.module, StateUpdateStrategy.SYNC);
        }));

        await Promise.all(res.registers.map(reg => {
            let local_m = this._modules[reg.mod];
            if (local_m) {
                let local_reg = local_m._registers[reg.register.name];
                if (local_reg)
                    return local_reg._restore(reg.register, StateUpdateStrategy.SYNC);
            }
        }));

        res.objects.forEach(async obj => {
            let local_m = this._modules[obj.mod];
            if (local_m) {
                let local_reg = local_m._registers[obj.register_name];
                if (local_reg) {
                    try {
                        if (local_reg._is_map) {
                            if (typeof obj.name == 'undefined')
                                return ignore(log.error(
                                    'missing name property on incoming object'));

                            let mapreg = <ManagedNodeStateMapRegister>local_reg;

                            if (obj.add) {
                                await mapreg.insertExt(obj.name, obj.object);
                            }
                            else {
                                let local_obj = mapreg._objects[obj.name];
                                if (local_obj)
                                    await local_obj.set(obj.object);
                                else
                                    await mapreg.insertExt(obj.name, obj.object);
                            }
                        }
                        else {
                            let listreg
                                = <ManagedNodeStateListRegister>local_reg;

                            if (obj.add) {
                                listreg.insertExt(obj.object);
                            }
                            else {
                                let obj_idx = listreg._objects.findIndex(
                                    o => o._oid == obj.object.object_id);
                                if (obj_idx != -1)
                                    await listreg._objects[obj_idx].set(
                                        obj.object)
                                    else await listreg.insertExt(obj.object);
                            }
                        }
                    }
                    catch (err) {
                        log.error(`Failed to restore object [${obj.mod}] [${
                            obj.register_name}] [${obj.object.object_id}] ${
                            obj.name}`);
                    }
                }
            }
        });
    }

    name()
    {
        return this._id.name;
    }

    id()
    {
        return this._id.id;
    }

    type()
    {
        return this._id.type;
    }

    remote()
    {
        if (this.remote)
            return this._remote;
        else
            throw 'Cannot access remote before initialization';
    }

    add(module: NodeModule)
    {
        this._modules[module._name] = module;
    }

    getModule<ModuleType>(name: string)
    {
        return <ModuleType><unknown>this._modules[name];
    }

    emitToModule(module: string, event: string, ...data: any[]) {
        this.events.emit(`${this.id()}.${module}.${event}`, ...data);
    }

    emitToNode(event: string, ...data: any[]) {
        this.events.emit(`${this.id()}.${event}`, ...data);
    }
}

export type WEBIFNodeEventHandler = (socket: SocketIO.Socket, node: Node, data: any, transaction?: TransactionID) => void;
export type WEBIFEventHandler = (socket: SocketIO.Socket, data: any) => void;
export type TransactionID = string;

export abstract class ServerModule extends Publisher {
    
    _name: string;
    events: EventEmitter2;
    server: Server;
    webif: WebInterface;

    _init(srv: Server, webif: WebInterface, events: EventEmitter2)
    {
        this.webif = webif;
        this.server = srv;
        this.events = events;

        this._pub_init(this.server)
        this.init();
    }

    publish(topic: string, event: string, ...data: any[])
    {
        this.server._do_publish_server(this._name, topic, event, ...data);
    }

    hasSubs(topic: string) {
        return this.server._check_server_has_subscribers(this._name, topic);
    }

    abstract init(): void;

    constructor(name: string)
    {
        super();
        this._name = name;
    }

    getNode(id: string)
    {
        return this.server._nds[id];
    }

    handleWebInterfaceEvent(event: string, handler: WEBIFNodeEventHandler)
    {
        this.webif.attachHandler(this, this._name, event, (socket: SocketIO.Socket, nodeid: string, data: any) => {
            let node = this.server._nds[nodeid];
            if(!node) {
                log.error(`Node not found for message -${this._name}.${event} - node: ${nodeid}`);
                socket.emit('showerror', `Node not found for id ${nodeid}`);
                return;
            }
            log.debug(`Dispatch event: -${this._name}.${event} - ${nodeid}`);
            handler(socket, node, data);
        }); 
    }

    handleGlobalWebInterfaceEvent(event: string, handler: WEBIFEventHandler)
    {
        this.webif.attachHandler(this, this._name, event, (socket: SocketIO.Socket, data: any) => {
            handler(socket, data);
        }); 
    }

    emitToModule(node: string, module: string, event: string, ...data: any[]) {
        this.events.emit(`${node}.${module}.${event}`, ...data);
    }

    emitToNode(node: string, event: string, ...data: any[]) {
        this.events.emit(`${node}.${event}`, ...data);
    }
}

export class ServerInternalsModule extends ServerModule {

    joined(socket: SocketIO.Socket, topic: string)
    {
        socket.emit('server.nodes.' + topic, this.nodeIdList(NODE_TYPE[topic as keyof typeof NODE_TYPE]));
    }   

    left(socket: SocketIO.Socket, topic: string)
    {
    }

    nodesChanged(type: NODE_TYPE)
    {
        this.publish(NODE_TYPE[type], 'server.nodes.' + NODE_TYPE[type], this.nodeIdList(type));
    }
    
    nodeIdList(type: NODE_TYPE)
    {
        return this.server.nodes(type).map(n => n._id);
    }

    allNodeIds()
    {
        this.server.allNodes().map(n => n.id());
    }

    init() {
    }

    constructor()
    {
        super('server');
    }
}

export abstract class Server  {

    _srv: SIServerWSServer
    _nds: Record<string, Node> = {};
    _modules: Record<string, ServerModule> = {};
    _webif: WebInterface;
    _event_bus: EventEmitter2;
    _internals: ServerInternalsModule;

    constructor(wssrv: SIServerWSServer, webif: WebInterface)
    {
        this._event_bus = new EventEmitter2({ wildcard: true, delimiter: '.' });
        this._srv       = wssrv;
        this._webif = webif;
        this._srv.on('add-session', this._on_add_remote.bind(this));
        this._srv.on('remove-session', this._on_remove_remote.bind(this));
        this._internals = new ServerInternalsModule();
        this.add(this._internals);

        this._event_bus.onAny((eventname: string) => {
            log.debug(`Server event [${eventname}]`);
        })
    }

    add(module: ServerModule)
    {
        this._modules[module._name] = module;
        module._init(this, this._webif, this._event_bus);
    }

    emitToNodeModule(node: string, module: string, event: string, ...data: any[]) {
        this._event_bus.emit(`${node}.${module}.${event}`, ...data);
    }

    emitToNode(node: string, event: string, ...data: any[]) {
        this._event_bus.emit(`${node}.${event}`, ...data);
    }

    nodes(type: NODE_TYPE)
    {
        let nodeids = Object.keys(this._nds);
        let out = [];
        for(let id of nodeids) {
            if(this._nds[id].type() == type)
                out.push(this._nds[id]);
        }

        return out;
    }

    allNodes() {
        let nodeids = Object.keys(this._nds);
        let out = [];
        for(let id of nodeids) 
            out.push(this._nds[id]);

        return out;
    }

    _on_add_remote(session: SIServerWSSession)
    {
        log.info(`Create new node instance for [${
            NODE_TYPE[session.id().type]}] ${session.id().name}`);
        let node               = this.createNode(session.id());

        node._init(session, this._event_bus, this).then(() => {
            this._nds[node.id()] = node;
            this._internals.nodesChanged(session.id().type);
        });
    }

    _on_remove_remote(session: SIServerWSSession)
    {
        let node = this._nds[session.id().id];
        if (node) {
            log.info(`Destroy node instance for [${
                NODE_TYPE[session.id().type]}] ${session.id().name}`);
            node._destroy();
            this.destroyNode(node);
            delete this._nds[session.id().id];
            this._internals.nodesChanged(session.id().type);
        }
    }

    _check_server_has_subscribers(module: string, topic: string) 
    {
        return this._webif.checkServerHasSubscribers(module, topic);
    }

    _check_node_has_subscribers(nodeid: string, module: string, topic: string)
    {
        return this._webif.checkNodeHasSubscribers(nodeid, module, topic);
    }

    _do_publish_server(module: string, topic: string, event: string, ...data: any[])
    {
        this._webif.doPublishServer(module, topic, event, ...data);
    }

    _do_publish_node(nodeid: string, module: string, topic: string, event: string, ...data: any[])
    {
        this._webif.doPublishNode(nodeid, module, topic, event, ...data);
    }

    _notify_join_server_room(socket: SocketIO.Socket, module: string, topic: string)
    {
        if(this._modules[module])
            this._modules[module].joined(socket, topic);
        else
            log.warn(`Server module '${module}' not found. Could not deliver join notification`);
    }

    _notify_join_node_room(socket: SocketIO.Socket, nodeid: string, module: string, topic: string)
    {
        if(this._nds[nodeid]) {
            if(this._nds[nodeid]._modules[module])
                this._nds[nodeid]._modules[module].joined(socket, topic);
            else
                log.warn(`Node module '${module}' not found. Could not deliver join notification`);
        } 
        else 
            log.warn(`Node ${nodeid} not found. Could not deliver join notification`);
    }

    _notify_leave_server_room(socket: SocketIO.Socket, module: string, topic: string)
    {
        if(this._modules[module])
            this._modules[module].left(socket, topic);
        else
            log.warn(`Server module '${module}' not found. Could not deliver leave notification`);
    }

    _notify_leave_node_room(socket: SocketIO.Socket, nodeid: string, module: string, topic: string)
    {
        if(this._nds[nodeid]) {
            if(this._nds[nodeid]._modules[module])
                this._nds[nodeid]._modules[module].left(socket, topic);
            else
                log.warn(`Node module '${module}' not found. Could not deliver leave notification`);
        } 
        else 
            log.warn(`Node ${nodeid} not found. Could not deliver leave notification`);
    }

    abstract createNode(id: NodeIdentification): Node;
    abstract destroyNode(node: Node): void;
}