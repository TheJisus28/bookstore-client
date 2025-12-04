import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Form,
  Select,
  Button,
  Typography,
  Space,
  message,
  Spin,
  Empty,
  Input,
  Row,
  Col,
  Divider,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const { Title, Text } = Typography;

interface Address {
  id: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

const checkoutSchema = z.object({
  address_id: z.string().min(1, 'Debes seleccionar una dirección').uuid('Selecciona una dirección válida'),
  discount_code: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: addresses, isLoading: addressesLoading } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const response = await api.get('/addresses');
      return response.data;
    },
  });

  const { data: cartItems, isLoading: cartLoading } = useQuery<CartItem[]>({
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

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onBlur',
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      const response = await api.post('/orders', data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Pedido creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      navigate('/orders');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al crear el pedido');
    },
  });

  const onSubmit = (data: CheckoutFormData) => {
    createOrderMutation.mutate(data);
  };

  const calculateTotal = () => {
    if (!cartItems) return 0;
    return cartItems.reduce((sum, item) => {
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price || '0');
      return sum + price * item.quantity;
    }, 0);
  };

  if (addressesLoading || cartLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div>
        <Title level={2}>Checkout</Title>
        <Empty description="Tu carrito está vacío" />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>Checkout</Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="Dirección de Envío" style={{ marginBottom: 24 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Form.Item
                label="Seleccionar Dirección"
                validateStatus={errors.address_id ? 'error' : ''}
                help={errors.address_id?.message}
                required
              >
                <Controller
                  name="address_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      placeholder="Selecciona una dirección"
                      style={{ width: '100%' }}
                      size="large"
                    >
                      {addresses?.map((address) => (
                        <Select.Option key={address.id} value={address.id}>
                          {address.street}, {address.city} {address.postal_code}
                          {address.is_default && ' (Por defecto)'}
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                />
              </Form.Item>

              {(!addresses || addresses.length === 0) && (
                <Form.Item>
                  <Button
                    type="link"
                    onClick={() => navigate('/addresses')}
                    style={{ padding: 0 }}
                  >
                    Agregar nueva dirección
                  </Button>
                </Form.Item>
              )}

              <Form.Item label="Código de Descuento (opcional)">
                <Controller
                  name="discount_code"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Ingresa código de descuento"
                      size="large"
                    />
                  )}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={createOrderMutation.isPending}
                  disabled={!watch('address_id')}
                >
                  Confirmar Pedido
                </Button>
              </Form.Item>
            </form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Resumen del Pedido">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {cartItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>
                    {item.title} x{item.quantity}
                  </Text>
                  <Text>${((typeof item.price === 'number' ? item.price : parseFloat(item.price || '0')) * item.quantity).toFixed(2)}</Text>
                </div>
              ))}
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>Total:</Text>
                <Title level={4} style={{ margin: 0 }}>
                  ${calculateTotal().toFixed(2)}
                </Title>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

