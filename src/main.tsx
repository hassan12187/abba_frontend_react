import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import './theme.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Store } from './Store/Store.js';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider } from './Store/ThemeContext.js';

const queryClient=new QueryClient();
const rootElement = document.getElementById("root");
if(!rootElement){
  throw new Error("Failed to find the root element. Ensure index.html has <div id='root'></div>");
}
createRoot(rootElement).render(
  <StrictMode>
    <Store>
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <ThemeProvider>
    <App />
        </ThemeProvider>
      </SnackbarProvider>
    </QueryClientProvider>
    </Store>
  </StrictMode>,
)