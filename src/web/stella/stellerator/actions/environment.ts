import {Action} from 'redux';

export const Type = {
    initialize: 'environment/initialize'
};
Object.freeze(Type);

export interface InitializeAction extends Action {
    helppageUrl: string;
}

export function initialize(helppageUrl: string): InitializeAction {
    return {
        type: Type.initialize,
        helppageUrl
    };
}