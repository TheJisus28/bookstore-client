import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Row,
  Col,
  Input,
  Pagination,
  Spin,
  Typography,
  Button,
  Space,
  App,
  Select,
  DatePicker,
  InputNumber,
  Tag,
  Empty,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  ClearOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { Meta } = Card;
const { RangePicker } = DatePicker;

interface Book {
  id?: string;
  book_id?: string;
  title: string;
  price: number;
  stock: number;
  average_rating?: number;
  total_reviews?: number;
  publisher_name?: string;
  category_name?: string;
  publication_date?: string;
  language?: string;
  cover_image_url?: string;
  authors?: Array<{ id: string; first_name: string; last_name: string; is_primary: boolean }>;
}

interface BookSearchResult {
  book_id: string;
  title: string;
  price: number | string;
  stock: number;
  average_rating?: number | string;
  total_reviews?: number;
  publisher_name?: string;
  category_name?: string;
  publication_date?: string;
  language?: string;
  authors?: Array<{ id: string; first_name: string; last_name: string; is_primary: boolean }>;
}

interface BooksResponse {
  data: Book[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

export const BooksPage = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

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
      try {
        const response = await api.get('/categories?limit=100');
        console.log('Categories response:', response.data);
        if (!response.data || !response.data.data) {
          console.error('Invalid categories response:', response.data);
          return [];
        }
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching categories:', error);
        message.error('Error al cargar categorías');
        return [];
      }
    },
  });

  const { data: authors, isLoading: authorsLoading } = useQuery<Author[]>({
    queryKey: ['authors'],
    queryFn: async () => {
      try {
        const response = await api.get('/authors?limit=100');
        console.log('Authors response:', response.data);
        if (!response.data || !response.data.data) {
          console.error('Invalid authors response:', response.data);
          return [];
        }
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching authors:', error);
        message.error('Error al cargar autores');
        return [];
      }
    },
  });

  const { data: publishers, isLoading: publishersLoading } = useQuery<Publisher[]>({
    queryKey: ['publishers'],
    queryFn: async () => {
      try {
        const response = await api.get('/publishers?limit=100');
        console.log('Publishers response:', response.data);
        if (!response.data || !response.data.data) {
          console.error('Invalid publishers response:', response.data);
          return [];
        }
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching publishers:', error);
        message.error('Error al cargar editoriales');
        return [];
      }
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
  const { data: normalData, isLoading: normalLoading } = useQuery<BooksResponse>({
    queryKey: ['books', 'normal', page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      });
      const response = await api.get(`/books?${params.toString()}`);
      const books = response.data.data.map((book: Book) => ({
        ...book,
        price: typeof book.price === 'string' ? parseFloat(book.price) : book.price,
      }));
      return {
        ...response.data,
        data: books,
      };
    },
    enabled: !hasFilters,
  });

  // Advanced search query (when filters are active)
  const buildAdvancedQueryParams = () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '12',
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

  const { data: advancedData, isLoading: advancedLoading } = useQuery<BooksResponse>({
    queryKey: [
      'books',
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
      const params = buildAdvancedQueryParams();
      const response = await api.get(`/books/search/advanced?${params}`);
      const books = response.data.data.map((book: BookSearchResult) => ({
        ...book,
        id: book.book_id,
        price: typeof book.price === 'string' ? parseFloat(book.price) : book.price,
        average_rating:
          typeof book.average_rating === 'string'
            ? parseFloat(book.average_rating)
            : book.average_rating,
      }));
      return {
        ...response.data,
        data: books,
      };
    },
    enabled: hasFilters,
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
    message.success({
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

  const getBookId = (book: Book) => book.id || book.book_id || '';

  return (
    <div>
      <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Title level={2} style={{ margin: 0 }}>
          Catálogo de Libros
        </Title>
        <Space>
          {hasFilters && (
            <Tag color="blue">
              {activeFiltersCount()} filtro{activeFiltersCount() > 1 ? 's' : ''} activo
              {activeFiltersCount() > 1 ? 's' : ''}
            </Tag>
          )}
          {hasFilters && (
            <Button icon={<ClearOutlined />} onClick={clearFilters} size="small">
              Limpiar Filtros
            </Button>
          )}
        </Space>
      </Space>

      <Row gutter={24}>
        {/* Main Content - Left Side */}
        <Col xs={24} lg={18}>
          {/* Search Bar */}
          <Input
            prefix={<SearchOutlined />}
            size="large"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ marginBottom: 24 }}
            allowClear
          />

          {/* Sort Controls */}
          <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
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

          {/* Books Grid */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 50 }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              {data && data.data.length > 0 ? (
                <>
                  <Row gutter={[16, 16]}>
                    {data.data.map((book) => (
                      <Col xs={24} sm={12} md={8} lg={6} key={getBookId(book)}>
                        <Card
                          hoverable
                          cover={
                            book.cover_image_url ? (
                              <img
                                alt={book.title}
                                src={book.cover_image_url}
                                style={{ height: 300, objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                style={{
                                  height: 300,
                                  background: '#f0f0f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Text type="secondary">Sin imagen</Text>
                              </div>
                            )
                          }
                          actions={[
                            <Button
                              type="link"
                              onClick={() => navigate(`/books/${getBookId(book)}`)}
                            >
                              Ver Detalles
                            </Button>,
                          ]}
                        >
                          <Meta
                            title={book.title}
                            description={
                              <div>
                                <Text strong style={{ fontSize: 16 }}>
                                  $
                                  {typeof book.price === 'number'
                                    ? book.price.toFixed(2)
                                    : parseFloat(String(book.price || '0')).toFixed(2)}
                                </Text>
                                <br />
                                <Space size="small" style={{ marginTop: 4 }}>
                                  <Text type="secondary">Stock: {book.stock}</Text>
                                  {book.average_rating && book.average_rating > 0 && (
                                    <>
                                      <Divider type="vertical" />
                                      <Text type="secondary">
                                        ⭐ {book.average_rating.toFixed(1)} ({book.total_reviews || 0})
                                      </Text>
                                    </>
                                  )}
                                </Space>
                                {book.authors && book.authors.length > 0 && (
                                  <div style={{ marginTop: 8 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      Por:{' '}
                                      {book.authors
                                        .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
                                        .map((author) => `${author.first_name} ${author.last_name}`)
                                        .join(', ')}
                                    </Text>
                                  </div>
                                )}
                                {book.category_name && (
                                  <div style={{ marginTop: 8 }}>
                                    <Tag color="blue">{book.category_name}</Tag>
                                  </div>
                                )}
                                {book.publisher_name && (
                                  <div style={{ marginTop: 4 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      {book.publisher_name}
                                    </Text>
                                  </div>
                                )}
                              </div>
                            }
                          />
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  {data && data.totalPages > 1 && (
                    <div style={{ marginTop: 24, textAlign: 'center' }}>
                      <Pagination
                        current={page}
                        total={data.total}
                        pageSize={data.limit}
                        onChange={setPage}
                        showSizeChanger={false}
                      />
                    </div>
                  )}
                </>
              ) : (
                <Empty
                  description="No se encontraron libros con los filtros seleccionados"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  {hasFilters && (
                    <Button type="primary" onClick={clearFilters}>
                      Limpiar Filtros
                    </Button>
                  )}
                </Empty>
              )}
            </>
          )}
        </Col>

        {/* Filters Sidebar - Right Side */}
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
              {/* Category Filter */}
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
                  notFoundContent={categoriesLoading ? <Spin size="small" /> : 'No hay categorías'}
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

              {/* Author Filter */}
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
                  notFoundContent={authorsLoading ? <Spin size="small" /> : 'No hay autores'}
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

              {/* Publisher Filter */}
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
                  notFoundContent={publishersLoading ? <Spin size="small" /> : 'No hay editoriales'}
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

              {/* Language Filter */}
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

              {/* Price Range */}
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

              {/* Rating Filter */}
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

              {/* Stock Range */}
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

              {/* Publication Date Range */}
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Fecha de publicación
                </Text>
                <RangePicker
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
      </Row>
    </div>
  );
};
