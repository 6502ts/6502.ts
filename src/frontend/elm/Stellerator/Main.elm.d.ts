interface ElmOptions {
    node: Element;
}

interface Main {
    init(options: ElmOptions): void;
}

declare module Elm {
    export module Stellerator {
        const Main: Main;
    }
}

export default Elm;
