interface GeneratorInterface {

    single(): number;

    double(): number;

    int32(): number;

    int(max: number): number;

    saveState(): any;

}

export default GeneratorInterface;