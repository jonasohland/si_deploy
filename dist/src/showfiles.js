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
const dependency_graph_1 = require("dependency-graph");
const events_1 = require("events");
const fs = __importStar(require("fs"));
const uuid_1 = require("uuid");
const files_1 = require("./files");
const logger = __importStar(require("./log"));
const log = logger.get('SHOWFL');
class ShowfileTarget extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this._sections = [];
    }
    beforeShowfileLoad() {
    }
    afterShowfileLoad() {
    }
    addSection(section) {
        if (this._sections.findIndex(sc => sc.showfileSectionName()
            == section.showfileSectionName())
            != -1)
            return log.error('Will not add section '
                + section.showfileSectionName()
                + '. Section already in target');
        log.debug(`Registered new section '${section.showfileSectionName()}' in module '${this.targetName()}'`);
        this._sections.push(section);
    }
    doLoadShowfile(sf) {
        this._sections.forEach(s => {
            let data = sf.getSectionDataByName(s.showfileSectionName());
            if (data)
                s.restoreSection(data);
            else
                log.warn('No data for section ' + s.showfileSectionName());
        });
    }
    showfileTargetData() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                sections: yield Promise.all(this._sections.map(s => s.showfileSectionData())),
                name: this.targetName()
            };
        });
    }
}
exports.ShowfileTarget = ShowfileTarget;
class ShowfileRecord {
    constructor(name) {
        this._name = name;
        this._uid = uuid_1.v4();
    }
    doSave() {
        return __awaiter(this, void 0, void 0, function* () {
            log.debug('Saving record \'' + this._name + '\'');
            return {
                data: yield this.plain(),
                uid: this._uid,
                name: this._name
            };
        });
    }
}
exports.ShowfileRecord = ShowfileRecord;
class ShowfileSection {
    constructor(name) {
        this._records = [];
        if (name) {
            this._uid = uuid_1.v4();
            this._name = name;
            this._records = [];
        }
    }
    addRecord(s) {
        log.debug('Add new record \'' + s._name + '\' to section \''
            + this.showfileSectionName() + '\'');
        this._records.push(s);
    }
    showfileSectionName() {
        return this._name;
    }
    showfileSectionId() {
        return this._uid;
    }
    showfileSectionData() {
        return __awaiter(this, void 0, void 0, function* () {
            log.debug('Retrieving data from showfile section \'' + this._name
                + '\'');
            return {
                records: yield Promise.all(this._records.map(r => r.doSave())),
                name: this._name,
                uid: this._uid
            };
        });
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
    getSectionDataByName(name) {
        return this._sections.find(sect => name == sect.name);
    }
    getSectionById(id) {
        return this._sections.find(sect => id == sect.uid);
    }
}
exports.Showfile = Showfile;
class ShowfileManager {
    constructor() {
        this.targets = [];
        if (!fs.existsSync(files_1.configFileDir()))
            fs.mkdirSync(files_1.configFileDir());
        if (!fs.existsSync(files_1.configFileDir('showfiles')))
            fs.mkdirSync(files_1.configFileDir('showfiles'));
    }
    register(t, dependencies) {
        let name = t.targetName();
        if (dependencies)
            this.dependencies.push(...dependencies.map(dep => [name, dep]));
        this.targets.push(t);
        log.debug('Registered new module \'' + name + '\'');
    }
    createEmptyShow(name) {
        fs.mkdirSync(files_1.configFileDir('showfiles/' + name));
        fs.writeFileSync(files_1.configFileDir(`showfiles/${name}/show.json`), '{}');
    }
    storeShowfile() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let data = yield Promise.all(this.targets.map(tgt => tgt.showfileTargetData()));
            }
            catch (err) {
                log.error('Could not save showfile: ' + err);
            }
        });
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
            this.targets.find(t => t.targetName() == tgt).doLoadShowfile(s);
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