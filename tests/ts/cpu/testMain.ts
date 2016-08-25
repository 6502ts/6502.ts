import {run as testBranches} from './testBranches';
import {run as testFlagToggles} from './testFlagToggles';
import {run as testArithmetics} from './testArithmetics';
import {run as testOtherOpcodes} from './testOtherOpcodes';

suite('CPU', function() {

    testBranches();

    testFlagToggles();

    testArithmetics();

    testOtherOpcodes();

});