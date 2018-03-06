import * as React from 'react';
import { CodeView, ICodeViewProps, Markdown } from './index';
import { TArticle } from '~/app/article';
const Style = require('./page-articles.scss');

export interface IPageArticlesProps {
    source?: TArticle[];
}

export class PageArticles extends React.Component<IPageArticlesProps, any> {
    private _renderList() {
        return (this.props.source || []).map(({ type, data }, i) => {
            switch (type) {
                case 'text':
                    return (
                        <Markdown
                            key={i}
                            className={Style.chunk}
                            source={data as string}
                        />
                    );

                case 'example': {
                    const { files, main } = data as ICodeViewProps;

                    return (
                        <CodeView
                            className={Style.chunk}
                            key={i}
                            files={files}
                            main={main}
                        />
                    );
                }

                case 'component':
                    return null;

                default:
                    return null;
            }
        });
    }

    public render() {
        return (
            <article className={Style.body}>
                {this._renderList()}
            </article>
        );
    }
}
