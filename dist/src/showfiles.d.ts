/// <reference types="node" />
import { EventEmitter } from 'events';
export declare abstract class ShowfileTarget extends EventEmitter {
    abstract targetName(): string;
    beforeShowfileLoad(): void;
    abstract onShowfileLoad(s: Showfile): void;
    abstract onEmptyShowfileCreate(s: Showfile): void;
    afterShowfileLoad(): void;
}
export declare abstract class ShowfileRecord {
    _name: string;
    _data: any;
    _uid: string;
    abstract plain(): any;
    abstract restore(data: any): void;
    abstract save(): any;
    abstract build(data: any): void;
}
export declare class ShowfileSection {
    private _name;
    private _uid;
    private _records;
    constructor(name?: string);
    name(): string;
    id(): string;
    plain(): any;
}
export declare class Showfile {
    _sections: ShowfileSection[];
    _created: string;
    constructor();
    init(): void;
    getSectionByName(name: string): ShowfileSection;
    getSectionById(id: string): ShowfileSection;
    replace(id: string, sect: ShowfileSection): boolean;
    toString(): string;
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
