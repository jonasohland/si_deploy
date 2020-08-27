"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
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
    const type = communication_1.NODE_TYPE.DSP_NODE;
    server_config.loadServerConfigFile(options.config);
    const config = server_config.merge(options);
    const ipc = new IPC.IPCServer();
    const wsclient = new communication_1.SINodeWSClient(config, ipc, type);
    const dspp = new dsp_process_1.LocalNodeController(config, ipc);
    const state = new core_1.NodeDataStorage(config, options, type);
    wsclient.addWSInterceptor(dspp);
    wsclient.addWSInterceptor(state);
}
exports.default = default_1;
//# sourceMappingURL=node_mode.js.map