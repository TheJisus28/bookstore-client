import { ConfigProvider, App } from 'antd';
import esES from 'antd/locale/es_ES';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import type { ReactNode } from 'react';

// Configurar dayjs para español
dayjs.locale('es');

interface AntdProviderProps {
  children: ReactNode;
}

export const AntdProvider = ({ children }: AntdProviderProps) => {
  return (
    <ConfigProvider
      locale={esES}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <App>
        {children}
      </App>
    </ConfigProvider>
  );
};

