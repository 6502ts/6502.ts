import { Ports } from '../elm/Stellerator/Main.elm';

export function initMediaApi(ports: Ports): void {
    let queries: Array<MediaQueryList> = [];

    const updateQueries = () => ports.mediaUpdate_.send(queries.map(q => q.matches));

    ports.watchMedia_.subscribe(queryList => {
        queries.forEach(q => {
            if (q.removeEventListener) {
                q.removeEventListener('change', updateQueries);
            } else {
                q.removeListener(updateQueries);
            }
        });

        queries = queryList.map(q => matchMedia(q));
        queries.forEach(q => {
            if (q.removeEventListener) {
                q.addEventListener('change', updateQueries);
            } else {
                q.addListener(updateQueries);
            }
        });

        updateQueries();
    });
}
