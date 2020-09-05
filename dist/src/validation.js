"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ajv_1 = __importDefault(require("ajv"));
const fs_1 = __importDefault(require("fs"));
const Logger = __importStar(require("./log"));
const log = Logger.get('VALIDR');
const ajv = ajv_1.default({ verbose: true, logger: log, format: 'full' });
var Validators;
(function (Validators) {
    Validators[Validators["CrosspointSync"] = 0] = "CrosspointSync";
    Validators[Validators["AddCrosspointVolumeTargetMessage"] = 1] = "AddCrosspointVolumeTargetMessage";
    Validators[Validators["XPSyncModifySlavesMessage"] = 2] = "XPSyncModifySlavesMessage";
    Validators[Validators["UserData"] = 3] = "UserData";
})(Validators = exports.Validators || (exports.Validators = {}));
function getValidator(validator) {
    return ajv.compile(JSON.parse(fs_1.default.readFileSync(`${__dirname}/schemas/${Validators[validator]}.schema.json`).toString()));
}
exports.getValidator = getValidator;
//# sourceMappingURL=validation.js.map