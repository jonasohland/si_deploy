"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidator = exports.Validators = void 0;
const ajv_1 = __importDefault(require("ajv"));
const fs_1 = __importDefault(require("fs"));
const ajv = ajv_1.default();
var Validators;
(function (Validators) {
    Validators[Validators["CrosspointSync"] = 0] = "CrosspointSync";
    Validators[Validators["AddCrosspointVolumeTargetMessage"] = 1] = "AddCrosspointVolumeTargetMessage";
    Validators[Validators["XPSyncModifySlavesMessage"] = 2] = "XPSyncModifySlavesMessage";
})(Validators = exports.Validators || (exports.Validators = {}));
function getValidator(validator) {
    return ajv.compile(JSON.parse(fs_1.default.readFileSync(`${__dirname}/schemas/${Validators[validator]}.schema.json`).toString()));
}
exports.getValidator = getValidator;
//# sourceMappingURL=validation.js.map