import { useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button } from 'antd';
import {
  HomeOutlined,
  BookOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  UserOutlined,
  BarChartOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  AppstoreOutlined,
  BankOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { useMediaQuery } from '@uidotdev/usehooks';
import type { MenuProps } from 'antd';

const { Header, Content, Sider } = AntLayout;

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const isMobile = useMediaQuery('(max-width: 576px)');
  const isTablet = useMediaQuery('(max-width: 768px)');
  const shouldCollapse = useMemo(() => isMobile || isTablet, [isMobile, isTablet]);
  const [collapsed, setCollapsed] = useState(shouldCollapse);

  const isAdmin = user?.role === 'admin';

  const customerMenuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: 'Inicio',
    },
    {
      key: '/books',
      icon: <BookOutlined />,
      label: 'Libros',
    },
    {
      key: '/cart',
      icon: <ShoppingCartOutlined />,
      label: 'Carrito',
    },
    {
      key: '/orders',
      icon: <FileTextOutlined />,
      label: 'Mis Pedidos',
    },
    {
      key: '/addresses',
      icon: <EnvironmentOutlined />,
      label: 'Direcciones',
    },
  ];

  const adminMenuItems: MenuProps['items'] = [
    ...customerMenuItems,
    {
      type: 'divider',
    },
    {
      key: '/admin/books',
      icon: <BookOutlined />,
      label: 'Libros',
    },
    {
      key: '/admin/categories',
      icon: <AppstoreOutlined />,
      label: 'Categorías',
    },
    {
      key: '/admin/publishers',
      icon: <BankOutlined />,
      label: 'Editoriales',
    },
    {
      key: '/admin/authors',
      icon: <TeamOutlined />,
      label: 'Autores',
    },
    {
      type: 'divider',
    },
    {
      key: '/admin/orders',
      icon: <FileTextOutlined />,
      label: 'Pedidos',
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: 'Usuarios',
    },
    {
      key: '/admin/reports',
      icon: <BarChartOutlined />,
      label: 'Reportes',
    },
  ];

  const menuItems = isAdmin ? adminMenuItems : customerMenuItems;

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Perfil',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#001529',
          padding: '0 16px',
          position: 'fixed',
          top: 0,
          zIndex: 1000,
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
              color: 'white',
            }}
          />
          <div style={{ color: 'white', fontSize: isMobile ? '16px' : '20px', fontWeight: 'bold' }}>
            📚 Librería Online
          </div>
        </div>
        <Dropdown
          menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
          placement="bottomRight"
        >
          <Button
            type="text"
            style={{
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Avatar icon={<UserOutlined />} />
            {!isTablet && (
              <span>
                {user?.first_name} {user?.last_name}
              </span>
            )}
          </Button>
        </Dropdown>
      </Header>
      <AntLayout style={{ marginTop: 64 }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={200}
          breakpoint="lg"
          collapsedWidth={isMobile ? 0 : 80}
          trigger={null}
          style={{
            background: '#fff',
            overflow: 'auto',
            height: 'calc(100vh - 64px)',
            position: 'fixed',
            left: 0,
            top: 64,
          }}
          onBreakpoint={(broken) => {
            if (broken) {
              setCollapsed(true);
            }
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <AntLayout
          style={{
            marginLeft: isMobile ? 0 : collapsed ? 80 : 200,
            transition: 'margin-left 0.2s',
          }}
        >
          <Content
            style={{
              padding: isMobile ? '16px' : '24px',
              margin: 0,
              minHeight: 280,
              background: '#fff',
            }}
          >
            <Outlet />
          </Content>
        </AntLayout>
      </AntLayout>
    </AntLayout>
  );
};

