declare module 'rangetouch' {
    export interface Options {
        watch?: boolean;
        addCSS?: boolean;
        thumbWidth?: number;
    }

    export default class {
        constructor(target: Element | string, options?: Options);

        static setup(selector: string, options?: Options): any;
    }
}
