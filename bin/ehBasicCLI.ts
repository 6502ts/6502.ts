import EhBasicCLI from '../src/cli/EhBasicCLI';
import NodeCLIRunner from '../src/cli/NodeCLIRunner';
import NodeFilesystemProvider from '../src/fs/NodeFilesystemProvider';

const fsProvider = new NodeFilesystemProvider(),
    cli = new EhBasicCLI(fsProvider),
    runner = new NodeCLIRunner(cli);

runner.startup();

if (process.argv.length > 2) cli.runDebuggerScript(process.argv[2]);
if (process.argv.length > 3) cli.readBasicProgram(process.argv[3]);
