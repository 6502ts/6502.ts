declare function suite(name: string, implementation: Mocha.SuiteImplementation): void;

declare function test(name:string, implementation: Mocha.SuiteImplementation): void;

declare function setup(implementation: Mocha.SetupImplementation): void;

declare function teardown(implementation: Mocha.TeardownImplementation): void;

declare module Mocha {

    export interface SuiteImplementation {
        (): void;
    }

    export interface TestImplementation {
        (): void;
    }

    export interface SetupImplementation {
        (): void;
    }

    export interface TeardownImplementation {
        (): void;
    }

}
