import * as React from 'react';
import * as classnames from 'classnames';
import { NavLink } from 'react-router-dom';
import { Toolbar, PageArticles, AppMaxWidth } from './ui';
import { GitHubIcon, MenuIcon } from './icons';
import { Switch, Route } from 'react-router-dom';
import { IArticleMap } from './article';

const Style = require('./app.scss');

export interface IAppProps {
    source: IArticleMap;
}

export class App extends React.Component<IAppProps, any> {
    state = {
        menuOpened: false
    };

    private _toggleMenu = () => {
        this.setState({ menuOpened: !this.state.menuOpened });
    }

    private _hideMenu = () => {
        this.setState({ menuOpened: false });
    }

    private _renderNavigation() {
        const { source } = this.props;
        return (
            <nav
                className={classnames(Style.navigation, {
                    [Style.navigationOpened]: this.state.menuOpened
                })}
            >
                {source.map((item) => {
                    const url = `/${item.url}`;

                    return (
                        <NavLink exact to={url} key={url} onClick={this._hideMenu}>
                            <span style={{ '--nav-deep': item.deep } as any}>
                                {item.caption}
                            </span>
                        </NavLink>
                    );
                })}
            </nav>
        );
    }

    private _renderRoutes() {
        const { source } = this.props;
        return source.map((item) => {
            const url = `/${item.url}`;

            return (
                <Route exact path={url} key={url}>
                    <PageArticles source={item.body} />
                </Route>
            );
        });
    }

    /*public componentDidMount() {
        // Math.max(0, 37 - ((document.body.children[0] as any).offsetHeight - window.innerHeight - window.scrollY))
        window.addEventListener('scroll', () => {
            this.forceUpdate();
        });
    }*/

    public render() {
        return (
            <>
                <Toolbar>
                    <div>
                        <MenuIcon
                            className={classnames(Style.menu, {
                                [Style.menuOpened]: this.state.menuOpened
                            })}
                            onClick={this._toggleMenu}
                        />
                    </div>
                    <div>
                        <a target="blank" href={process.env.GITHUB_URL}>
                            <GitHubIcon />
                        </a>
                    </div>
                </Toolbar>
                <main className={Style.main}>
                    <AppMaxWidth classNameLayer={Style.content}>
                        {this._renderNavigation()}
                        <Switch>
                            {this._renderRoutes()}
                        </Switch>
                    </AppMaxWidth>
                </main>
                <footer className={Style.footer}>
                    <AppMaxWidth classNameLayer={Style.footerContent}>
                    </AppMaxWidth>
                </footer>
            </>
        );
    }
}
