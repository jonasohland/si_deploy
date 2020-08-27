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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidator = exports.Validators = void 0;
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