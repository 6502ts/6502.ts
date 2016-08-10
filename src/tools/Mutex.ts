class Mutex {

    acquire(): Promise<Mutex.Releaser> {
        const ticket = new Promise(resolve => this._queue.push(resolve));

        if (!this._pending) {
            this._dispatchNext();
        }

        return ticket;
    }

    runExclusive<T>(callback: Mutex.Worker<T>): Promise<T> {
        return this
            .acquire()
            .then(release => {
                    let result: T|Promise<T>;

                    try {
                        result = callback();
                    } catch (e) {
                        release();
                        throw(e);
                    }

                    return Promise
                        .resolve(result)
                        .then(
                            (x: T) => (release(), x),
                            e => {
                                release();
                                throw e;
                            }
                        );
                }
            );
    }

    private _dispatchNext(): void {
        if (this._queue.length > 0) {
            this._pending = true;
            this._queue.shift()(this._dispatchNext.bind(this));
        } else {
            this._pending = false;
        }
    }

    private _queue: Array<Mutex.Dispatcher> = [];
    private _pending = false;

}

module Mutex {

    export interface Releaser {
        (): void;
    }

    export interface Dispatcher {
        (release: Releaser): void;
    }

    export interface Worker<T> {
        (): Promise<T>|T;
    }

}

export default Mutex;
