import React from 'react';
import { css, GlobalStyles as MuiGlobalStyles } from '@mui/material';

export const GlobalStyles = () => (
  <MuiGlobalStyles
    styles={css`
      html,
      body,
      #app {
        height: 100%;
      }
    `}
  />
);
