import _ajv from 'ajv';
export declare enum Validators {
    CrosspointSync = 0,
    AddCrosspointVolumeTargetMessage = 1,
    XPSyncModifySlavesMessage = 2,
    UserData = 3
}
export declare function getValidator(validator: Validators): _ajv.ValidateFunction;
