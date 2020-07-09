import { Requester, Connection } from './communication';
import { NodeModule } from './data';
export interface PluginDescription {
    category: string;
    display_name: string;
    manufacturer: string;
    name: string;
    platform_id: string;
    version: string;
}
export declare class VSTScanner extends NodeModule {
    destroy(): void;
    init(): void;
    start(remote: Connection): void;
    knownPlugins: PluginDescription[];
    requester: Requester;
    constructor();
    waitPluginsScanned(): Promise<boolean>;
    isPluginInList(name: string): boolean;
    findPlugin(name: string): PluginDescription;
}
