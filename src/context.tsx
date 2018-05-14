import * as React from 'react';
import { Grid } from './grid';
import { HeaderRepository } from './header-repository';
export const Context = React.createContext<{ grid: Grid, headers: HeaderRepository }>({ grid: null, headers: null });
export default Context;
