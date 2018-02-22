import * as React from 'react';
import { AppMaxWidth } from './app-max-width';
import { NavigationItem } from './navigation-item';
import { ScrollView } from 'react-bolivianite-grid';
const Style = require('./page.scss');

export interface IPageProps {

}

export class Page extends React.Component<IPageProps, {}> {
    public render() {
        return (
            <div className={Style.root}>
                <ScrollView
                    lock="y"
                    hover={100}
                    theme={{
                        scrollSize: 15,
                        scrollSizeMinimized: 5,
                        thumbBackground: `rgba(255, 255, 255, 0.3)`
                    }}
                >
                    <AppMaxWidth>
                        {this.props.children}
                        <div style={{ height: '300vh' }} />
                        <div
                            style={{
                                position: 'fixed',
                                height: 200,
                                width: 200,
                                marginTop: 25
                            }}
                        >
                            <NavigationItem orientation="left" exact location="/examples/1">
                                Example 1
                            </NavigationItem>
                            <NavigationItem orientation="left" exact location="/examples/2">
                                Example 2
                            </NavigationItem>
                            <NavigationItem orientation="left" exact location="/examples/3">
                                Example 3
                            </NavigationItem>
                            <NavigationItem orientation="left" exact location="/examples/4">
                                Example 4
                            </NavigationItem>
                        </div>
                    </AppMaxWidth>
                </ScrollView>
            </div>
        );
    }
}
