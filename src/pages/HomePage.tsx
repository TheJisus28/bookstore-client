import { Card, Row, Col, Typography } from 'antd';
import { BookOutlined, ShoppingCartOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Title, Paragraph } = Typography;

export const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div>
      <Title level={2}>Bienvenido, {user?.first_name}!</Title>
      <Paragraph>
        {user?.role === 'admin'
          ? 'Panel de administración de la librería'
          : 'Explora nuestra amplia selección de libros'}
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            onClick={() => navigate('/books')}
            style={{ textAlign: 'center' }}
          >
            <BookOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <Title level={4}>Libros</Title>
            <Paragraph>Explora nuestro catálogo</Paragraph>
          </Card>
        </Col>

        {user?.role === 'customer' && (
          <>
            <Col xs={24} sm={12} md={8}>
              <Card
                hoverable
                onClick={() => navigate('/cart')}
                style={{ textAlign: 'center' }}
              >
                <ShoppingCartOutlined
                  style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }}
                />
                <Title level={4}>Carrito</Title>
                <Paragraph>Ver tus productos</Paragraph>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Card
                hoverable
                onClick={() => navigate('/orders')}
                style={{ textAlign: 'center' }}
              >
                <FileTextOutlined
                  style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }}
                />
                <Title level={4}>Pedidos</Title>
                <Paragraph>Historial de compras</Paragraph>
              </Card>
            </Col>
          </>
        )}

        {user?.role === 'admin' && (
          <>
            <Col xs={24} sm={12} md={8}>
              <Card
                hoverable
                onClick={() => navigate('/admin/books')}
                style={{ textAlign: 'center' }}
              >
                <BookOutlined
                  style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }}
                />
                <Title level={4}>Administrar Libros</Title>
                <Paragraph>Gestionar catálogo</Paragraph>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Card
                hoverable
                onClick={() => navigate('/admin/orders')}
                style={{ textAlign: 'center' }}
              >
                <FileTextOutlined
                  style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }}
                />
                <Title level={4}>Pedidos</Title>
                <Paragraph>Gestionar pedidos</Paragraph>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Card
                hoverable
                onClick={() => navigate('/admin/reports')}
                style={{ textAlign: 'center' }}
              >
                <FileTextOutlined
                  style={{ fontSize: 48, color: '#722ed1', marginBottom: 16 }}
                />
                <Title level={4}>Reportes</Title>
                <Paragraph>Ver estadísticas</Paragraph>
              </Card>
            </Col>
          </>
        )}
      </Row>
    </div>
  );
};

