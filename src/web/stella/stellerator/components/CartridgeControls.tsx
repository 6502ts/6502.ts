// tslint:disable-next-line
import * as React from 'react';

import {
    Button
} from 'react-bootstrap';

import FileUploadButton from './FileUploadButton';

function CartridgeControls(props: CartridgeControls.Props) {
    return <div className="cartridge-controls">
        <FileUploadButton
            onFilesSelected={files => files.length === 1 ? props.onCartridgeUploaded(files[0]) : undefined}
        >Load</FileUploadButton>
        <Button
            disabled={!props.active}
            onClick={props.onDelete}
        >Delete</Button>
        <Button
            disabled={!props.active || !props.changes}
            onClick={props.onSave}
        >Save</Button>
        <Button
            disabled={!props.active}
            onClick={props.onRun}
        >
            {props.changes ? 'Save & Run' : 'Run'}
        </Button>
    </div>;
}

module CartridgeControls {

    export interface Props {

        active?: boolean;
        changes?: boolean;

        onDelete?: () => void;
        onSave?: () => void;
        onRun?: () => void;
        onCartridgeUploaded?: (file: File) => void;

    }

    export const defaultProps: Props = {
        active: false,
        changes: false,
        onDelete: (): void => undefined,
        onSave: (): void => undefined,
        onRun: (): void => undefined,
        onCartridgeUploaded: (): void => undefined
    };

}

export default CartridgeControls;
