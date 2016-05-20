import StellaCLI from '../src/cli/StellaCLI';
import NodeCLIRunner from '../src/cli/NodeCLIRunner';
import NodeFilesystemProvider from '../src/fs/NodeFilesystemProvider';

if (process.argv.length < 3) {
    console.log('usage: stellaCLI.ts cartridge_file [debugger_script]');
    process.exit(1);
}

const cartridgeFile = process.argv[2];

const fsProvider = new NodeFilesystemProvider(),
    cli = new StellaCLI(fsProvider, cartridgeFile),
    runner = new NodeCLIRunner(cli);

runner.startup();

if (process.argv.length > 3) cli.runDebuggerScript(process.argv[3]);
