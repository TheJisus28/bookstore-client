import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Select, Typography, Tag, Button, Space, message, Input } from 'antd';
import api from '../../config/api';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

export const AdminUsersPage = () => {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{
    data: User[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ['admin-users', page, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (roleFilter) {
        params.append('role', roleFilter);
      }
      const response = await api.get(`/users?${params.toString()}`);
      return response.data;
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      await api.put(`/users/${id}`, data);
    },
    onSuccess: () => {
      message.success('Usuario actualizado');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const columns: ColumnsType<User> = [
    {
      title: 'Nombre',
      key: 'name',
      render: (_, record) => `${record.first_name} ${record.last_name}`,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>{role.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Select
            value={record.role}
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'customer', label: 'Customer' },
            ]}
            onChange={(value) =>
              updateUserMutation.mutate({ id: record.id, data: { role: value } })
            }
            style={{ minWidth: 120 }}
          />
          <Select
            value={record.is_active ? 'active' : 'inactive'}
            options={[
              { value: 'active', label: 'Activo' },
              { value: 'inactive', label: 'Inactivo' },
            ]}
            onChange={(value) =>
              updateUserMutation.mutate({
                id: record.id,
                data: { is_active: value === 'active' },
              })
            }
            style={{ minWidth: 120 }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 24, width: '100%' }} direction="horizontal">
        <Title level={2} style={{ margin: 0 }}>
          Usuarios
        </Title>
        <Select
          placeholder="Filtrar por rol"
          allowClear
          style={{ width: 200 }}
          options={[
            { value: 'admin', label: 'Admin' },
            { value: 'customer', label: 'Customer' },
          ]}
          onChange={setRoleFilter}
        />
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
      />
    </div>
  );
};

