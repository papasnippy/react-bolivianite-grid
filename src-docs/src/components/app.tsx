import * as React from 'react';
import { Toolbar, NavigationItem, GitHubIcon, Page } from './ui';
import { Switch, Route } from 'react-router-dom';
const Style = require('./app.scss');

export class App extends React.Component<any, any> {
    public render() {
        return (
            <div className={Style.root}>
                <Toolbar>
                    <div>
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
                    </div>
                    <div>
                        <a target="blank" href="https://github.com/papasnippy/react-bolivianite-grid">
                            <GitHubIcon />
                        </a>
                    </div>
                </Toolbar>
                <div className={Style.content}>
                    <Switch>
                        <Route exact path="/">
                            <div>?Home?</div>
                        </Route>
                        <Route exact path="/examples/:article?">
                            <Page>?Examples?</Page>
                        </Route>
                        <Route exact path="/tutorial/:article?">
                            <div>?Tutorial?</div>
                        </Route>
                        <Route exact path="/api/:article?">
                            <div>?Api?</div>
                        </Route>
                    </Switch>
                </div>
            </div>
        );
    }
}
