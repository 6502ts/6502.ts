import GeneratorInterface from './GeneratorInterface';

interface SeedrandomPrng {
  quick(): number;
  int32(): number;
  double(): number;
  state(): any;
}

class SeedrandomGenerator implements GeneratorInterface {

    constructor(
        private _rng: SeedrandomPrng
    ) {}

    single(): number {
        return this._rng.quick();
    }

    double(): number {
        return this._rng.double();
    }

    int32(): number {
        return this._rng.int32();
    }

    int(max: number) {
        return (this._rng.int32() >>> 0) % (max + 1);
    }

    saveState(): any {
        return this._rng.state();
    }

}

export default SeedrandomGenerator;