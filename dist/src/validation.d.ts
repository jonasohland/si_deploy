import _ajv from 'ajv';
export declare enum Validators {
    CrosspointSync = 0
}
export declare function getValidator(validator: Validators): _ajv.ValidateFunction;
