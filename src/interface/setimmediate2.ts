declare module 'setimmediate2' {

    export function setImmediate(callback: (...args: any[]) => void, ...args: any[]): any;

    export function clearImmediate(immediateId: any): void;

}
