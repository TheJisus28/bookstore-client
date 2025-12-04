import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Typography,
  Button,
  Space,
  Spin,
  InputNumber,
  App,
  Descriptions,
  Divider,
  Row,
  Col,
} from 'antd';
import { ShoppingCartOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import api from '../../config/api';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';

const { Title, Text, Paragraph } = Typography;

interface Book {
  id: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  isbn: string;
  pages?: number;
  publication_date?: string;
  language: string;
  cover_image_url?: string;
}

export const BookDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [quantity, setQuantity] = useState(1);
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const { data: book, isLoading } = useQuery<Book>({
    queryKey: ['book', id],
    queryFn: async () => {
      const response = await api.get(`/books/${id}`);
      // Convertir price de string a number si viene como string
      const bookData = response.data;
      return {
        ...bookData,
        price: typeof bookData.price === 'string' ? parseFloat(bookData.price) : bookData.price,
      };
    },
    enabled: !!id,
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ bookId, qty }: { bookId: string; qty: number }) => {
      if (!bookId) {
        throw new Error('ID del libro no válido');
      }
      
      // Validar que el ID sea un UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const cleanId = bookId.trim();
      
      if (!uuidRegex.test(cleanId)) {
        console.error('ID inválido:', cleanId, 'Tipo:', typeof cleanId);
        throw new Error('ID del libro no es un UUID válido');
      }
      
      // Asegurar que quantity sea un número entero
      const quantity = Math.floor(qty);
      
      const payload = {
        book_id: cleanId,
        quantity: quantity,
      };
      
      console.log('Enviando al carrito:', payload);
      console.log('Tipo de book_id:', typeof payload.book_id);
      console.log('Valor de book_id:', JSON.stringify(payload.book_id));
      
      const response = await api.post('/cart', payload);
      return response.data;
    },
    onSuccess: (_, variables) => {
      message.success({
        content: `✅ ${variables.qty} ${variables.qty === 1 ? 'ejemplar agregado' : 'ejemplares agregados'} al carrito exitosamente`,
        duration: 4,
      });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      message.error({
        content: err.response?.data?.message || 'Error al agregar al carrito',
        duration: 4,
      });
    },
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      message.warning({
        content: '⚠️ Debes iniciar sesión para agregar al carrito',
        duration: 3,
      });
      navigate('/login');
      return;
    }
    if (!book?.id) {
      message.error({
        content: '❌ ID del libro no válido',
        duration: 3,
      });
      return;
    }
    addToCartMutation.mutate({ bookId: book.id, qty: quantity });
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!book) {
    return <div>Libro no encontrado</div>;
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/books')}
        style={{ marginBottom: 24 }}
      >
        Volver
      </Button>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={24} md={8}>
          {book.cover_image_url ? (
            <img
              src={book.cover_image_url}
              alt={book.title}
              style={{ width: '100%', borderRadius: 8 }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: 400,
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
              }}
            >
              <Text type="secondary">Sin imagen</Text>
            </div>
          )}
        </Col>

        <Col xs={24} sm={24} md={16}>
          <Title level={2}>{book.title}</Title>
          <Title level={3} style={{ color: '#1890ff' }}>
            ${typeof book.price === 'number' ? book.price.toFixed(2) : parseFloat(book.price || '0').toFixed(2)}
          </Title>

          <Divider />

          <Descriptions column={1} bordered>
            <Descriptions.Item label="ISBN">{book.isbn}</Descriptions.Item>
            <Descriptions.Item label="Idioma">{book.language}</Descriptions.Item>
            {book.pages && (
              <Descriptions.Item label="Páginas">{book.pages}</Descriptions.Item>
            )}
            {book.publication_date && (
              <Descriptions.Item label="Fecha de Publicación">
                {new Date(book.publication_date).toLocaleDateString()}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Stock">{book.stock}</Descriptions.Item>
          </Descriptions>

          {book.description && (
            <>
              <Divider />
              <Title level={4}>Descripción</Title>
              <Paragraph>{book.description}</Paragraph>
            </>
          )}

          <Divider />

          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space size="middle" style={{ width: '100%' }}>
              <Text strong>Cantidad:</Text>
              <InputNumber
                min={1}
                max={book.stock}
                value={quantity}
                onChange={(value) => setQuantity(value || 1)}
                size="large"
              />
            </Space>
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              size="large"
              block
              onClick={handleAddToCart}
              loading={addToCartMutation.isPending}
              disabled={book.stock === 0}
            >
              {book.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

