import Rangetouch from 'rangetouch';

const instances = new WeakMap<Element, Rangetouch>();

function registerOne(target: Element): void {
    if (!instances.has(target)) {
        instances.set(target, new Rangetouch(target, { watch: false, addCSS: false, thumbWidth: 8 }));
    }
}

function registerRecursive(target: Element): void {
    const selector = 'input[type=range]';

    if (target.matches && target.matches(selector)) {
        registerOne(target);
    }

    target.querySelectorAll && target.querySelectorAll(selector).forEach(registerOne);
}

let observer: MutationObserver | null = null;

export function initialize(): void {
    if (observer) {
        return;
    }

    registerRecursive(document.body);

    observer = new MutationObserver(mutations =>
        mutations.forEach(mutation => mutation.addedNodes.forEach(registerRecursive))
    );

    observer.observe(document.body, {
        attributes: false,
        characterData: false,
        childList: true,
        subtree: true
    });
}
