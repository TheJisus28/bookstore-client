import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { QueryProvider } from './providers/QueryProvider';
import { AntdProvider } from './providers/AntdProvider';
import { AppRoutes } from './routes/AppRoutes';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <AntdProvider>
        <AppRoutes />
      </AntdProvider>
    </QueryProvider>
  </StrictMode>,
);
