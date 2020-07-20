"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const os = __importStar(require("os"));
const communication_1 = require("./communication");
const IPC = __importStar(require("./ipc"));
const server_config = __importStar(require("./server_config"));
const dsp_process_1 = require("./dsp_process");
const core_1 = require("./core");
const local_addresses = [];
const ifaces = os.networkInterfaces();
Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;
    ifaces[ifname].forEach(function (iface) {
        if ('IPv4' != iface.family || iface.internal)
            return;
        local_addresses.push(iface.address);
        ++alias;
    });
});
function default_1(options) {
    server_config.loadServerConfigFile(options.config);
    const config = server_config.merge(options);
    const ipc = new IPC.IPCServer();
    const wsclient = new communication_1.SINodeWSClient(config, ipc);
    const dspp = new dsp_process_1.LocalNodeController(config, ipc);
    const state = new core_1.NodeDataStorage(config);
    wsclient.addWSInterceptor(dspp);
    wsclient.addWSInterceptor(state);
}
exports.default = default_1;
//# sourceMappingURL=node_mode.js.map