/// <reference types="node" />
import { EventEmitter } from 'events';
export declare abstract class ShowfileTarget extends EventEmitter {
    abstract targetName(): string;
    beforeShowfileLoad(): void;
    abstract onShowfileLoad(s: Showfile): void;
    abstract onEmptyShowfileCreate(s: Showfile): void;
    afterShowfileLoad(): void;
}
export declare class Showfile {
    constructor();
    getSection(name: string): void;
}
export declare class ShowfileManager {
    targets: ShowfileTarget[];
    dependencies: [string, string][];
    constructor();
    register(t: ShowfileTarget, dependencies?: string[]): void;
    createEmptyShow(name: string): void;
    loadShowfile(): void;
    start(): void;
}
