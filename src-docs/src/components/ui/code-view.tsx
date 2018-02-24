import * as React from 'react';
import Code from 'react-syntax-highlighter';
const CodeTheme = require('react-syntax-highlighter/styles/hljs/dark');
const Style = require('./code-view.scss');

export type ICodeViewFile = (
    string |
    {
        filename: string;
        caption?: string;
        language?: string;
    }
);

export interface ICodeViewProps {
    files: ICodeViewFile[];
    example: string;
}

export class CodeView extends React.PureComponent<ICodeViewProps, any> {
    private _renderFileContent(file: ICodeViewFile) {
        let filename = '';
        let language = 'typescript-tsx';

        if (typeof file === 'string') {
            filename = file;
        } else {
            filename = file.filename;
            language = file.language || language;
        }

        const content = require('raw-loader!~/article/' + filename);

        return (
            <Code language={language} style={CodeTheme}>
                {content || ''}
            </Code>
        );
    }

    public render() {
        return (
            <div className={Style.root}>
                <div>
                </div>
            </div>
        );
    }
}

