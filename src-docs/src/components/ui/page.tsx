import * as React from 'react';
import { AppMaxWidth } from './app-max-width';
import { ScrollView } from '~/components';
const Style = require('./page.scss');

export interface IPageProps {
}

export class Page extends React.Component<IPageProps, {}> {
    public render() {
        return (
            <div className={Style.root}>
                <ScrollView>
                    <AppMaxWidth className={Style.content}>
                        {this.props.children}
                    </AppMaxWidth>
                </ScrollView>
            </div>
        );
    }
}
