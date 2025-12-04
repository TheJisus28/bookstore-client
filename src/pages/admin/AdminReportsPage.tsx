import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  DatePicker,
  Table,
  Typography,
  Space,
  Statistic,
  Row,
  Col,
  Select,
  InputNumber,
  Button,
  Tag,
  Divider,
  App,
  Spin,
  Empty,
} from 'antd';
import {
  ClearOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import api from '../../config/api';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface SalesReport {
  sale_date: string;
  total_orders: number;
  unique_customers: number;
  total_revenue: number;
  total_items_sold: number;
  average_order_value: number;
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

interface Book {
  id: string;
  title: string;
}

interface SoldBook {
  book_id: string;
  title: string;
  isbn: string;
  price: number;
  cover_image_url?: string;
  category_name?: string;
  publisher_name?: string;
  total_quantity_sold: number;
  total_revenue: number;
  orders_count: number;
  average_sale_price: number;
}

export const AdminReportsPage = () => {
  const { message } = App.useApp();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Filter states
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [authorId, setAuthorId] = useState<string | undefined>(undefined);
  const [publisherId, setPublisherId] = useState<string | undefined>(undefined);
  const [bookId, setBookId] = useState<string | undefined>(undefined);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [orderStatus, setOrderStatus] = useState<string | undefined>(undefined);

  // Fetch filter options
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

  const { data: books, isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ['books-for-reports'],
    queryFn: async () => {
      const response = await api.get('/books?limit=100');
      return response.data.data || [];
    },
  });

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (dateRange && dateRange[0]) {
      params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
    }
    if (dateRange && dateRange[1]) {
      params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
    }
    if (categoryId) params.append('category', categoryId);
    if (authorId) params.append('author', authorId);
    if (publisherId) params.append('publisher', publisherId);
    if (bookId) params.append('book', bookId);
    if (minPrice !== undefined) params.append('minPrice', minPrice.toString());
    if (maxPrice !== undefined) params.append('maxPrice', maxPrice.toString());
    if (orderStatus) params.append('status', orderStatus);
    return params.toString();
  };

  const { data: salesReport, isLoading } = useQuery<SalesReport[]>({
    queryKey: ['sales-report', dateRange, categoryId, authorId, publisherId, bookId, minPrice, maxPrice, orderStatus],
    queryFn: async () => {
      if (!dateRange) return [];
      const params = buildQueryParams();
      const response = await api.get(`/reports/sales?${params}`);
      return response.data.map((item: any) => ({
        ...item,
        total_orders: typeof item.total_orders === 'string' ? parseInt(item.total_orders, 10) : item.total_orders,
        unique_customers: typeof item.unique_customers === 'string' ? parseInt(item.unique_customers, 10) : item.unique_customers,
        total_revenue: typeof item.total_revenue === 'string' ? parseFloat(item.total_revenue) : item.total_revenue,
        total_items_sold: typeof item.total_items_sold === 'string' ? parseInt(item.total_items_sold, 10) : item.total_items_sold,
        average_order_value: typeof item.average_order_value === 'string' ? parseFloat(item.average_order_value) : item.average_order_value,
      }));
    },
    enabled: !!dateRange,
  });

  const { data: soldBooks, isLoading: soldBooksLoading } = useQuery<SoldBook[]>({
    queryKey: ['sold-books', dateRange, categoryId, authorId, publisherId, bookId, minPrice, maxPrice, orderStatus],
    queryFn: async () => {
      if (!dateRange) return [];
      const params = buildQueryParams();
      const response = await api.get(`/reports/sold-books?${params}`);
      return response.data.map((item: any) => ({
        ...item,
        total_quantity_sold: typeof item.total_quantity_sold === 'string' ? parseInt(item.total_quantity_sold, 10) : item.total_quantity_sold,
        total_revenue: typeof item.total_revenue === 'string' ? parseFloat(item.total_revenue) : item.total_revenue,
        orders_count: typeof item.orders_count === 'string' ? parseInt(item.orders_count, 10) : item.orders_count,
        average_sale_price: typeof item.average_sale_price === 'string' ? parseFloat(item.average_sale_price) : item.average_sale_price,
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
      }));
    },
    enabled: !!dateRange,
  });

  const clearFilters = () => {
    setCategoryId(undefined);
    setAuthorId(undefined);
    setPublisherId(undefined);
    setBookId(undefined);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setOrderStatus(undefined);
    message.success({
      content: '✅ Filtros limpiados',
      duration: 2,
    });
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (categoryId) count++;
    if (authorId) count++;
    if (publisherId) count++;
    if (bookId) count++;
    if (minPrice !== undefined || maxPrice !== undefined) count++;
    if (orderStatus) count++;
    return count;
  };

  const totalRevenue = salesReport?.reduce((sum, item) => {
    const revenue = typeof item.total_revenue === 'number' ? item.total_revenue : parseFloat(item.total_revenue || '0');
    return sum + revenue;
  }, 0) || 0;
  const totalOrders = salesReport?.reduce((sum, item) => {
    const orders = typeof item.total_orders === 'number' ? item.total_orders : parseInt(item.total_orders || '0', 10);
    return sum + orders;
  }, 0) || 0;
  const totalItems = salesReport?.reduce((sum, item) => {
    const items = typeof item.total_items_sold === 'number' ? item.total_items_sold : parseInt(item.total_items_sold || '0', 10);
    return sum + items;
  }, 0) || 0;

  const columns: ColumnsType<SalesReport> = [
    {
      title: 'Fecha',
      dataIndex: 'sale_date',
      key: 'sale_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Pedidos',
      dataIndex: 'total_orders',
      key: 'total_orders',
    },
    {
      title: 'Clientes Únicos',
      dataIndex: 'unique_customers',
      key: 'unique_customers',
    },
    {
      title: 'Ingresos',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (revenue) => `$${typeof revenue === 'number' ? revenue.toFixed(2) : parseFloat(String(revenue || '0')).toFixed(2)}`,
    },
    {
      title: 'Items Vendidos',
      dataIndex: 'total_items_sold',
      key: 'total_items_sold',
    },
    {
      title: 'Ticket Promedio',
      dataIndex: 'average_order_value',
      key: 'average_order_value',
      render: (value) => `$${typeof value === 'number' ? value.toFixed(2) : parseFloat(String(value || '0')).toFixed(2)}`,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Title level={2} style={{ margin: 0 }}>Reportes de Ventas</Title>
        <Space>
          {activeFiltersCount() > 0 && (
            <Tag color="blue">
              {activeFiltersCount()} filtro{activeFiltersCount() > 1 ? 's' : ''} activo{activeFiltersCount() > 1 ? 's' : ''}
            </Tag>
          )}
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFiltersVisible(!filtersVisible)}
            type={filtersVisible ? 'primary' : 'default'}
          >
            Filtros
          </Button>
          {activeFiltersCount() > 0 && (
            <Button icon={<ClearOutlined />} onClick={clearFilters}>
              Limpiar
            </Button>
          )}
        </Space>
      </Space>

      <Row gutter={24}>
        <Col xs={24} lg={filtersVisible ? 18 : 24}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Space>
              <Text strong>Rango de Fechas:</Text>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
                format="YYYY-MM-DD"
              />
            </Space>

            <Row gutter={16}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Ingresos Totales"
                    value={totalRevenue}
                    prefix="$"
                    precision={2}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic title="Total de Pedidos" value={totalOrders} />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic title="Items Vendidos" value={totalItems} />
                </Card>
              </Col>
            </Row>

            <Card title="Reporte por Fecha">
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: 50 }}>
                  <Spin size="large" />
                </div>
              ) : salesReport && salesReport.length > 0 ? (
                <Table
                  columns={columns}
                  dataSource={salesReport}
                  rowKey="sale_date"
                  loading={isLoading}
                  pagination={false}
                />
              ) : (
                <Empty description="No hay datos para el rango de fechas seleccionado" />
              )}
            </Card>

            <Card title="Libros Vendidos">
              {soldBooksLoading ? (
                <div style={{ textAlign: 'center', padding: 50 }}>
                  <Spin size="large" />
                </div>
              ) : soldBooks && soldBooks.length > 0 ? (
                <Table
                  columns={[
                    {
                      title: 'Portada',
                      dataIndex: 'cover_image_url',
                      key: 'cover_image_url',
                      width: 80,
                      render: (url) =>
                        url ? (
                          <img src={url} alt="cover" style={{ width: 50, height: 70, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 50, height: 70, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Text type="secondary" style={{ fontSize: 10 }}>Sin imagen</Text>
                          </div>
                        ),
                    },
                    {
                      title: 'Título',
                      dataIndex: 'title',
                      key: 'title',
                    },
                    {
                      title: 'ISBN',
                      dataIndex: 'isbn',
                      key: 'isbn',
                    },
                    {
                      title: 'Categoría',
                      dataIndex: 'category_name',
                      key: 'category_name',
                      render: (name) => name ? <Tag>{name}</Tag> : '-',
                    },
                    {
                      title: 'Editorial',
                      dataIndex: 'publisher_name',
                      key: 'publisher_name',
                    },
                    {
                      title: 'Cantidad Vendida',
                      dataIndex: 'total_quantity_sold',
                      key: 'total_quantity_sold',
                      align: 'right',
                    },
                    {
                      title: 'Ingresos',
                      dataIndex: 'total_revenue',
                      key: 'total_revenue',
                      align: 'right',
                      render: (revenue) => `$${typeof revenue === 'number' ? revenue.toFixed(2) : parseFloat(String(revenue || '0')).toFixed(2)}`,
                    },
                    {
                      title: 'Pedidos',
                      dataIndex: 'orders_count',
                      key: 'orders_count',
                      align: 'right',
                    },
                    {
                      title: 'Precio Promedio',
                      dataIndex: 'average_sale_price',
                      key: 'average_sale_price',
                      align: 'right',
                      render: (price) => `$${typeof price === 'number' ? price.toFixed(2) : parseFloat(String(price || '0')).toFixed(2)}`,
                    },
                  ]}
                  dataSource={soldBooks}
                  rowKey="book_id"
                  loading={soldBooksLoading}
                  pagination={{ pageSize: 10 }}
                />
              ) : (
                <Empty description="No hay libros vendidos para el rango de fechas seleccionado" />
              )}
            </Card>
          </Space>
        </Col>

        {filtersVisible && (
          <Col xs={24} lg={6}>
            <Card
              title={
                <Space>
                  <Text strong>Filtros</Text>
                  {activeFiltersCount() > 0 && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {activeFiltersCount()}
                    </Tag>
                  )}
                </Space>
              }
              extra={
                activeFiltersCount() > 0 && (
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
                    Libro Específico
                  </Text>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Todos"
                    value={bookId}
                    onChange={setBookId}
                    allowClear
                    showSearch
                    loading={booksLoading}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={(books || []).map((book) => ({
                      value: book.id,
                      label: book.title,
                    }))}
                  />
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Precio Unitario
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
                    Estado del Pedido
                  </Text>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Todos (shipped/delivered/completed)"
                    value={orderStatus}
                    onChange={setOrderStatus}
                    allowClear
                    options={[
                      { value: 'pending', label: 'Pendiente' },
                      { value: 'confirmed', label: 'Confirmado' },
                      { value: 'shipped', label: 'Enviado' },
                      { value: 'delivered', label: 'Entregado' },
                      { value: 'completed', label: 'Completado' },
                      { value: 'cancelled', label: 'Cancelado' },
                    ]}
                  />
                </div>
              </Space>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};
