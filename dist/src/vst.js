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
const Logger = __importStar(require("./log"));
const core_1 = require("./core");
const dsp_node_1 = require("./dsp_node");
const log = Logger.get("VST");
class VSTScanner extends core_1.NodeModule {
    constructor() {
        super(dsp_node_1.DSPModuleNames.VST_SCANNER);
        this.knownPlugins = [];
    }
    destroy() {
    }
    init() {
    }
    start(remote) {
        this.requester = remote.getRequester("vst");
    }
    joined(socket, topic) {
    }
    left(socket, topic) {
    }
    waitPluginsScanned() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.requester.requestTmt('wait-scanned', 60000);
            let list = yield this.requester.request('list-vst');
            if (Array.isArray(list.data))
                this.knownPlugins = list.data;
            else
                return false;
            return true;
        });
    }
    isPluginInList(name) {
        return this.findPlugin(name) != undefined;
    }
    findPlugin(name) {
        return this.knownPlugins.find(p => p.name == name);
    }
}
exports.VSTScanner = VSTScanner;
//# sourceMappingURL=vst.js.map