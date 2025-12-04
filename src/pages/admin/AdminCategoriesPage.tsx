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
  Select,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../config/api';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
}

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  parent_id: z.string().uuid().optional().or(z.literal('')),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export const AdminCategoriesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{
    data: Category[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ['admin-categories', page],
    queryFn: async () => {
      const response = await api.get(`/categories?page=${page}&limit=10`);
      return response.data;
    },
  });

  const { data: allCategories } = useQuery<Category[]>({
    queryKey: ['all-categories'],
    queryFn: async () => {
      const response = await api.get('/categories?limit=100');
      return response.data.data;
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    mode: 'onBlur',
  });

  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await api.post('/categories', data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Categoría creada exitosamente');
      setIsModalOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-categories'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryFormData> }) => {
      const response = await api.put(`/categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Categoría actualizada exitosamente');
      setIsModalOpen(false);
      setEditingCategory(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-categories'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      message.success('Categoría eliminada');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-categories'] });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    reset({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id || '',
    });
    setIsModalOpen(true);
  };

  const columns: ColumnsType<Category> = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-',
    },
    {
      title: 'Categoría Padre',
      dataIndex: 'parent_id',
      key: 'parent_id',
      render: (parentId) => {
        if (!parentId) return '-';
        const parent = allCategories?.find((cat) => cat.id === parentId);
        return parent?.name || '-';
      },
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
            title="¿Eliminar esta categoría?"
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
          Administrar Categorías
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingCategory(null);
            reset();
            setIsModalOpen(true);
          }}
        >
          Nueva Categoría
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
        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
          reset();
        }}
        footer={null}
        width={600}
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
                <Input {...field} placeholder="Nombre de la categoría" size="large" />
              )}
            />
          </Form.Item>

          <Form.Item label="Descripción">
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  rows={4}
                  placeholder="Descripción de la categoría"
                />
              )}
            />
          </Form.Item>

          <Form.Item label="Categoría Padre (opcional)">
            <Controller
              name="parent_id"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Seleccionar categoría padre"
                  size="large"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                      filterOption={(input: string, option?: { label?: string }) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                >
                  {allCategories
                    ?.filter((cat) => cat.id !== editingCategory?.id)
                    .map((cat) => (
                      <Select.Option key={cat.id} value={cat.id} label={cat.name}>
                        {cat.name}
                      </Select.Option>
                    ))}
                </Select>
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
                {editingCategory ? 'Actualizar' : 'Crear'}
              </Button>
              <Button
                size="large"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCategory(null);
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

