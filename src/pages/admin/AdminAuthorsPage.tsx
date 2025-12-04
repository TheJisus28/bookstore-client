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
  DatePicker,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../config/api';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface Author {
  id: string;
  first_name: string;
  last_name: string;
  bio?: string;
  birth_date?: string;
  nationality?: string;
}

const authorSchema = z.object({
  first_name: z.string().min(1, 'El nombre es requerido').min(2, 'El nombre debe tener al menos 2 caracteres'),
  last_name: z.string().min(1, 'El apellido es requerido').min(2, 'El apellido debe tener al menos 2 caracteres'),
  bio: z.string().optional(),
  birth_date: z.string().optional().or(z.literal('')),
  nationality: z.string().optional(),
});

type AuthorFormData = z.infer<typeof authorSchema>;

export const AdminAuthorsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{
    data: Author[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ['admin-authors', page],
    queryFn: async () => {
      const response = await api.get(`/authors?page=${page}&limit=10`);
      return response.data;
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AuthorFormData>({
    resolver: zodResolver(authorSchema),
    mode: 'onBlur',
  });

  const createMutation = useMutation({
    mutationFn: async (data: AuthorFormData) => {
      const response = await api.post('/authors', data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Autor creado exitosamente');
      setIsModalOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin-authors'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AuthorFormData> }) => {
      const response = await api.put(`/authors/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Autor actualizado exitosamente');
      setIsModalOpen(false);
      setEditingAuthor(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin-authors'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/authors/${id}`);
    },
    onSuccess: () => {
      message.success('Autor eliminado');
      queryClient.invalidateQueries({ queryKey: ['admin-authors'] });
    },
  });

  const onSubmit = (data: AuthorFormData) => {
    if (editingAuthor) {
      updateMutation.mutate({ id: editingAuthor.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (author: Author) => {
    setEditingAuthor(author);
    reset({
      first_name: author.first_name,
      last_name: author.last_name,
      bio: author.bio || '',
      birth_date: author.birth_date || '',
      nationality: author.nationality || '',
    });
    setIsModalOpen(true);
  };

  const columns: ColumnsType<Author> = [
    {
      title: 'Nombre',
      key: 'name',
      render: (_, record) => `${record.first_name} ${record.last_name}`,
    },
    {
      title: 'Nacionalidad',
      dataIndex: 'nationality',
      key: 'nationality',
      render: (text) => text || '-',
      responsive: ['md'],
    },
    {
      title: 'Fecha de Nacimiento',
      dataIndex: 'birth_date',
      key: 'birth_date',
      render: (date) => (date ? new Date(date).toLocaleDateString() : '-'),
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
            title="¿Eliminar este autor?"
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
          Administrar Autores
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingAuthor(null);
            reset();
            setIsModalOpen(true);
          }}
        >
          Nuevo Autor
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
        title={editingAuthor ? 'Editar Autor' : 'Nuevo Autor'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingAuthor(null);
          reset();
        }}
        footer={null}
        width={600}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Nombre"
                validateStatus={errors.first_name ? 'error' : ''}
                help={errors.first_name?.message}
                required
              >
                <Controller
                  name="first_name"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Nombre" size="large" />
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Apellido"
                validateStatus={errors.last_name ? 'error' : ''}
                help={errors.last_name?.message}
                required
              >
                <Controller
                  name="last_name"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Apellido" size="large" />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Biografía">
            <Controller
              name="bio"
              control={control}
              render={({ field }) => (
                <Input.TextArea {...field} rows={4} placeholder="Biografía del autor" />
              )}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Nacionalidad">
                <Controller
                  name="nationality"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Nacionalidad" size="large" />
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item label="Fecha de Nacimiento">
                <Controller
                  name="birth_date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      style={{ width: '100%' }}
                      size="large"
                      format="YYYY-MM-DD"
                      placeholder="Seleccionar fecha"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => {
                        field.onChange(date ? date.format('YYYY-MM-DD') : '');
                      }}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingAuthor ? 'Actualizar' : 'Crear'}
              </Button>
              <Button
                size="large"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingAuthor(null);
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

