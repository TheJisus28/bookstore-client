import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Button,
  Typography,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Popconfirm,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState } from 'react';
import api from '../../config/api';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const { Title, Text } = Typography;

interface Address {
  id: string;
  street: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

const addressSchema = z.object({
  street: z.string().min(1, 'La calle es requerida').min(5, 'La calle debe tener al menos 5 caracteres'),
  city: z.string().min(1, 'La ciudad es requerida').min(2, 'La ciudad debe tener al menos 2 caracteres'),
  state: z.string().optional(),
  postal_code: z.string().min(1, 'El código postal es requerido').min(4, 'Código postal inválido'),
  country: z.string().min(1, 'El país es requerido').min(2, 'El país debe tener al menos 2 caracteres'),
  is_default: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

export const AddressesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const queryClient = useQueryClient();

  const { data: addresses, isLoading } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const response = await api.get('/addresses');
      return response.data;
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    mode: 'onBlur',
    defaultValues: {
      is_default: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      const response = await api.post('/addresses', data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Dirección creada exitosamente');
      setIsModalOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AddressFormData }) => {
      const response = await api.put(`/addresses/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Dirección actualizada exitosamente');
      setIsModalOpen(false);
      setEditingAddress(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/addresses/${id}`);
    },
    onSuccess: () => {
      message.success('Dirección eliminada');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const onSubmit = (data: AddressFormData) => {
    if (editingAddress) {
      updateMutation.mutate({ id: editingAddress.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    reset({
      street: address.street,
      city: address.city,
      state: address.state || '',
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
    reset();
  };

  return (
    <div>
      <Space style={{ marginBottom: 24, width: '100%', flexWrap: 'wrap' }} direction="horizontal">
        <Title level={2} style={{ margin: 0 }}>
          Mis Direcciones
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            reset();
            setEditingAddress(null);
            setIsModalOpen(true);
          }}
        >
          Agregar Dirección
        </Button>
      </Space>

      {isLoading ? (
        <div>Cargando...</div>
      ) : addresses && addresses.length > 0 ? (
        <Row gutter={[16, 16]}>
          {addresses.map((address) => (
            <Col xs={24} sm={12} lg={8} key={address.id}>
              <Card
                title={
                  <Space>
                    {address.street}, {address.city}
                    {address.is_default && (
                      <Text type="success">(Por defecto)</Text>
                    )}
                  </Space>
                }
                extra={
                  <Space direction="vertical" size="small">
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(address)}
                    >
                      Editar
                    </Button>
                    <Popconfirm
                      title="¿Eliminar esta dirección?"
                      onConfirm={() => deleteMutation.mutate(address.id)}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />}>
                        Eliminar
                      </Button>
                    </Popconfirm>
                  </Space>
                }
              >
                <Text>
                  {address.street}, {address.city}
                  {address.state && `, ${address.state}`}
                  <br />
                  {address.postal_code}, {address.country}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card>
          <Text type="secondary">No tienes direcciones guardadas</Text>
        </Card>
      )}

      <Modal
        title={editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Form.Item
            label="Calle"
            validateStatus={errors.street ? 'error' : ''}
            help={errors.street?.message}
            required
          >
            <Controller
              name="street"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Calle y número" size="large" />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Ciudad"
            validateStatus={errors.city ? 'error' : ''}
            help={errors.city?.message}
            required
          >
            <Controller
              name="city"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Ciudad" size="large" />
              )}
            />
          </Form.Item>

          <Form.Item label="Estado/Provincia">
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Estado o provincia (opcional)" size="large" />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Código Postal"
            validateStatus={errors.postal_code ? 'error' : ''}
            help={errors.postal_code?.message}
            required
          >
            <Controller
              name="postal_code"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Código postal" size="large" />
              )}
            />
          </Form.Item>

          <Form.Item
            label="País"
            validateStatus={errors.country ? 'error' : ''}
            help={errors.country?.message}
            required
          >
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="País" size="large" />
              )}
            />
          </Form.Item>

          <Form.Item label="Dirección por defecto">
            <Controller
              name="is_default"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" size="large" loading={createMutation.isPending || updateMutation.isPending}>
                {editingAddress ? 'Actualizar' : 'Crear'}
              </Button>
              <Button onClick={handleCloseModal} size="large">Cancelar</Button>
            </Space>
          </Form.Item>
        </form>
      </Modal>
    </div>
  );
};

