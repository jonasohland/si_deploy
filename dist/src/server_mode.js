"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_config = __importStar(require("./server_config"));
const server_1 = require("./server");
const log = __importStar(require("./log"));
function default_1(options) {
    if (options.logLevel != null)
        log.setLogLVL(options.logLevel);
    server_config.loadServerConfigFile(options.config);
    const server = new server_1.SpatialIntercomServer(server_config.merge(options));
}
exports.default = default_1;
//# sourceMappingURL=server_mode.js.map