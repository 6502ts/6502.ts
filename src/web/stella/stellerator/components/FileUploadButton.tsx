import * as React from 'react';

class FileUploadButton extends React.Component<FileUploadButton.Props, FileUploadButton.State> {

    render() {
        return <div className="btn btn-default" style={{display: 'inline-block'}}>
            <label htmlFor={this.state.id}>{this.props.children}</label>
            <input type="file" id={this.state.id} style={{display: 'none'}} onChange={this._onChange.bind(this)}/>
        </div>;
    }

    state: FileUploadButton.State = {
        id: `file_upload_${Math.floor(Math.random() * 10000000)}`
    };

    private _onChange(e: Event) {
        this.props.onFilesSelected((e.currentTarget as HTMLInputElement).files);
    }

}

module FileUploadButton {

    export interface Props {
        onFilesSelected?: (files: FileList) => void;
    }

    export interface State {
        id: string;
    }

    export const defaultProps: Props = {
        onFilesSelected: () => undefined
    };

}

export default FileUploadButton;
