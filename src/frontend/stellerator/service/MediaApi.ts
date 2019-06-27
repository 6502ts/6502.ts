import { injectable } from 'inversify';
import { Ports } from '../../elm/Stellerator/Main.elm';

@injectable()
class MediaApi {
    init(ports: Ports): void {
        this._ports = ports;

        ports.watchMedia_.subscribe(this._watchMedia);
    }

    private _watchMedia = (queryList: Array<string>): void => {
        this._queries.forEach(q => {
            if (q.removeEventListener) {
                q.removeEventListener('change', this._updateQueries);
            } else {
                q.removeListener(this._updateQueries);
            }
        });

        this._queries = queryList.map(q => matchMedia(q));
        this._queries.forEach(q => {
            if (q.removeEventListener) {
                q.addEventListener('change', this._updateQueries);
            } else {
                q.addListener(this._updateQueries);
            }
        });

        this._updateQueries();
    };

    private _updateQueries = (): void => this._ports.mediaUpdate_.send(this._queries.map(q => q.matches));

    private _ports: Ports;
    private _queries: Array<MediaQueryList> = [];
}

export default MediaApi;
