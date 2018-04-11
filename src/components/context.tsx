// TODO: remove when types will be updated
declare module 'react' {
    type Provider<T> = React.ComponentType<{
        value: T;
        children?: ReactNode;
    }>;
    type Consumer<T> = ComponentType<{
        children: (value: T) => ReactNode;
        unstable_observedBits?: number;
    }>;
    interface Context<T> {
        Provider: Provider<T>;
        Consumer: Consumer<T>;
    }
    function createContext<T>(defaultValue: T, calculateChangedBits?: (prev: T, next: T) => number): Context<T>;
}

import * as React from 'react';
import { Grid } from './grid';
import { HeadersContainer } from '../models';
export const Context = React.createContext<{ grid: Grid, headers: HeadersContainer }>({ grid: null, headers: null });
export default Context;
