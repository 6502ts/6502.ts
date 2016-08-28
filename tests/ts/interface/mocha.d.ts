declare function suite(name: string, implementation: Mocha.SuiteImplementation): void;

declare function test(name:string, implementation: Mocha.TestImplementation): void;

declare function setup(implementation: Mocha.SetupImplementation): void;

declare function teardown(implementation: Mocha.TeardownImplementation): void;

declare module Mocha {

    export interface ReadyCallback {
        (e?: any): any;
    }

    export interface SuiteImplementation {
        (): any;
    }

    export interface TestImplementation {
        (cb: ReadyCallback): any;
    }

    export interface SetupImplementation {
        (cb: ReadyCallback): any;
    }

    export interface TeardownImplementation {
        (cb: ReadyCallback): any;
    }

}
