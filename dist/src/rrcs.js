"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const riedel_rrcs_1 = require("riedel_rrcs");
const Logger = __importStar(require("./log"));
const log = Logger.get('RRCSSV');
function startRRCS() {
    let srrcs = new riedel_rrcs_1.RRCS_Server({ ip: "0.0.0.0", port: 6870 }, { ip: "192.168.178.98", port: 8193 }, {
        initial: (msg, error) => {
            console.log(msg);
            console.log(error);
        },
        log: msg => {
            log.info(msg);
        },
        error: err => {
            log.error(err);
        },
    });
}
exports.startRRCS = startRRCS;
//# sourceMappingURL=rrcs.js.map