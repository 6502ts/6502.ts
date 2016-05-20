import * as pathlib from 'path';

abstract class AbstractFileSystemProvider {

    pushd(path?: string): void {
        this._directoryStack.unshift(this._cwd);

        if (typeof(path) !== 'undefined') this.chdir(path);
    }

    popd(): string {
        if (this._directoryStack.length === 0) return;

        const targetDir = this._directoryStack.shift();

        this.chdir(targetDir);

        return targetDir;
    }

    cwd(): string {
        return this._cwd;
    }

    chdir(path: string): void {
        this._cwd = this._resolvePath(path);
    }

    protected _resolvePath(path: string): string {
        return pathlib.resolve(this._cwd, path);
    }

    protected _directoryStack: Array<string> = [];
    protected _cwd = '/';
}

export default AbstractFileSystemProvider;
