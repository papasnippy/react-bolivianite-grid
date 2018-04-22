import * as React from 'react';
import { Grid } from './grid';
import { HeadersContainer } from '../models';
export const Context = React.createContext<{ grid: Grid, headers: HeadersContainer }>({ grid: null, headers: null });
export default Context;
