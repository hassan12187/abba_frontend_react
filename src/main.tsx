import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import './index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Store } from './Store/Store.js';
import { SnackbarProvider } from 'notistack';

const queryClient=new QueryClient();
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Store>
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
    <App />
      </SnackbarProvider>
    </QueryClientProvider>
    </Store>
  </StrictMode>,
)