import { useQuery } from '@tanstack/react-query';
import { Table, Typography, Tag, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'orange',
  processing: 'blue',
  shipped: 'cyan',
  delivered: 'green',
  cancelled: 'red',
  returned: 'purple',
};

export const OrdersPage = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<{
    data: Order[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const response = await api.get('/orders/my-orders');
      return response.data;
    },
  });

  const columns: ColumnsType<Order> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <span style={{ fontFamily: 'monospace' }}>{id.slice(0, 8)}...</span>,
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status] || 'default'}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `$${amount.toFixed(2)}`,
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => navigate(`/orders/${record.id}`)}
        >
          Ver Detalles
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Mis Pedidos</Title>
      <Table
        columns={columns}
        dataSource={data?.data}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: data?.page,
          total: data?.total,
          pageSize: data?.limit,
        }}
      />
    </div>
  );
};

