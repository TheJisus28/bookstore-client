import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Popconfirm,
  Typography,
  Select,
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

interface Book {
  id: string;
  isbn: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  pages?: number;
  publication_date?: string;
  language: string;
  publisher_id?: string;
  category_id?: string;
  cover_image_url?: string;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface Publisher {
  id: string;
  name: string;
}

const bookSchema = z.object({
  isbn: z.string().min(1, 'El ISBN es requerido').min(10, 'ISBN inválido'),
  title: z.string().min(1, 'El título es requerido').min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  price: z.number().min(0.01, 'El precio debe ser mayor a 0'),
  stock: z.number().int().min(0, 'El stock debe ser mayor o igual a 0'),
  pages: z.number().int().positive().optional().or(z.literal('')),
  publication_date: z.string().optional().or(z.literal('')),
  language: z.string().min(1, 'El idioma es requerido').default('Spanish'),
  publisher_id: z.string().uuid().optional().or(z.literal('')),
  category_id: z.string().uuid().optional().or(z.literal('')),
  cover_image_url: z.string().url('URL inválida').optional().or(z.literal('')),
  is_active: z.boolean().default(true),
});

type BookFormData = z.infer<typeof bookSchema>;

export const AdminBooksPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<{
    data: Book[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ['admin-books', page],
    queryFn: async () => {
      const response = await api.get(`/books/admin?page=${page}&limit=10`);
      return response.data;
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      message.error(error.response?.data?.message || 'Error al cargar los libros');
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories?limit=1000');
      return response.data.data;
    },
  });

  const { data: publishers } = useQuery<Publisher[]>({
    queryKey: ['publishers'],
    queryFn: async () => {
      const response = await api.get('/publishers?limit=1000');
      return response.data.data;
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    mode: 'onBlur',
    defaultValues: {
      language: 'Spanish',
      is_active: true,
      stock: 0,
      price: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BookFormData) => {
      const response = await api.post('/books', data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Libro creado exitosamente');
      setIsModalOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BookFormData> }) => {
      const response = await api.put(`/books/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Libro actualizado exitosamente');
      setIsModalOpen(false);
      setEditingBook(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/books/${id}`);
    },
    onSuccess: () => {
      message.success('Libro eliminado');
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
    },
  });

  const onSubmit = (data: BookFormData) => {
    if (editingBook) {
      updateMutation.mutate({ id: editingBook.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    reset({
      isbn: book.isbn,
      title: book.title,
      description: book.description || '',
      price: book.price,
      stock: book.stock,
      pages: book.pages || undefined,
      publication_date: book.publication_date || '',
      language: book.language || 'Spanish',
      publisher_id: book.publisher_id || '',
      category_id: book.category_id || '',
      cover_image_url: book.cover_image_url || '',
      is_active: book.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const columns: ColumnsType<Book> = [
    {
      title: 'ISBN',
      dataIndex: 'isbn',
      key: 'isbn',
    },
    {
      title: 'Título',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Precio',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
    },
    {
      title: 'Activo',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (isActive ? 'Sí' : 'No'),
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
            title="¿Eliminar este libro?"
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

  if (error) {
    return (
      <div>
        <Title level={2}>Administrar Libros</Title>
        <p>Error al cargar los libros. Por favor, intenta de nuevo.</p>
      </div>
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 24, width: '100%', flexWrap: 'wrap' }} direction="horizontal">
        <Title level={2} style={{ margin: 0 }}>
          Administrar Libros
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingBook(null);
            reset();
            setIsModalOpen(true);
          }}
        >
          Nuevo Libro
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          total: data?.total || 0,
          pageSize: data?.limit || 10,
          onChange: setPage,
        }}
        scroll={{ x: 800 }}
      />

      <Modal
        title={editingBook ? 'Editar Libro' : 'Nuevo Libro'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingBook(null);
          reset();
        }}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="ISBN"
                validateStatus={errors.isbn ? 'error' : ''}
                help={errors.isbn?.message}
                required
              >
                <Controller
                  name="isbn"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="ISBN" size="large" />
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Idioma"
                validateStatus={errors.language ? 'error' : ''}
                help={errors.language?.message}
                required
              >
                <Controller
                  name="language"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} placeholder="Idioma" size="large">
                      <Select.Option value="Spanish">Español</Select.Option>
                      <Select.Option value="English">Inglés</Select.Option>
                      <Select.Option value="French">Francés</Select.Option>
                      <Select.Option value="German">Alemán</Select.Option>
                      <Select.Option value="Italian">Italiano</Select.Option>
                      <Select.Option value="Portuguese">Portugués</Select.Option>
                    </Select>
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Título"
            validateStatus={errors.title ? 'error' : ''}
            help={errors.title?.message}
            required
          >
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Título del libro" size="large" />
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
                  placeholder="Descripción del libro"
                />
              )}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Precio"
                validateStatus={errors.price ? 'error' : ''}
                help={errors.price?.message}
                required
              >
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? 0)}
                      min={0.01}
                      step={0.01}
                      prefix="$"
                      style={{ width: '100%' }}
                      size="large"
                      placeholder="0.00"
                    />
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                label="Stock"
                validateStatus={errors.stock ? 'error' : ''}
                help={errors.stock?.message}
                required
              >
                <Controller
                  name="stock"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? 0)}
                      min={0}
                      style={{ width: '100%' }}
                      size="large"
                      placeholder="0"
                    />
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item label="Páginas">
                <Controller
                  name="pages"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? undefined)}
                      min={1}
                      style={{ width: '100%' }}
                      size="large"
                      placeholder="Páginas"
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Categoría">
                <Controller
                  name="category_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      placeholder="Seleccionar categoría"
                      size="large"
                      allowClear
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {categories?.map((cat) => (
                        <Select.Option key={cat.id} value={cat.id} label={cat.name}>
                          {cat.name}
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item label="Editorial">
                <Controller
                  name="publisher_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      placeholder="Seleccionar editorial"
                      size="large"
                      allowClear
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {publishers?.map((pub) => (
                        <Select.Option key={pub.id} value={pub.id} label={pub.name}>
                          {pub.name}
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Fecha de Publicación">
                <Controller
                  name="publication_date"
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

            <Col xs={24} sm={12}>
              <Form.Item label="URL de Portada">
                <Controller
                  name="cover_image_url"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      size="large"
                      type="url"
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Activo">
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onChange={field.onChange} />
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
                {editingBook ? 'Actualizar' : 'Crear'}
              </Button>
              <Button
                size="large"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingBook(null);
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

