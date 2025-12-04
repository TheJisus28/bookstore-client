import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Button,
  Typography,
  Space,
  InputNumber,
  message,
  Card,
  Empty,
  Divider,
} from 'antd';
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface CartItem {
  id: string;
  book_id: string;
  title: string;
  price: number;
  quantity: number;
  cover_image_url?: string;
}

export const CartPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cartItems, isLoading } = useQuery<CartItem[]>({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await api.get('/cart');
      // Convertir price de string a number si viene como string
      return response.data.map((item: any) => ({
        ...item,
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
      }));
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      await api.put(`/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/cart/${id}`);
    },
    onSuccess: () => {
      message.success('Item eliminado del carrito');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/cart');
    },
    onSuccess: () => {
      message.success('Carrito vaciado');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const calculateTotal = () => {
    if (!cartItems) return 0;
    return cartItems.reduce((sum, item) => {
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price || '0');
      return sum + price * item.quantity;
    }, 0);
  };

  const columns: ColumnsType<CartItem> = [
    {
      title: 'Libro',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space>
          {record.cover_image_url && (
            <img
              src={record.cover_image_url}
              alt={text}
              style={{ width: 50, height: 70, objectFit: 'cover' }}
            />
          )}
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Precio',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `$${typeof price === 'number' ? price.toFixed(2) : parseFloat(price || '0').toFixed(2)}`,
      responsive: ['md'],
    },
    {
      title: 'Cantidad',
      key: 'quantity',
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) =>
            updateQuantityMutation.mutate({ id: record.id, quantity: value || 1 })
          }
        />
      ),
    },
    {
      title: 'Subtotal',
      key: 'subtotal',
      render: (_, record) => {
        const price = typeof record.price === 'number' ? record.price : parseFloat(record.price || '0');
        return `$${(price * record.quantity).toFixed(2)}`;
      },
      responsive: ['sm'],
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItemMutation.mutate(record.id)}
          size="small"
        >
          Eliminar
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div>
        <Title level={2}>Carrito de Compras</Title>
        <Empty description="Tu carrito está vacío" />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>Carrito de Compras</Title>

      <Table
        columns={columns}
        dataSource={cartItems}
        rowKey="id"
        pagination={false}
        style={{ marginBottom: 24 }}
        scroll={{ x: 600 }}
      />

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong style={{ fontSize: '18px' }}>Total:</Text>
            <Title level={3} style={{ margin: 0 }}>${calculateTotal().toFixed(2)}</Title>
          </div>

          <Divider />

          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              size="large"
              block
              onClick={() => navigate('/checkout')}
            >
              Proceder al Checkout
            </Button>
            <Button
              danger
              block
              onClick={() => clearCartMutation.mutate()}
              loading={clearCartMutation.isPending}
            >
              Vaciar Carrito
            </Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
};

