class Header {

    constructor(buffer: {[idx: number]: number; length: number}) {
        this.startAddressLow =      buffer[0x2000];
        this.startAddressHigh =     buffer[0x2001];
        this.controlWord =          buffer[0x2002];
        this.blockCount =           buffer[0x2003];
        this.checksum =             buffer[0x2004];
        this.multiloadId =          buffer[0x2005];
        this.progressBarSpeedLow =  buffer[0x2006];
        this.progressBarSpeedHigh = buffer[0x2007];

        this.blockLocation = new Uint8Array(this.blockCount);
        this.blockChecksum = new Uint8Array(this.blockCount);

        for (let i = 0; i < this.blockCount; i++) {
            this.blockLocation[i] = buffer[0x2000 + 16 + i];
            this.blockChecksum[i] = buffer[0x2000 + 64 + i];
        }
    }

    verify(): boolean {
        const checksum =
            this.startAddressLow     +
            this.startAddressHigh    +
            this.controlWord         +
            this.blockCount          +
            this.checksum            +
            this.multiloadId         +
            this.progressBarSpeedLow +
            this.progressBarSpeedHigh;

        return (checksum & 0xFF) === 0x55;
    }

    startAddressLow: number;
    startAddressHigh: number;
    controlWord: number;
    blockCount: number;
    checksum: number;
    multiloadId: number;
    progressBarSpeedLow: number;
    progressBarSpeedHigh: number;

    blockLocation: Uint8Array = null;
    blockChecksum: Uint8Array = null;
}

export default Header;
