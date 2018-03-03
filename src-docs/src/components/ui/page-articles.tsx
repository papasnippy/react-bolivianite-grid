import * as React from 'react';
import { Page, CodeView, ICodeViewProps, Markdown } from './index';
import { Switch, Route } from 'react-router-dom';
import { IArticlesSource } from '~/articles';
const Style = require('./page-articles.scss');

export interface IPageArticlesProps {
    source?: IArticlesSource;
}

export interface IPageArticlesState {
    navigation?: [string, string][];
    articles?: {
        url: string;
        body: (string | ICodeViewProps)[];
    }[];
}

export class PageArticles extends React.Component<IPageArticlesProps, IPageArticlesState> {
    state: IPageArticlesState = {};

    private _onUpdate(prev: IPageArticlesProps, next: IPageArticlesProps) {
        if (prev.source === next.source || !next.source) {
            return;
        }

        const { url, articles: body } = next.source;

        let navigation: [string, string][] = [];
        let articles: {
            url: string;
            body: (string | ICodeViewProps)[];
        }[] = [];

        body.forEach(({ name, caption, body: article }) => {
            const loc = name ? `/${url}/${name}` : `/${url}`;

            if (name) {
                navigation.push([loc, caption]);
            }

            articles.push({
                url: loc,
                body: article
            });
        });

        this.setState({ navigation, articles });
    }

    private _renderArticle(body: (string | ICodeViewProps)[]): JSX.Element[] {
        return body.map((p, i) => {
            if (typeof p === 'string') {
                return (
                    <Markdown
                        key={i}
                        className={Style.chunk}
                        source={p}
                    />
                );
            }

            const { files, main, height } = p;

            return (
                <CodeView
                    className={Style.chunk}
                    key={i}
                    files={files}
                    main={main}
                    height={height}
                />
            );
        });
    }

    public componentDidMount() {
        this._onUpdate({}, this.props);
    }

    public componentDidUpdate(prev: IPageArticlesProps) {
        this._onUpdate(prev, this.props);
    }

    public render() {
        if (!this.state.articles) {
            return null;
        }

        return (
            <Page navigation={this.state.navigation}>
                <Switch>
                    {this.state.articles.map(({ url, body }) => {
                        return (
                            <Route exact path={url} key={url}>
                                <article className={Style.body}>
                                    {this._renderArticle(body)}
                                </article>
                            </Route>
                        );
                    })};
                </Switch>
            </Page>
        );
    }
}
