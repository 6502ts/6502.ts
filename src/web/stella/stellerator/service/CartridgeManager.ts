import {Middleware} from 'redux';

interface CartridgeManager {

    getMiddleware(): Middleware;

}

export default CartridgeManager;
