import * as React from 'react';
import * as classnames from 'classnames';
const Style = require('./svg-icon.scss');

export interface IGithubIconProps extends React.HTMLProps<SVGSVGElement> {
    size?: number;
}

export class SvgIcon extends React.PureComponent<IGithubIconProps, any> {
    public renderIcon(): JSX.Element {
        return null;
    }

    public render() {
        let { size, ...other } = this.props;
        size = size || 24;

        return (
            <svg
                viewBox={`0 0 24 24`}
                {...other}
                className={classnames(Style.root, other.className)}
                style={{
                    '--svg-icon--size': `${size}px`,
                    ...other.style
                } as any}
            >
                {this.renderIcon()}
                {this.props.children}
            </svg>
        );
    }
}

