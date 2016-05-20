import DebuggerCLI from '../src/cli/DebuggerCLI';
import NodeCLIRunner  from '../src/cli/NodeCLIRunner';
import NodeFilesystemProvider from '../src/fs/NodeFilesystemProvider';

const fsProvider = new NodeFilesystemProvider(),
    cli = new DebuggerCLI(fsProvider),
    runner = new NodeCLIRunner(cli);

runner.startup();

if (process.argv.length > 2) cli.runDebuggerScript(process.argv[2]);
