/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2017 Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

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
        return <div
            dangerouslySetInnerHTML={{__html: this.state.content}}
            className={this.props.className}
        />;
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
    };

    private static _cache: {[url: string]: string} = {};

}

namespace Markdown {

    export interface Props extends React.HTMLProps<any> {
        url?: string;
        useCache?: boolean;

        onMarkdownError?: (e: Error) => void;
    }

    export interface State {
        content: string;
    }

}

export default Markdown;
