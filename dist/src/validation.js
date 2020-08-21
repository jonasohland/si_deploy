"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ajv_1 = __importDefault(require("ajv"));
const fs_1 = __importDefault(require("fs"));
const ajv = ajv_1.default();
var Validators;
(function (Validators) {
    Validators[Validators["CrosspointSync"] = 0] = "CrosspointSync";
})(Validators = exports.Validators || (exports.Validators = {}));
const Schemas = {
    [Validators.CrosspointSync]: __dirname + '/schemas/CrosspointSync.schema.json'
};
function getValidator(validator) {
    return ajv.compile(JSON.parse(fs_1.default.readFileSync(Schemas[validator]).toString()));
}
exports.getValidator = getValidator;
//# sourceMappingURL=validation.js.map