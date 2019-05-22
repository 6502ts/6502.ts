import Elm from '../../../../elm/src/stellerator/Main.elm';

function main(): void {
    const node = document.getElementById('root');
    Elm.Main.init({ node });
}

window.addEventListener('load', main);
