import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import { ReactNode } from 'react';

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
      {children}
    </ConfigProvider>
  );
};

