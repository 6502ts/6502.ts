import {Action} from 'redux';

import Environment from '../state/Environment';

import {
    Type as Actions,
    InitializeAction
} from '../actions/environment';

export default function reducer(state: Environment = new Environment(), action: Action): Environment {
    switch (action.type) {
        case Actions.initialize:
            return initialize(state, action as InitializeAction);

        default: return state;
    }
}

function initialize(state: Environment, action: InitializeAction): Environment {
    return new Environment({helppageUrl: action.helppageUrl}, state);
}