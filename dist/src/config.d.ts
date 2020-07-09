import { NodeIdentification } from './communication';
export declare class NodeConfigDataSet<DataTypeEnum extends number> {
    type: DataTypeEnum;
}
export declare class NodeConfig<DataTypeEnum extends number> {
    id: NodeIdentification;
    data: NodeConfigDataSet<DataTypeEnum>[];
    get(type: DataTypeEnum): NodeConfigDataSet<DataTypeEnum>[][DataTypeEnum];
}
export declare class Configuration {
}
export declare class ConfigManager {
    constructor();
}
