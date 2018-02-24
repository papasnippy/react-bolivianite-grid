import * as React from 'react';

export function render(jsx: JSX.Element | ((props?: any) => JSX.Element), getProps?: () => any) {
    if (!jsx) {
        return jsx;
    }

    const props = getProps ? getProps() : {};
    return typeof jsx === 'function' ? jsx(props) : React.cloneElement(React.Children.only(jsx), props);
}
