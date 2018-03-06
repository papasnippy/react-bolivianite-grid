import * as React from 'react';
import * as classnames from 'classnames';
const Style = require('./toolbar.scss');
import { AppMaxWidth } from './app-max-width';

export class Toolbar extends React.PureComponent<any, any> {
    public render() {
        return (
            <header className={classnames(Style.root, this.props.className)}>
                <AppMaxWidth>
                    <div className={Style.layer}>
                        {this.props.children}
                    </div>
                </AppMaxWidth>
            </header>
        );
    }
}

