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
const communication_1 = require("./communication");
const core_1 = require("./core");
const server_config = __importStar(require("./server_config"));
const rrcs_1 = require("./rrcs");
class DummyMessageHandler extends communication_1.NodeMessageHandler {
    send(msg) {
        throw new Error("Method not implemented.");
    }
}
class RRCSMessageInterceptor extends communication_1.NodeMessageInterceptor {
    constructor(rrcs_host, rrcs_port) {
        super();
        this.rrcs = new rrcs_1.RRCSService(rrcs_host, rrcs_port);
        this.rrcs.onAny((evt, arg) => {
            this.event(evt, arg);
        });
    }
    target() {
        return "rrcs";
    }
    handleMessage(msg, from_ipc) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (msg.field) {
                case "state": {
                    return this.rrcs.getArtistState();
                }
                case 'add-xp-sync': {
                    this.rrcs.addXPSync(msg.data.master, msg.data.slaves);
                    return "ok";
                }
                case 'xp-syncs': {
                    let syncs = msg.data;
                    this.rrcs.setXPSyncs(syncs);
                }
                case 'xp-sync-add-slaves': {
                    return this.rrcs.xpSyncAddSlaves(msg.data);
                }
                case 'xp-sync-remove-slaves': {
                    return this.rrcs.xpSyncRemoveSlaves(msg.data);
                }
            }
        });
    }
}
function default_1(options) {
    const type = communication_1.NODE_TYPE.RRCS_NODE;
    server_config.loadServerConfigFile(options.config);
    const config = server_config.merge(options);
    let handler = new DummyMessageHandler();
    let client = new communication_1.SINodeWSClient(config, handler, type);
    const state = new core_1.NodeDataStorage(config, options, type);
    const rrcs = new RRCSMessageInterceptor(config.rrcs, 8193);
    client.addWSInterceptor(state);
    client.addWSInterceptor(rrcs);
}
exports.default = default_1;
//# sourceMappingURL=rrcs_node_mode.js.map