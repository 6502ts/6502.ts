interface ElmOptions {
    node: Element;
}

interface Main {
    init(options: ElmOptions): void;
}

declare module Elm {
    export module UiPlayground {
        const Main: Main;
    }
}

export default Elm;
