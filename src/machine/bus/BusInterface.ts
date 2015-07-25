'use strict';

interface BusInterface {
    read(address: number): number;

    readWord(address: number): number;

    write(address: number, value: number): void;
}

export = BusInterface;
