import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Select, Typography, Tag, Button, Space, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import api from '../../config/api';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  created_at: string;
}

const statusOptions = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'processing', label: 'Procesando' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'returned', label: 'Devuelto' },
];

const statusColors: Record<string, string> = {
  pending: 'orange',
  processing: 'blue',
  shipped: 'cyan',
  delivered: 'green',
  cancelled: 'red',
  returned: 'purple',
};

export const AdminOrdersPage = () => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{
    data: Order[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ['admin-orders', page],
    queryFn: async () => {
      const response = await api.get(`/orders/admin?page=${page}&limit=10`);
      return response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.put(`/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      message.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
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
      render: (status, record) => (
        <Space>
          <Tag color={statusColors[status] || 'default'}>{status.toUpperCase()}</Tag>
          <Select
            value={status}
            options={statusOptions}
            onChange={(value) =>
              updateStatusMutation.mutate({ id: record.id, status: value })
            }
            style={{ minWidth: 120 }}
          />
        </Space>
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
        <Button icon={<EyeOutlined />} onClick={() => window.open(`/orders/${record.id}`, '_blank')}>
          Ver Detalles
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Todos los Pedidos</Title>
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
      />
    </div>
  );
};

