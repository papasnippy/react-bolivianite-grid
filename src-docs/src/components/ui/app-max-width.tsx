import * as React from 'react';
import * as classnames from 'classnames';
const Style = require('./app-max-width.scss');

export class AppMaxWidth extends React.PureComponent<any, any> {
    public render() {
        return (
            <div className={classnames(Style.root, this.props.className)}>
                <div className={Style.layer}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

