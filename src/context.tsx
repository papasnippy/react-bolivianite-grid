import * as React from 'react';
import { Grid } from './grid';
import { HeaderRepository } from './header-repository';
export const Context = React.createContext<{ grid: Grid, repository: HeaderRepository }>({ grid: null, repository: null });
export default Context;
