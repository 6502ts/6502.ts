import attachFastclick from 'fastclick';

import Elm from '../elm/Stellerator/Main.elm';
import '../theme/dos.scss';
import { initialize as initializeRangetouch } from '../common/rangetouch';
import { initMediaApi } from './mediaApi';

function main(): void {
    attachFastclick(document.body);
    initializeRangetouch();

    const { ports } = Elm.Stellerator.Main.init();

    initMediaApi(ports);
}

window.addEventListener('load', main);
