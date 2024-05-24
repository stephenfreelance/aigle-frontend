import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Login from '@/routes/Login/index.tsx';
import Map from '@/routes/Map/index.tsx';
import {
  createTheme,
  MantineColorsTuple,
  MantineProvider,
} from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const colors: MantineColorsTuple = [
  '#e1fff5',
  '#cffbeb',
  '#a5f4d5',
  '#75ecc0',
  '#4ee6ad',
  '#34e3a1',
  '#21e19b',
  '#0ac785',
  '#00b275',
  '#009a63',
];

const theme = createTheme({
  colors: {
    colors,
  },
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <Map />,
  },
  {
    path: '/login',
    element: <Login />,
  },
]);

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <RouterProvider router={router} />
      </MantineProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
