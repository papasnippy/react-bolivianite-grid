import * as React from 'react';
import { Toolbar, NavigationItem, GitHubIcon, Page, PageArticles, AppMaxWidth } from './ui';
import { Switch, Route } from 'react-router-dom';

import articlesExample from '~/articles/examples';

const Style = require('./app.scss');

export class App extends React.Component<any, any> {
    public render() {
        return (
            <>
                <Toolbar>
                    <nav>
                        <NavigationItem exact location="/">
                            Home
                        </NavigationItem>
                        <NavigationItem location="/examples">
                            Examples
                        </NavigationItem>
                        <NavigationItem location="/tutorial">
                            Tutorial
                        </NavigationItem>
                        <NavigationItem location="/api">
                            Api
                        </NavigationItem>
                    </nav>
                    <div>
                        <a target="blank" href={process.env.GITHUB_URL}>
                            <GitHubIcon />
                        </a>
                    </div>
                </Toolbar>
                <main className={Style.main}>
                    <Switch>
                        <Route exact path="/">
                            <Page>?Home?</Page>
                        </Route>
                        <Route exact path="/examples/:article?">
                            <PageArticles source={articlesExample} />
                        </Route>
                        <Route exact path="/tutorial/:article?">
                            <Page>?Tutorial?</Page>
                        </Route>
                        <Route exact path="/api/:article?">
                            <Page>?Api?</Page>
                        </Route>
                    </Switch>
                </main>
                <footer className={Style.footer}>
                    <AppMaxWidth classNameLayer={Style.footerContent}>
                        ?Footer?
                    </AppMaxWidth>
                </footer>
            </>
        );
    }
}
