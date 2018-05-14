import * as React from 'react';
import { SvgIcon } from '../ui';

/**
 * Material design icons
 * https://github.com/google/material-design-icons
 */
export class HomeIcon extends SvgIcon {
    public renderIcon() {
        return (
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        );
    }
}

