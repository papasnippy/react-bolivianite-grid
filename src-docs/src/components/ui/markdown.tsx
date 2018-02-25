import * as React from 'react';
import * as MDRenderer from 'react-markdown';
import { Code } from './index';

const Style = require('./markdown.scss');

export interface IMarkdownProps {
    source?: string;
}

interface IRenderer {
    children?: any;
    language: string;
    value: string;
}

export class Markdown extends React.Component<IMarkdownProps, any> {
    private _codeInlineRenderer = ({ value }: IRenderer) => {
        return (
            <code className={Style.code}>
                {value}
            </code>
        );
    }

    private _codeMultilineRenderer = ({ language, value }: IRenderer) => {
        return (
            <Code
                className={Style.multilineCode}
                showLineNumbers
                language={language}
                source={value}
            />
        );
    }

    public render() {
        return (
            <MDRenderer
                className={Style.main}
                source={this.props.source || ''}
                renderers={{
                    inlineCode: this._codeInlineRenderer,
                    code: this._codeMultilineRenderer
                }}
            />
        );
    }
}
