import * as React from 'react';
import { ScrollView, AppMaxWidth } from './index';
const Style = require('./page.scss');

export interface IPageProps {
}

export class Page extends React.Component<IPageProps, {}> {
    public render() {
        return (
            <div className={Style.root}>
                <ScrollView>
                    <AppMaxWidth classNameLayer={Style.content}>
                        {this.props.children}
                    </AppMaxWidth>
                </ScrollView>
            </div>
        );
    }
}
