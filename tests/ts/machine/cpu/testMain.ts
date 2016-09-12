import {run as testBranches} from './testBranches';
import {run as testFlagToggles} from './testFlagToggles';
import {run as testArithmetics} from './testArithmetics';
import {run as testOtherOpcodes} from './testOtherOpcodes';
import {run as testAccessPatterns} from './testAccessPatterns';
import {run as testUndocumentedOpcodes} from './testUndocumentedOpcodes';

suite('CPU', function() {

    suite('opcodes', function() {
        testBranches();

        testFlagToggles();

        testArithmetics();

        testOtherOpcodes();
    });

    suite('undocumented opcodes', function() {
        testUndocumentedOpcodes();
    });

    suite('memory access patterns', function() {
        testAccessPatterns();
    });

});