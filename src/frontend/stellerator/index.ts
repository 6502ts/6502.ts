import attachFastclick from 'fastclick';

import Elm from '../elm/Stellerator/Main.elm';
import '../theme/dos.scss';
import { initialize as initializeRangetouch } from '../common/rangetouch';

function main(): void {
    attachFastclick(document.body);
    initializeRangetouch();

    Elm.Stellerator.Main.init({});
}

window.addEventListener('load', main);
