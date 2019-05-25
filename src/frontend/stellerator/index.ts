import Elm from '../elm/Stellerator/Main.elm';
import '../theme/dos.scss';

function main(): void {
    const node = document.getElementById('root');
    Elm.Stellerator.Main.init({ node });
}

window.addEventListener('load', main);
