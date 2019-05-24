import Elm from '../elm/stellerator/Main.elm';
import '../theme/dos.scss';

function main(): void {
    const node = document.getElementById('root');
    Elm.Main.init({ node });
}

window.addEventListener('load', main);
