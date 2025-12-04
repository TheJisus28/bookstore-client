import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Input, Pagination, Spin, Typography, Button, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';

const { Title, Text } = Typography;
const { Meta } = Card;

interface Book {
  id: string;
  title: string;
  price: number;
  cover_image_url?: string;
  stock: number;
  isbn: string;
}

interface BooksResponse {
  data: Book[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const BooksPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<BooksResponse>({
    queryKey: ['books', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      });
      if (search) {
        params.append('search', search);
      }
      const response = await api.get(`/books?${params.toString()}`);
      // Convertir price de string a number si viene como string
      const books = response.data.data.map((book: any) => ({
        ...book,
        price: typeof book.price === 'string' ? parseFloat(book.price) : book.price,
      }));
      return {
        ...response.data,
        data: books,
      };
    },
  });

  return (
    <div>
      <Title level={2}>Catálogo de Libros</Title>

      <Space style={{ marginBottom: 24, width: '100%' }} direction="vertical" size="large">
        <Input
          placeholder="Buscar libros..."
          prefix={<SearchOutlined />}
          size="large"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 400 }}
        />
      </Space>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {data?.data.map((book) => (
              <Col xs={24} sm={12} md={8} lg={6} key={book.id}>
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
                      onClick={() => navigate(`/books/${book.id}`)}
                    >
                      Ver Detalles
                    </Button>,
                  ]}
                >
                  <Meta
                    title={book.title}
                    description={
                      <div>
                        <Text strong>${typeof book.price === 'number' ? book.price.toFixed(2) : parseFloat(book.price || '0').toFixed(2)}</Text>
                        <br />
                        <Text type="secondary">Stock: {book.stock}</Text>
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
      )}
    </div>
  );
};

