import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Typography,
  Button,
  Descriptions,
  Divider,
  Table,
  Tag,
  Spin,
  Card,
  Space,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import api from '../../config/api';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface OrderItem {
  id: string;
  order_id: string;
  book_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  title?: string;
  isbn?: string;
  cover_image_url?: string;
}

interface Order {
  id: string;
  user_id: string;
  address_id: string;
  status: string;
  total_amount: number;
  shipping_cost: number;
  discount_amount: number;
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  delivered_at?: string;
  address?: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
}

const statusColors: Record<string, string> = {
  pending: 'orange',
  processing: 'blue',
  shipped: 'cyan',
  delivered: 'green',
  cancelled: 'red',
  returned: 'purple',
};

export const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading: orderLoading } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await api.get(`/orders/${id}`);
      const orderData = response.data;
      // Convertir montos de string a number si vienen como string
      return {
        ...orderData,
        total_amount: typeof orderData.total_amount === 'string' ? parseFloat(orderData.total_amount) : orderData.total_amount,
        shipping_cost: typeof orderData.shipping_cost === 'string' ? parseFloat(orderData.shipping_cost) : orderData.shipping_cost,
        discount_amount: typeof orderData.discount_amount === 'string' ? parseFloat(orderData.discount_amount) : orderData.discount_amount,
      };
    },
    enabled: !!id,
  });

  const { data: orderItems, isLoading: itemsLoading } = useQuery<OrderItem[]>({
    queryKey: ['order-items', id],
    queryFn: async () => {
      const response = await api.get(`/orders/${id}/items`);
      // Convertir precios de string a number si vienen como string
      return response.data.map((item: any) => ({
        ...item,
        unit_price: typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price,
        subtotal: typeof item.subtotal === 'string' ? parseFloat(item.subtotal) : item.subtotal,
      }));
    },
    enabled: !!id,
  });

  const columns: ColumnsType<OrderItem> = [
    {
      title: 'Libro',
      key: 'book',
      render: (_, record) => (
        <Space>
          {record.cover_image_url && (
            <img
              src={record.cover_image_url}
              alt={record.title || 'Libro'}
              style={{ width: 50, height: 70, objectFit: 'cover', borderRadius: 4 }}
            />
          )}
          <div>
            <Text strong>{record.title || `Libro ${record.book_id.slice(0, 8)}...`}</Text>
            {record.isbn && (
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>ISBN: {record.isbn}</Text>
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Precio Unitario',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price) => `$${typeof price === 'number' ? price.toFixed(2) : parseFloat(price || '0').toFixed(2)}`,
    },
    {
      title: 'Cantidad',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (subtotal) => `$${typeof subtotal === 'number' ? subtotal.toFixed(2) : parseFloat(subtotal || '0').toFixed(2)}`,
    },
  ];

  if (orderLoading || itemsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')} style={{ marginBottom: 24 }}>
          Volver
        </Button>
        <div>Orden no encontrada</div>
      </div>
    );
  }

  const totalAmount = typeof order.total_amount === 'number' ? order.total_amount : parseFloat(order.total_amount || '0');
  const shippingCost = typeof order.shipping_cost === 'number' ? order.shipping_cost : parseFloat(order.shipping_cost || '0');
  const discountAmount = typeof order.discount_amount === 'number' ? order.discount_amount : parseFloat(order.discount_amount || '0');

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')} style={{ marginBottom: 24 }}>
        Volver
      </Button>

      <Title level={2}>Detalles del Pedido</Title>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Descriptions title="Información del Pedido" bordered column={1}>
            <Descriptions.Item label="ID">
              <span style={{ fontFamily: 'monospace' }}>{order.id}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Estado">
              <Tag color={statusColors[order.status] || 'default'}>{order.status.toUpperCase()}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Fecha de Creación">
              {new Date(order.created_at).toLocaleString()}
            </Descriptions.Item>
            {order.shipped_at && (
              <Descriptions.Item label="Fecha de Envío">
                {new Date(order.shipped_at).toLocaleString()}
              </Descriptions.Item>
            )}
            {order.delivered_at && (
              <Descriptions.Item label="Fecha de Entrega">
                {new Date(order.delivered_at).toLocaleString()}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {order.address && (
          <Card title="Dirección de Envío">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Calle">{order.address.street}</Descriptions.Item>
              <Descriptions.Item label="Ciudad">{order.address.city}</Descriptions.Item>
              <Descriptions.Item label="Código Postal">{order.address.postal_code}</Descriptions.Item>
              <Descriptions.Item label="País">{order.address.country}</Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        <Card title="Items del Pedido">
          <Table
            columns={columns}
            dataSource={orderItems || []}
            rowKey="id"
            pagination={false}
          />
        </Card>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>Subtotal:</Text>
              <Text>${(totalAmount - shippingCost + discountAmount).toFixed(2)}</Text>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="success">Descuento:</Text>
                <Text type="success">-${discountAmount.toFixed(2)}</Text>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>Envío:</Text>
              <Text>${shippingCost.toFixed(2)}</Text>
            </div>
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Title level={4} style={{ margin: 0 }}>Total:</Title>
              <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                ${totalAmount.toFixed(2)}
              </Title>
            </div>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

