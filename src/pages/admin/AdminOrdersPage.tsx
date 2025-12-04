import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Select, Typography, Tag, Button, Space, message, App, Card } from 'antd';
import { EyeOutlined, ClearOutlined } from '@ant-design/icons';
import api from '../../config/api';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  created_at: string;
}

const statusOptions = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'processing', label: 'Procesando' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'returned', label: 'Devuelto' },
];

const statusColors: Record<string, string> = {
  pending: 'orange',
  confirmed: 'blue',
  processing: 'blue',
  shipped: 'cyan',
  delivered: 'green',
  completed: 'green',
  cancelled: 'red',
  returned: 'purple',
};

export const AdminOrdersPage = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();
  const { message: messageApi } = App.useApp();

  const { data, isLoading } = useQuery<{
    data: Order[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ['admin-orders', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (statusFilter) {
        params.append('status', statusFilter.trim());
      }
      const response = await api.get(`/orders/admin?${params.toString()}`);
      const orders = response.data.data.map((order: any) => ({
        ...order,
        total_amount: typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : order.total_amount,
      }));
      return {
        ...response.data,
        data: orders,
      };
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.put(`/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      messageApi.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  const clearFilter = () => {
    setStatusFilter(undefined);
    setPage(1);
    messageApi.success({
      content: '✅ Filtro limpiado',
      duration: 2,
    });
  };

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
      render: (amount) => `$${typeof amount === 'number' ? amount.toFixed(2) : parseFloat(String(amount || '0')).toFixed(2)}`,
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
      <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Title level={2} style={{ margin: 0 }}>Todos los Pedidos</Title>
        <Space>
          <Text strong>Filtrar por Estado:</Text>
          <Select
            style={{ width: 200 }}
            placeholder="Todos los estados"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            options={statusOptions}
          />
          {statusFilter && (
            <Button icon={<ClearOutlined />} onClick={clearFilter}>
              Limpiar
            </Button>
          )}
        </Space>
      </Space>

      <Card>
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
      </Card>
    </div>
  );
};
