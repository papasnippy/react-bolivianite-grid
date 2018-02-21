import * as React from 'react';
import { ScrollView as View, IScrollViewTheme } from 'react-bolivianite-grid';
const Style = require('./scrollview.scss');

export interface IScrollViewProps {
    lock?: 'x' | 'y';
}

const THEME: IScrollViewTheme = {
    thumbBackground: 'rgba(0, 0, 0, 0.8)',
    // trackBackground: 'rgba(0, 0, 0, 0.2)',
    classNames: {
        trackRoot: Style.track
    }
};

export class ScrollView extends React.Component<any, any> {
    public render() {
        return (
            <View
                lock={this.props.lock}
                hover={100}
                theme={THEME}
            >
                {this.props.children}
            </View>
        );
    }
}
