// tslint:disable-next-line
import * as React from 'react';
import {FormControl} from 'react-bootstrap';

class ValidatingInput extends React.Component<ValidatingInput.Props, ValidatingInput.State> {

    constructor(props?: ValidatingInput.Props, context?: any) {
        super(props, context);

        this.state = {
            rawValue: props.value
        };
    }

    render() {
        return <FormControl
            type="text"
            className={this.props.validator(this.state.rawValue) ? 'valid' : 'invalid'}
            value={this.state.rawValue}
            onChange={(e: React.FormEvent) => this._onChange((e.target as HTMLInputElement).value)}
            onKeyDown={(e: React.KeyboardEvent) => e.keyCode === 13 ? this.props.onKeyEnter() : undefined}
            readOnly={this.props.readOnly}
            style={this.props.style}
        />;
    }

    componentWillReceiveProps(props: ValidatingInput.Props): void {
        this.state.rawValue = props.value;
    }

    private _onChange(newValue: string): void {
        this.setState({rawValue: newValue});

        if (this.props.validator(newValue)) {
            this.props.onChange(newValue);
        }
    }

}

module ValidatingInput {

    export interface Props {
        value?: string;
        readOnly?: boolean;
        style?: {[key: string]: any};

        onChange?: (value: string) => void;
        onKeyEnter?: () => void;
        validator?: (rawValue: string) => boolean;
    }

    export interface State {
        rawValue: string;
    }

    export const defaultProps: Props = {
        value: '',
        readOnly: false,

        onChange: () => undefined,
        onKeyEnter: () => undefined,
        validator: () => true,
    }

}

export default ValidatingInput;