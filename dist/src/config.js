"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NodeConfigDataSet {
}
exports.NodeConfigDataSet = NodeConfigDataSet;
class NodeConfig {
    get(type) {
        return this.data[type];
    }
}
exports.NodeConfig = NodeConfig;
class Configuration {
}
exports.Configuration = Configuration;
var testenum;
(function (testenum) {
    testenum[testenum["one"] = 0] = "one";
    testenum[testenum["two"] = 1] = "two";
})(testenum || (testenum = {}));
class ConfigManager {
    constructor() {
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=config.js.map