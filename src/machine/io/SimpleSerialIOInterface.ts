'use strict';

interface SimpleSerialIOInterface {

    setOutCallback(callback: SimpleSerialIOInterface.OutCallbackInterface): SimpleSerialIOInterface;

    getOutCallback(): SimpleSerialIOInterface.OutCallbackInterface;

    setInCallback(callback: SimpleSerialIOInterface.InCallbackInterface): SimpleSerialIOInterface;

    getInCallback(): SimpleSerialIOInterface.InCallbackInterface;
}


module SimpleSerialIOInterface {

    export interface OutCallbackInterface {
        (data: number, source: SimpleSerialIOInterface): void;
    }

    export interface InCallbackInterface {
        (dest: SimpleSerialIOInterface): number;
    }
}

export = SimpleSerialIOInterface;
