import * as React from 'react';
import * as MDRenderer from 'react-markdown';
import * as classnames from 'classnames';
import { Link } from 'react-router-dom';
import { Code, CodeView } from './index';

const Style = require('./markdown.scss');

export interface IMarkdownProps {
    className?: string;
    source?: string;
}

interface IRenderer {
    children?: any;
    language?: string;
    value?: string;
    columnAlignment?: string[];
    href?: string;
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
        switch (language) {
            case 'app.example': {
                let d: {
                    main: string;
                    files?: string[][];
                } = JSON.parse(value);

                return (
                    <CodeView
                        main={d.main}
                        files={d.files}
                    />
                );
            }

            case 'app.file': {
                let d: {
                    file: string;
                    language: string;
                } = JSON.parse(value);

                language = d.language;
                value = require('!raw-loader!~Content/' + d.file);
            }

            default:
                return (
                    <Code
                        className={Style.multilineCode}
                        language={language}
                        source={value}
                    />
                );
        }
    }

    private _tableRenderer = ({ children }: IRenderer) => {
        return (
            <div className={Style.table}>
                <table>
                    {children}
                </table>
            </div>
        );
    }

    private _linkRenderer = ({ href, children }: IRenderer) => {
        if (href[0] === '#') {
            return <a href={href}>{children}</a>;
        }

        if (href.slice(0, 4) === 'http') {
            return <a href={href} target="_blank">{children}</a>;
        }

        return <Link to={href}>{children}</Link>;
    }

    public render() {
        return (
            <MDRenderer
                escapeHtml={false}
                className={classnames(Style.main, this.props.className)}
                source={this.props.source || ''}
                renderers={{
                    inlineCode: this._codeInlineRenderer,
                    code: this._codeMultilineRenderer,
                    table: this._tableRenderer,
                    link: this._linkRenderer
                }}
            />
        );
    }
}
