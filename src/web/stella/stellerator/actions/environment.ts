import {Action} from 'redux';

export const Type = {
    initialize: 'environment/initialize'
};
Object.freeze(Type);

export interface InitializeAction extends Action {
    helppageUrl: string;
    buildId: string;
}

export function initialize(
    {
        helppageUrl,
        buildId
    }:
    {
        helppageUrl: string,
        buildId: string
    }
): InitializeAction {
    return {
        type: Type.initialize,
        helppageUrl,
        buildId
    };
}