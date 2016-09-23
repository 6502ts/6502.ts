import * as React from 'react';
import * as commonmark from 'commonmark';

class Markdown extends React.Component<Markdown.Props, Markdown.State> {

    constructor(props?: Markdown.Props, context?: any) {
        super(props, context);

        this.state = {
            content: ''
        };
    }

    componentWillMount(): void {
        this._loadSource()
            .then(source => {
                const parser = new commonmark.Parser(),
                    renderer = new commonmark.HtmlRenderer();

                this.setState({
                    content: renderer.render(parser.parse(source))
                });
            })
            .then(undefined, (e: Error) => this.props.onMarkdownError(e));
    }

    render() {
        return <div dangerouslySetInnerHTML={{__html: this.state.content}}/>;
    }

    private _loadSource(): Promise<string> {
        return (this.props.useCache && Markdown._cache[this.props.url]) ?
            Promise.resolve(Markdown._cache[this.props.url]) :
            Promise.resolve($.ajax({
                url: this.props.url,
                dataType: 'text'
            })).then(source => Markdown._cache[this.props.url] = source);
    }

    static defaultProps: Markdown.Props = {
        url: '',
        useCache: true,
        onMarkdownError: (e: Error): void => console.error(e.message)
    }

    private static _cache: {[url: string]: string} = {};

}

module Markdown {

    export interface Props extends React.HTMLProps<any> {
        url?: string,
        useCache?: boolean,

        onMarkdownError?: (e: Error) => void;
    }

    export interface State {
        content: string;
    }

}

export default Markdown;