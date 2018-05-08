import * as React from 'react';
import * as classnames from 'classnames';
const Style = require('./split-view.scss');

export interface ISplitViewProps {
    className?: string;
    minimum?: number;
}

export class SplitView extends React.PureComponent<ISplitViewProps, any> {
    public render() {
        let a = React.Children.toArray(this.props.children);

        if (a.length < 2) {
            return (
                <div className={classnames(Style.root, this.props.className)}>
                    <div className={Style.container} >
                        {a[0]}
                    </div>
                </div>
            );
        }

        return (
            <div
                className={classnames(Style.root, this.props.className)}
            >
                <div
                    className={Style.container}
                >
                    {a[0]}
                </div>
                <div
                    className={Style.container}
                >
                    {a[1]}
                </div>
            </div>
        );
    }
}

