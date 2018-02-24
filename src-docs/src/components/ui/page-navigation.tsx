import * as React from 'react';
import { ScrollView } from '~/components';
import { NavigationItem } from './navigation-item';
const Style = require('./page-navigation.scss');

export interface IPageNavigationProps {
    items: [string, string][];
}

export class PageNavigation extends React.Component<IPageNavigationProps, {}> {
    public render() {
        if (!this.props.items) {
            return null;
        }

        return (
            <ScrollView middleLayer className={Style.root}>
                {this.props.items.map(([location, caption], i) => {
                    return (
                        <NavigationItem orientation="left" exact location={location} key={i}>
                            {caption}
                        </NavigationItem>
                    );
                })}
                {this.props.children}
            </ScrollView>
        );
    }
}
