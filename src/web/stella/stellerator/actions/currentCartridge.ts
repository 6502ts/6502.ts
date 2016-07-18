import {Action} from 'redux';

export enum Type {
    changeName
}

export interface ChangeNameAction extends Action {
    name: string;
}

export function changeName(name: string) {
    return {
        type: Type.changeName,
        name
    };
}
