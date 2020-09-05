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
function configFileDir(subdir) {
    return os.homedir() + '/Spatial\ Intercom' + ((subdir) ? '/' + subdir : '');
}
exports.configFileDir = configFileDir;
//# sourceMappingURL=files.js.map