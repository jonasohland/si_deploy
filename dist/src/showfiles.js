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
const os = __importStar(require("os"));
const logger = __importStar(require("./log"));
const log = logger.get("SHFILE");
function showfileDir(subdir) {
    return os.homedir() + '/Spatial\ Intercom' + ((subdir) ? '/' + subdir : '');
}
class ShowfileTarget extends events_1.EventEmitter {
    beforeShowfileLoad() { }
    afterShowfileLoad() { }
}
exports.ShowfileTarget = ShowfileTarget;
class Showfile {
    constructor() { }
    getSection(name) { }
}
exports.Showfile = Showfile;
class ShowfileManager {
    constructor() {
        this.targets = [];
        if (!fs.existsSync(showfileDir()))
            fs.mkdirSync(showfileDir());
        if (!fs.existsSync(showfileDir('showfiles')))
            fs.mkdirSync(showfileDir('showfiles'));
    }
    register(t, dependencies) {
        let name = t.targetName();
        if (dependencies)
            this.dependencies.push(...dependencies.map(dep => [name, dep]));
        this.targets.push(t);
        log.info("Registered new module '" + name + "'");
    }
    createEmptyShow(name) {
        fs.mkdirSync(showfileDir('showfiles/' + name));
        fs.writeFileSync(showfileDir(`showfiles/${name}/show.json`), '{}');
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