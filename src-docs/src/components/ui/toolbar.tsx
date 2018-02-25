import * as React from 'react';
const Style = require('./toolbar.scss');
import { AppMaxWidth } from './app-max-width';

export class Toolbar extends React.PureComponent<any, any> {
    public render() {
        return (
            <header className={Style.root}>
                <AppMaxWidth>
                    <div className={Style.layer}>
                        {this.props.children}
                    </div>
                </AppMaxWidth>
            </header>
        );
    }
}

