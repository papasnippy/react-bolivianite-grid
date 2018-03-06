import * as React from 'react';
import { ScrollView as SV, IScrollViewProps } from 'react-bolivianite-grid';
const Style = require('./scroll-view.scss');

export class ScrollView extends React.Component<IScrollViewProps, {}> {
    public render() {
        return (
            <SV
                lock="y"
                scrollbarMinimizeDistance={100}
                scrollbarWidth={15}
                scrollbarWidthMinimized={5}
                classNameTrackRoot={Style.scrollViewTrack}
                classNameThumb={Style.scrollViewThumb}
                {...this.props}
            >
                {this.props.children}
            </SV>
        );
    }
}
