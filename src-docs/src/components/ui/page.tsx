import * as React from 'react';
import { NavigationItem, AppMaxWidth } from './index';
const Style = require('./page.scss');

export interface IPageProps {
    navigation?: [string, string][];
}

export class Page extends React.Component<IPageProps, {}> {
    private _renderNavigation() {
        if (!this.props.navigation) {
            return null;
        }

        return (
            <nav className={Style.navigtaion}>
                {this.props.navigation.map(([location, caption], i) => {
                    return (
                        <NavigationItem orientation="left" exact location={location} key={i}>
                            {caption}
                        </NavigationItem>
                    );
                })}
            </nav>
        );
    }

    public render() {
        return (
            <AppMaxWidth classNameLayer={Style.content}>
                {this._renderNavigation()}
                {this.props.children}
            </AppMaxWidth>
        );
    }
}
