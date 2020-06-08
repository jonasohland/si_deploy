"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const dependency_graph_1 = require("dependency-graph");
const events_1 = require("events");
const fs = __importStar(require("fs"));
const files_1 = require("./files");
const uuid_1 = require("uuid");
const logger = __importStar(require("./log"));
const log = logger.get("SHFILE");
class ShowfileTarget extends events_1.EventEmitter {
    beforeShowfileLoad() { }
    afterShowfileLoad() { }
}
exports.ShowfileTarget = ShowfileTarget;
class ShowfileRecord {
}
exports.ShowfileRecord = ShowfileRecord;
class ShowfileSection {
    constructor(name) {
        if (name) {
            this._uid = uuid_1.v4();
            this._name = name;
            this._records = [];
        }
    }
    name() {
        return this._name;
    }
    id() {
        return this._uid;
    }
    plain() {
        return {
            records: this._records.map(r => r.plain()),
            name: this._name,
            uid: this._uid
        };
    }
}
exports.ShowfileSection = ShowfileSection;
class Showfile {
    constructor() {
        this._sections = [];
    }
    init() {
        this._created = (new Date(Date.now())).toISOString();
    }
    getSectionByName(name) {
        return this._sections.find(sect => name == sect.name());
    }
    getSectionById(id) {
        return this._sections.find(sect => id == sect.id());
    }
    replace(id, sect) {
        let idx = this._sections.findIndex(s => id == sect.id());
        if (idx != -1)
            this._sections.splice(idx, 1);
        this._sections.push(sect);
        return idx != -1;
    }
    toString() {
        return JSON.stringify({
            sections: this._sections.map(s => s.plain()),
            created: this._created
        });
    }
}
exports.Showfile = Showfile;
class ShowfileManager {
    constructor() {
        this.targets = [];
        if (!fs.existsSync(files_1.showfileDir()))
            fs.mkdirSync(files_1.showfileDir());
        if (!fs.existsSync(files_1.showfileDir('showfiles')))
            fs.mkdirSync(files_1.showfileDir('showfiles'));
    }
    register(t, dependencies) {
        let name = t.targetName();
        if (dependencies)
            this.dependencies.push(...dependencies.map(dep => [name, dep]));
        this.targets.push(t);
        log.info("Registered new module '" + name + "'");
    }
    createEmptyShow(name) {
        fs.mkdirSync(files_1.showfileDir('showfiles/' + name));
        fs.writeFileSync(files_1.showfileDir(`showfiles/${name}/show.json`), '{}');
    }
    loadShowfile() {
        let s = new Showfile();
        let graph = new dependency_graph_1.DepGraph();
        this.targets.forEach(t => graph.addNode(t.targetName(), t));
        this.dependencies.forEach(d => graph.addDependency(d[0], d[1]));
        let load_seq = graph.overallOrder();
        load_seq.forEach(tgt => {
            this.targets.find(t => t.targetName() == tgt).beforeShowfileLoad();
        });
        load_seq.forEach(tgt => {
            this.targets.find(t => t.targetName() == tgt).onShowfileLoad(s);
        });
        load_seq.forEach(tgt => {
            this.targets.find(t => t.targetName() == tgt).afterShowfileLoad();
        });
    }
    start() {
    }
}
exports.ShowfileManager = ShowfileManager;
//# sourceMappingURL=showfiles.js.map