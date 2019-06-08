import attachFastclick from 'fastclick';

import Elm from '../elm/UiPlayground/Main.elm';
import '../theme/dos.scss';
import { initialize as initializeRangetouch } from '../common/rangetouch';

function main(): void {
    attachFastclick(document.body);
    initializeRangetouch();

    const node = document.getElementById('root');
    Elm.UiPlayground.Main.init({ node });
}

window.addEventListener('load', main);
