import { Ports } from '../elm/Stellerator/Main.elm';

export function initAddCartridge(ports: Ports): void {
    const input = document.createElement('input');
    input.type = 'file';

    ports.addCartridge_.subscribe(() => input.click());
}
