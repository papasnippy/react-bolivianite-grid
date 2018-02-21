import * as React from 'react';
import * as classnames from 'classnames';

const Style = require('./menu-item.scss');

export interface IToolbarTabProps {
    selected?: boolean;
    orientation?: 'left' | 'top' | 'right' | 'bottom';
}

export class MenuItem extends React.PureComponent<IToolbarTabProps, {}> {
    public render() {
        const orientation = this.props.orientation || 'bottom';

        return (
            <div
                className={classnames(Style.root, {
                    [Style.left]: orientation === 'left',
                    [Style.top]: orientation === 'top',
                    [Style.right]: orientation === 'right',
                    [Style.bottom]: orientation === 'bottom',
                    [Style.selected]: this.props.selected
                })}
                role="button"
            >
                {this.props.children}
            </div>
        );
    }
}
