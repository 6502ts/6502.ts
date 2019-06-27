import { Container } from 'inversify';

import './AddCartridge';
import './MediaApi';
import './ScrollIntoView';

export function createContainer(): Container {
    return new Container({ autoBindInjectable: true, defaultScope: 'Singleton' });
}
