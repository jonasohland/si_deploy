import {DepGraph} from 'dependency-graph';
import {EventEmitter} from 'events';
import * as fs from 'fs';
import * as os from 'os';
import { showfileDir } from './files'
import { v4 as uuid } from 'uuid';

import * as logger from './log';

const log = logger.get("SHFILE");


export abstract class ShowfileTarget extends EventEmitter {

    abstract targetName(): string;

    beforeShowfileLoad() {}
    abstract onShowfileLoad(s: Showfile): void;
    abstract onEmptyShowfileCreate(s: Showfile): void;
    afterShowfileLoad() {}
}

export abstract class ShowfileRecord {

    _name: string;
    _data: any;

    _uid: string;

    abstract plain(): any;
    abstract restore(data: any): void;
    abstract save(): any;
    abstract build(data: any): void;
}

export class ShowfileSection {

    private _name: string;
    private _uid: string;
    private _records: ShowfileRecord[];

    constructor(name?: string)
    {
        if(name){
            this._uid = uuid();
            this._name = name;
            this._records = [];
        }
    }

    name()
    {
        return this._name;
    }

    id()
    {
        return this._uid;
    }

    plain(): any
    {
        return {
            records: this._records.map(r => r.plain()),
            name: this._name,
            uid: this._uid
        }
    }
}

export class Showfile {

    _sections: ShowfileSection[] = [];
    _created: string;

    constructor() {}

    init()
    {
        this._created = (new Date(Date.now())).toISOString();
    }

    getSectionByName(name: string): ShowfileSection
    {
        return this._sections.find(sect => name == sect.name());
    }

    getSectionById(id: string): ShowfileSection
    {
        return this._sections.find(sect => id == sect.id());
    }

    replace(id: string, sect: ShowfileSection): boolean
    {
        let idx = this._sections.findIndex(s => id == sect.id());

        if(idx != -1)
            this._sections.splice(idx, 1);
        
        this._sections.push(sect);
        return idx != -1;
    }

    toString(): string
    {
        return JSON.stringify({
            sections: this._sections.map(s => s.plain()),
            created: this._created
        });
    }
}

export class ShowfileManager {

    targets: ShowfileTarget[] = [];
    dependencies: [ string, string ][];

    constructor()
    {
        if (!fs.existsSync(showfileDir())) fs.mkdirSync(showfileDir());

        if (!fs.existsSync(showfileDir('showfiles')))
            fs.mkdirSync(showfileDir('showfiles'))
    }

    register(t: ShowfileTarget, dependencies?: string[])
    {
        let name = t.targetName();

        if (dependencies)
            this.dependencies.push(
                ...dependencies.map(dep => <[ string, string ]>[ name, dep ]));

        this.targets.push(t);

        log.info("Registered new module '" + name + "'");
    }

    createEmptyShow(name: string)
    {
        fs.mkdirSync(showfileDir('showfiles/' + name));
        fs.writeFileSync(showfileDir(`showfiles/${name}/show.json`), '{}');
    }

    loadShowfile() {
        
        let s = new Showfile();

        let graph = new DepGraph();

        this.targets.forEach(t => graph.addNode(t.targetName(), t));
        this.dependencies.forEach(d => graph.addDependency(d[0], d[1]));

        let load_seq = graph.overallOrder();

        load_seq.forEach(tgt => {
            this.targets.find(t => t.targetName() == tgt).beforeShowfileLoad();
        })

        load_seq.forEach(tgt => {
            this.targets.find(t => t.targetName() == tgt).onShowfileLoad(s);
        })

        load_seq.forEach(tgt => {
            this.targets.find(t => t.targetName() == tgt).afterShowfileLoad();
        })
    }

    start()
    {
    }
}