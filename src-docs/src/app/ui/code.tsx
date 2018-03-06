import * as React from 'react';
import * as Prism from 'prismjs';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-typescript';
const Style = require('./code.scss');

export interface ICodeProps {
    className?: string;
    language: string;
    source: string;
}

export class Code extends React.PureComponent<ICodeProps, any> {
    private _highlight() {
        const { source, language } = this.props;
        return Prism.languages[language] ? Prism.highlight(source, Prism.languages[language]) : '';
    }

    public render() {
        return (
            <div className={this.props.className}>
                <pre className={Style.root}>
                    <code dangerouslySetInnerHTML={{ __html: this._highlight() }} />
                </pre>
            </div>
        );
    }
}

