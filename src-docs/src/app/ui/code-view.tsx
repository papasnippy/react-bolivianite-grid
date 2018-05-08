import * as React from 'react';
import * as classnames from 'classnames';
import { Code } from './index';
const Style = require('./code-view.scss');

export type ICodeViewFile = (
    string | string[]
);

export interface ICodeViewProps {
    files: ICodeViewFile[];
    main: string;
}

export interface ICodeViewElementProps {
    className?: string;
}

export class CodeView extends React.PureComponent<ICodeViewProps & ICodeViewElementProps, any> {
    state = {
        tab: 0
    };

    private _refControls: HTMLElement = null;

    private _onRef = (r: HTMLElement) => {
        this._refControls = r;
    }

    private _extractFile(file: ICodeViewFile) {
        let filename = '';
        let language = 'javascript';
        let caption = '';

        if (typeof file === 'string') {
            filename = file;
            caption = file;
        } else {
            filename = file[0];
            language = file[1] || language;
            caption = file[2] || filename;
        }

        return { filename, language, caption };
    }

    private _renderFileContent() {
        let file = (this.props.files || [])[this.state.tab];

        if (!file) {
            return null;
        }

        const { filename, language } = this._extractFile(file);

        const content = require('!raw-loader!~Content/' + filename);

        return (
            <Code
                className={Style.file}
                language={language}
                source={content}
            />
        );
    }

    private _renderArticle() {
        if (!this.props.main) {
            return null;
        }

        const content = require('~Content/' + this.props.main);
        const D = content && content.default;

        if (!D) {
            return null;
        }

        return <D refControls={this._refControls} />;
    }

    private _renderTabs() {
        if (!this.props.files) {
            return null;
        }

        return this.props.files.map((file, tab) => {
            const { caption } = this._extractFile(file);
            return (
                <button
                    key={tab}
                    className={classnames(Style.tab, {
                        [Style.tabSelected]: tab === this.state.tab
                    })}
                    onClick={() => {
                        this.setState({ tab });
                    }}
                >
                    {caption}
                </button>
            );
        });
    }

    public componentDidMount() {
        if (this._refControls) {
            this.forceUpdate();
        }
    }

    public render() {
        const article = this._renderArticle();
        const files = this._renderFileContent();

        return (
            <div
                area-hidden="true"
                className={classnames(Style.root, this.props.className)}
            >
                {!!files &&
                    <div className={Style.panel}>
                        <div className={Style.tabs}>
                            {this._renderTabs()}
                        </div>
                    </div>
                }
                <div className={Style.example}>
                    {!!files &&
                        <div className={classnames(Style.container, Style.code)}>
                            {files}
                        </div>
                    }
                    {!!article &&
                        <>
                            <div className={Style.controls} ref={this._onRef} />
                            <div className={Style.container}>
                                {this._renderArticle()}
                            </div>
                        </>
                    }
                </div>
            </div>
        );
    }
}
