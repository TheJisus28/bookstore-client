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
  Alert,
  Spin,
  Card,
  Tag,
  Divider,
  App,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
  ClearOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import api from '../../config/api';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs, { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface Book {
  id: string;
  book_id?: string;
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
  publisher_name?: string;
  category_name?: string;
}

interface BookSearchResult {
  book_id: string;
  title: string;
  price: number | string;
  stock: number;
  publisher_name?: string;
  category_name?: string;
  publication_date?: string;
  language?: string;
}

interface Category {
  id: string;
  name: string;
}

interface Author {
  id: string;
  first_name: string;
  last_name: string;
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
  const [search, setSearch] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const queryClient = useQueryClient();
  const { message: messageApi } = App.useApp();

  // Filter states
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [authorId, setAuthorId] = useState<string | undefined>(undefined);
  const [publisherId, setPublisherId] = useState<string | undefined>(undefined);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const [minStock, setMinStock] = useState<number | undefined>(undefined);
  const [maxStock, setMaxStock] = useState<number | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [sortBy, setSortBy] = useState<string>('title');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  // Fetch categories, authors, publishers for filters
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories?limit=100');
      return response.data.data || [];
    },
  });

  const { data: authors, isLoading: authorsLoading } = useQuery<Author[]>({
    queryKey: ['authors'],
    queryFn: async () => {
      const response = await api.get('/authors?limit=100');
      return response.data.data || [];
    },
  });

  const { data: publishers, isLoading: publishersLoading } = useQuery<Publisher[]>({
    queryKey: ['publishers'],
    queryFn: async () => {
      const response = await api.get('/publishers?limit=100');
      return response.data.data || [];
    },
  });

  // Check if we should use advanced search or normal search
  const hasFilters = !!(
    search ||
    categoryId ||
    authorId ||
    publisherId ||
    minPrice !== undefined ||
    maxPrice !== undefined ||
    minRating !== undefined ||
    language ||
    minStock !== undefined ||
    maxStock !== undefined ||
    dateRange ||
    sortBy !== 'title' ||
    sortOrder !== 'ASC'
  );

  // Normal books query (when no filters)
  const { data: normalData, isLoading: normalLoading } = useQuery<{
    data: Book[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ['admin-books', 'normal', page],
    queryFn: async () => {
      try {
        const response = await api.get(`/books/admin?page=${page}&limit=10`);
        const books = response.data.data.map((book: Book) => ({
          ...book,
          price: typeof book.price === 'string' ? parseFloat(book.price) : book.price,
        }));
        return {
          ...response.data,
          data: books,
        };
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string }; status?: number } };
        if (error.response?.status === 401) {
          messageApi.error('No autorizado. Por favor, inicia sesión nuevamente.');
        } else {
          messageApi.error(error.response?.data?.message || 'Error al cargar los libros');
        }
        throw err;
      }
    },
    enabled: !hasFilters,
    retry: 1,
  });

  // Advanced search query (when filters are active)
  const buildAdvancedQueryParams = () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10',
    });

    if (search) params.append('search', search);
    if (categoryId) params.append('category', categoryId);
    if (authorId) params.append('author', authorId);
    if (publisherId) params.append('publisher', publisherId);
    if (minPrice !== undefined) params.append('minPrice', minPrice.toString());
    if (maxPrice !== undefined) params.append('maxPrice', maxPrice.toString());
    if (minRating !== undefined) params.append('minRating', minRating.toString());
    if (language) params.append('language', language);
    if (minStock !== undefined) params.append('minStock', minStock.toString());
    if (maxStock !== undefined) params.append('maxStock', maxStock.toString());
    if (dateRange && dateRange[0]) {
      params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
    }
    if (dateRange && dateRange[1]) {
      params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
    }
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);

    return params.toString();
  };

  const { data: advancedData, isLoading: advancedLoading } = useQuery<{
    data: Book[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: [
      'admin-books',
      'advanced',
      page,
      search,
      categoryId,
      authorId,
      publisherId,
      minPrice,
      maxPrice,
      minRating,
      language,
      minStock,
      maxStock,
      dateRange,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      try {
        const params = buildAdvancedQueryParams();
        const response = await api.get(`/books/search/advanced?${params}`);
        const books = response.data.data.map((book: BookSearchResult) => ({
          ...book,
          id: book.book_id,
          price: typeof book.price === 'string' ? parseFloat(book.price) : book.price,
        }));
        return {
          ...response.data,
          data: books,
        };
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string }; status?: number } };
        if (error.response?.status === 401) {
          messageApi.error('No autorizado. Por favor, inicia sesión nuevamente.');
        } else {
          messageApi.error(error.response?.data?.message || 'Error al cargar los libros');
        }
        throw err;
      }
    },
    enabled: hasFilters,
    retry: 1,
  });

  const data = hasFilters ? advancedData : normalData;
  const isLoading = hasFilters ? advancedLoading : normalLoading;

  const clearFilters = () => {
    setSearch('');
    setCategoryId(undefined);
    setAuthorId(undefined);
    setPublisherId(undefined);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setMinRating(undefined);
    setLanguage(undefined);
    setMinStock(undefined);
    setMaxStock(undefined);
    setDateRange(null);
    setSortBy('title');
    setSortOrder('ASC');
    setPage(1);
    messageApi.success({
      content: '✅ Filtros limpiados',
      duration: 2,
    });
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (search) count++;
    if (categoryId) count++;
    if (authorId) count++;
    if (publisherId) count++;
    if (minPrice !== undefined || maxPrice !== undefined) count++;
    if (minRating !== undefined) count++;
    if (language) count++;
    if (minStock !== undefined || maxStock !== undefined) count++;
    if (dateRange) count++;
    if (sortBy !== 'title' || sortOrder !== 'ASC') count++;
    return count;
  };

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
      messageApi.success('Libro creado exitosamente');
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
      messageApi.success('Libro actualizado exitosamente');
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
      messageApi.success('Libro eliminado');
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

  const getBookId = (book: Book) => book.id || book.book_id || '';

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
      render: (price) => `$${typeof price === 'number' ? price.toFixed(2) : parseFloat(String(price || '0')).toFixed(2)}`,
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
            onConfirm={() => deleteMutation.mutate(getBookId(record))}
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
    <div style={{ padding: '24px', background: '#fff', minHeight: '100%' }}>
      <Space style={{ marginBottom: 24, width: '100%', flexWrap: 'wrap' }} direction="horizontal">
        <Title level={2} style={{ margin: 0 }}>
          Administrar Libros
        </Title>
        <Space>
          {hasFilters && (
            <Tag color="blue">
              {activeFiltersCount()} filtro{activeFiltersCount() > 1 ? 's' : ''} activo
              {activeFiltersCount() > 1 ? 's' : ''}
            </Tag>
          )}
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFiltersVisible(!filtersVisible)}
            type={filtersVisible ? 'primary' : 'default'}
          >
            Filtros
          </Button>
          {hasFilters && (
            <Button icon={<ClearOutlined />} onClick={clearFilters}>
              Limpiar
            </Button>
          )}
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
      </Space>

      <Row gutter={24}>
        <Col xs={24} lg={filtersVisible ? 18 : 24}>
          <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 24 }}>
            <Input
              prefix={<FilterOutlined />}
              size="large"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ maxWidth: 600 }}
              allowClear
            />

            <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Text type="secondary">
                {data && (
                  <>
                    Mostrando {data.data.length} de {data.total} libro{data.total !== 1 ? 's' : ''}
                  </>
                )}
              </Text>
              <Space>
                <Text strong>Ordenar por:</Text>
                <Select
                  style={{ width: 150 }}
                  value={sortBy}
                  onChange={setSortBy}
                  options={[
                    { value: 'title', label: 'Título' },
                    { value: 'price', label: 'Precio' },
                    { value: 'date', label: 'Fecha' },
                    { value: 'rating', label: 'Rating' },
                  ]}
                />
                <Button
                  icon={sortOrder === 'ASC' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                >
                  {sortOrder}
                </Button>
              </Space>
            </Space>
          </Space>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 50 }}>
              <Spin size="large" />
            </div>
          ) : data && data.data ? (
            <Table
              columns={columns}
              dataSource={data.data}
              rowKey={(record) => getBookId(record)}
              loading={isLoading}
              pagination={{
                current: page,
                total: data.total || 0,
                pageSize: data.limit || 10,
                onChange: setPage,
              }}
              scroll={{ x: 800 }}
              locale={{
                emptyText: 'No hay libros disponibles',
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 50 }}>
              <p>No hay datos disponibles</p>
            </div>
          )}
        </Col>

        {filtersVisible && (
          <Col xs={24} lg={6}>
            <Card
              title={
                <Space>
                  <Text strong>Filtros</Text>
                  {hasFilters && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {activeFiltersCount()}
                    </Tag>
                  )}
                </Space>
              }
              extra={
                hasFilters && (
                  <Button type="link" size="small" onClick={clearFilters}>
                    Limpiar
                  </Button>
                )
              }
              style={{ position: 'sticky', top: 20 }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Categoría
                  </Text>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Todas"
                    value={categoryId}
                    onChange={setCategoryId}
                    allowClear
                    showSearch
                    loading={categoriesLoading}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={(categories || []).map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                    }))}
                  />
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Autor
                  </Text>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Todos"
                    value={authorId}
                    onChange={setAuthorId}
                    allowClear
                    showSearch
                    loading={authorsLoading}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={(authors || []).map((author) => ({
                      value: author.id,
                      label: `${author.first_name} ${author.last_name}`,
                    }))}
                  />
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Editorial
                  </Text>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Todas"
                    value={publisherId}
                    onChange={setPublisherId}
                    allowClear
                    showSearch
                    loading={publishersLoading}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={(publishers || []).map((pub) => ({
                      value: pub.id,
                      label: pub.name,
                    }))}
                  />
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Idioma
                  </Text>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Todos"
                    value={language}
                    onChange={setLanguage}
                    allowClear
                    options={[
                      { value: 'Spanish', label: 'Español' },
                      { value: 'English', label: 'Inglés' },
                      { value: 'French', label: 'Francés' },
                      { value: 'German', label: 'Alemán' },
                    ]}
                  />
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Precio
                  </Text>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <InputNumber
                      placeholder="Mín"
                      min={0}
                      value={minPrice}
                      onChange={(value) => setMinPrice(value || undefined)}
                      prefix="$"
                      style={{ width: '100%' }}
                    />
                    <InputNumber
                      placeholder="Máx"
                      min={0}
                      value={maxPrice}
                      onChange={(value) => setMaxPrice(value || undefined)}
                      prefix="$"
                      style={{ width: '100%' }}
                    />
                  </Space>
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Rating mínimo
                  </Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="0"
                    min={0}
                    max={5}
                    step={0.5}
                    value={minRating}
                    onChange={(value) => setMinRating(value || undefined)}
                  />
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Stock
                  </Text>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <InputNumber
                      placeholder="Mín"
                      min={0}
                      value={minStock}
                      onChange={(value) => setMinStock(value || undefined)}
                      style={{ width: '100%' }}
                    />
                    <InputNumber
                      placeholder="Máx"
                      min={0}
                      value={maxStock}
                      onChange={(value) => setMaxStock(value || undefined)}
                      style={{ width: '100%' }}
                    />
                  </Space>
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Fecha de publicación
                  </Text>
                  <DatePicker.RangePicker
                    style={{ width: '100%' }}
                    value={dateRange}
                    onChange={(dates) =>
                      setDateRange(dates as [Dayjs | null, Dayjs | null] | null)
                    }
                    format="YYYY-MM-DD"
                    placeholder={['Desde', 'Hasta']}
                  />
                </div>
              </Space>
            </Card>
          </Col>
        )}
      </Row>

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
                      style={{ width: '100%' }}
                      size="large"
                      format="YYYY-MM-DD"
                      placeholder="Seleccionar fecha"
                      value={field.value && field.value !== '' ? dayjs(field.value) : null}
                      onChange={(date) => {
                        field.onChange(date ? date.format('YYYY-MM-DD') : '');
                      }}
                      onBlur={field.onBlur}
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
