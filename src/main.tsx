import App from '@/App';
import { createTheme, MantineColorsTuple, MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';

const aigleColors: MantineColorsTuple = [
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
    primaryColor: 'aigleColors',
    colors: {
        aigleColors,
    },
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 0,
        },
    },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <MantineProvider theme={theme}>
                <App />
            </MantineProvider>
        </QueryClientProvider>
    </React.StrictMode>,
);
