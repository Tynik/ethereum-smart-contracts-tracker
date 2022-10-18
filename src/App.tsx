import React from 'react';
import { CssBaseline, Container, ThemeProvider, createTheme } from '@mui/material';

import Main from '~/Main';
import { GlobalStyles } from '~/global-styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const App = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <GlobalStyles />
      <Container maxWidth={false} disableGutters>
        <Main />
      </Container>
    </ThemeProvider>
  );
};

export default App;
