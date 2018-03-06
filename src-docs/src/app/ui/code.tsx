import * as React from 'react';
import CodeHighlighter from 'react-syntax-highlighter';
const CodeTheme = require('react-syntax-highlighter/styles/hljs/obsidian');

const CODE_STYLE_PROPS: React.CSSProperties = {
    margin: 0,
    boxSizing: 'border-box',
    overflowY: 'visible',
    overflowX: 'visible',
    display: 'block',
    background: 'transparent'
};

export interface ICodeProps {
        className?: string;
    showLineNumbers?: boolean;
    language: string;
    source: string;
}

export class Code extends React.PureComponent<ICodeProps, any> {
    public render() {
        return (
            <div className={this.props.className}>
                <CodeHighlighter
                    showLineNumbers={this.props.showLineNumbers}
                    language={this.props.language}
                    style={CodeTheme.default}
                    customStyle={CODE_STYLE_PROPS}
                >
                    {this.props.source || ''}
                </CodeHighlighter>
            </div>
        );
    }
}

