import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, DatePicker, Table, Typography, Space, Statistic, Row, Col } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import api from '../../config/api';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface SalesReport {
  sale_date: string;
  total_orders: number;
  unique_customers: number;
  total_revenue: number;
  total_items_sold: number;
  average_order_value: number;
}

export const AdminReportsPage = () => {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);

  const { data: salesReport, isLoading } = useQuery<SalesReport[]>({
    queryKey: ['sales-report', dateRange],
    queryFn: async () => {
      if (!dateRange) return [];
      const response = await api.get(
        `/reports/sales?startDate=${dateRange[0].format('YYYY-MM-DD')}&endDate=${dateRange[1].format('YYYY-MM-DD')}`,
      );
      // Convertir valores numéricos de string a number si vienen como string
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
      render: (revenue) => `$${typeof revenue === 'number' ? revenue.toFixed(2) : parseFloat(revenue || '0').toFixed(2)}`,
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
      render: (value) => `$${typeof value === 'number' ? value.toFixed(2) : parseFloat(value || '0').toFixed(2)}`,
    },
  ];

  return (
    <div>
      <Title level={2}>Reportes de Ventas</Title>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space>
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

        <Card>
          <Table
            columns={columns}
            dataSource={salesReport}
            rowKey="sale_date"
            loading={isLoading}
            pagination={false}
          />
        </Card>
      </Space>
    </div>
  );
};

