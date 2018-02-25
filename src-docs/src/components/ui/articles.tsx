import * as React from 'react';
import * as Markdown from 'react-markdown';
import { PageNavigation, Page, CodeView, ICodeViewProps } from './index';
import { Switch, Route } from 'react-router-dom';
import { IArticlesSource } from '~/articles';
const Style = require('./articles.scss');

export interface IArticlesProps {
    source?: IArticlesSource;
}

export interface IArticlesState {
    navigation?: [string, string][];
    articles?: {
        url: string;
        body: (string | ICodeViewProps)[];
    }[];
}

export class Articles extends React.Component<IArticlesProps, IArticlesState> {
    state: IArticlesState = {};

    private _onUpdate(prev: IArticlesProps, next: IArticlesProps) {
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
                    <div
                        className={Style.chunk}
                        key={i}
                    >
                        <Markdown
                            source={p || ''}
                        />
                    </div>
                );
            }

            const { files, example, height } = p;

            return (
                <CodeView
                    className={Style.chunk}
                    key={i}
                    files={files}
                    example={example}
                    height={height}
                />
            );
        });
    }

    public componentDidMount() {
        this._onUpdate({}, this.props);
    }

    public componentDidUpdate(prev: IArticlesProps) {
        this._onUpdate(prev, this.props);
    }

    public render() {
        if (!this.state.articles) {
            return null;
        }

        return (
            <Page>
                <PageNavigation items={this.state.navigation} />
                <Switch>
                    {this.state.articles.map(({ url, body }) => {
                        return (
                            <Route exact path={url} key={url}>
                                <div className={Style.body}>
                                    {this._renderArticle(body)}
                                </div>
                            </Route>
                        );
                    })};
                </Switch>
            </Page>
        );
    }
}
