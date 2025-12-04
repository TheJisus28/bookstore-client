import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../config/api';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface Publisher {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
}

const publisherSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').min(2, 'El nombre debe tener al menos 2 caracteres'),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
});

type PublisherFormData = z.infer<typeof publisherSchema>;

export const AdminPublishersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPublisher, setEditingPublisher] = useState<Publisher | null>(null);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{
    data: Publisher[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ['admin-publishers', page],
    queryFn: async () => {
      const response = await api.get(`/publishers?page=${page}&limit=10`);
      return response.data;
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PublisherFormData>({
    resolver: zodResolver(publisherSchema),
    mode: 'onBlur',
  });

  const createMutation = useMutation({
    mutationFn: async (data: PublisherFormData) => {
      const response = await api.post('/publishers', data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Editorial creada exitosamente');
      setIsModalOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin-publishers'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PublisherFormData> }) => {
      const response = await api.put(`/publishers/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Editorial actualizada exitosamente');
      setIsModalOpen(false);
      setEditingPublisher(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin-publishers'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/publishers/${id}`);
    },
    onSuccess: () => {
      message.success('Editorial eliminada');
      queryClient.invalidateQueries({ queryKey: ['admin-publishers'] });
    },
  });

  const onSubmit = (data: PublisherFormData) => {
    if (editingPublisher) {
      updateMutation.mutate({ id: editingPublisher.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (publisher: Publisher) => {
    setEditingPublisher(publisher);
    reset({
      name: publisher.name,
      address: publisher.address || '',
      city: publisher.city || '',
      country: publisher.country || '',
      phone: publisher.phone || '',
      email: publisher.email || '',
      website: publisher.website || '',
    });
    setIsModalOpen(true);
  };

  const columns: ColumnsType<Publisher> = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Ciudad',
      dataIndex: 'city',
      key: 'city',
      render: (text) => text || '-',
      responsive: ['md'],
    },
    {
      title: 'País',
      dataIndex: 'country',
      key: 'country',
      render: (text) => text || '-',
      responsive: ['md'],
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => text || '-',
      responsive: ['lg'],
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Editar
          </Button>
          <Popconfirm
            title="¿Eliminar esta editorial?"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button danger icon={<DeleteOutlined />}>
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 24, width: '100%', flexWrap: 'wrap' }} direction="horizontal">
        <Title level={2} style={{ margin: 0 }}>
          Administrar Editoriales
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingPublisher(null);
            reset();
            setIsModalOpen(true);
          }}
        >
          Nueva Editorial
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={data?.data}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          total: data?.total,
          pageSize: data?.limit,
          onChange: setPage,
        }}
        scroll={{ x: 600 }}
      />

      <Modal
        title={editingPublisher ? 'Editar Editorial' : 'Nueva Editorial'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingPublisher(null);
          reset();
        }}
        footer={null}
        width={700}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Form.Item
            label="Nombre"
            validateStatus={errors.name ? 'error' : ''}
            help={errors.name?.message}
            required
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Nombre de la editorial" size="large" />
              )}
            />
          </Form.Item>

          <Form.Item label="Dirección">
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Dirección" size="large" />
              )}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Ciudad">
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Ciudad" size="large" />
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item label="País">
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="País" size="large" />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Email"
                validateStatus={errors.email ? 'error' : ''}
                help={errors.email?.message}
              >
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="email@ejemplo.com"
                      size="large"
                      type="email"
                    />
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item label="Teléfono">
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="+1234567890" size="large" />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Sitio Web"
            validateStatus={errors.website ? 'error' : ''}
            help={errors.website?.message}
          >
            <Controller
              name="website"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="https://www.ejemplo.com"
                  size="large"
                  type="url"
                />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingPublisher ? 'Actualizar' : 'Crear'}
              </Button>
              <Button
                size="large"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingPublisher(null);
                  reset();
                }}
              >
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </form>
      </Modal>
    </div>
  );
};

