import attachFastclick from 'fastclick';

import Elm from '../elm/Stellerator/Main.elm';
import '../theme/dos.scss';
import { initialize as initializeRangetouch } from './rangetouch';

function main(): void {
    attachFastclick(document.body);
    initializeRangetouch();

    const node = document.getElementById('root');
    Elm.Stellerator.Main.init({ node });
}

window.addEventListener('load', main);
