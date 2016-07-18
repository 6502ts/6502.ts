import {Action} from 'redux';

export const Type = {
    changeName: 'current-cartridge/change-name'
};
Object.freeze(Type);

export interface ChangeNameAction extends Action {
    name: string;
}

export function changeName(name: string) {
    return {
        type: Type.changeName,
        name
    };
}
