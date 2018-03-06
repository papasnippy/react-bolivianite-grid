import * as React from 'react';
const Style = require('./code.scss');

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
                <pre className={Style.root}>
                    <code>
                        {this.props.source || ''}
                    </code>
                </pre>
            </div>
        );
    }
}

