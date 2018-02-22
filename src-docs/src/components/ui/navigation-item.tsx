import * as React from 'react';
import * as classnames from 'classnames';
import { NavLink } from 'react-router-dom';

const Style = require('./navigation-item.scss');

export interface IToolbarTabProps {
    exact?: boolean;
    orientation?: 'left' | 'top' | 'right' | 'bottom';
    location: string;
}

export class NavigationItem extends React.Component<IToolbarTabProps, {}> {
    public render() {
        const orientation = this.props.orientation || 'bottom';

        return (
            <NavLink
                exact={this.props.exact}
                to={this.props.location}
                className={classnames(Style.root, {
                    [Style.left]: orientation === 'left',
                    [Style.top]: orientation === 'top',
                    [Style.right]: orientation === 'right',
                    [Style.bottom]: orientation === 'bottom',
                })}
                activeClassName={Style.selected}
            >
                {this.props.children}
            </NavLink>
        );
    }
}
