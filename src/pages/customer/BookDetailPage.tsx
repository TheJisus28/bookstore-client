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
  Card,
  Rate,
  Input,
  Form,
  List,
  Avatar,
  Empty,
  Modal,
  Alert,
} from 'antd';
import {
  ShoppingCartOutlined,
  ArrowLeftOutlined,
  StarOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import api from '../../config/api';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

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

interface Review {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
}

interface ReviewsResponse {
  data: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const reviewSchema = z.object({
  rating: z.number().min(1, 'La calificación es requerida').max(5, 'La calificación debe ser entre 1 y 5'),
  comment: z.string().optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export const BookDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [quantity, setQuantity] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const { data: book, isLoading } = useQuery<Book>({
    queryKey: ['book', id],
    queryFn: async () => {
      const response = await api.get(`/books/${id}`);
      const bookData = response.data;
      return {
        ...bookData,
        price: typeof bookData.price === 'string' ? parseFloat(bookData.price) : bookData.price,
      };
    },
    enabled: !!id,
  });

  // Check if user can review this book
  const { data: canReviewData } = useQuery<{ canReview: boolean; hasReviewed: boolean }>({
    queryKey: ['can-review', id],
    queryFn: async () => {
      const response = await api.get(`/reviews/can-review/${id}`);
      return response.data;
    },
    enabled: !!id && isAuthenticated,
  });

  // Get reviews for this book
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery<ReviewsResponse>({
    queryKey: ['reviews', id, reviewPage],
    queryFn: async () => {
      const response = await api.get(`/reviews/book/${id}?page=${reviewPage}&limit=10`);
      return response.data;
    },
    enabled: !!id,
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ bookId, qty }: { bookId: string; qty: number }) => {
      if (!bookId) {
        throw new Error('ID del libro no válido');
      }
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const cleanId = bookId.trim();
      
      if (!uuidRegex.test(cleanId)) {
        throw new Error('ID del libro no es un UUID válido');
      }
      
      const quantity = Math.floor(qty);
      
      const payload = {
        book_id: cleanId,
        quantity: quantity,
      };
      
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

  const createReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const response = await api.post('/reviews', {
        book_id: id,
        rating: data.rating,
        comment: data.comment || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      message.success({
        content: '✅ Reseña creada exitosamente',
        duration: 3,
      });
      setIsReviewModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['can-review', id] });
      // Also invalidate the book query to refresh average rating
      queryClient.invalidateQueries({ queryKey: ['book', id] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      message.error({
        content: err.response?.data?.message || 'Error al crear la reseña',
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

  const handleReviewSubmit = (values: ReviewFormData) => {
    if (!isAuthenticated) {
      message.warning({
        content: '⚠️ Debes iniciar sesión para dejar una reseña',
        duration: 3,
      });
      navigate('/login');
      return;
    }
    createReviewMutation.mutate(values);
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
            ${typeof book.price === 'number' ? book.price.toFixed(2) : parseFloat(String(book.price || '0')).toFixed(2)}
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

      <Divider />

      {/* Reviews Section */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <StarOutlined />
                <Text strong>Reseñas ({reviewsData?.total || 0})</Text>
              </Space>
            }
            extra={
              canReviewData?.canReview && (
                <Button
                  type="primary"
                  icon={<StarOutlined />}
                  onClick={() => setIsReviewModalOpen(true)}
                >
                  Dejar Reseña
                </Button>
              )
            }
          >
            {reviewsLoading ? (
              <div style={{ textAlign: 'center', padding: 50 }}>
                <Spin />
              </div>
            ) : reviewsData && reviewsData.data.length > 0 ? (
              <List
                itemLayout="vertical"
                dataSource={reviewsData.data}
                renderItem={(review) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: '#1890ff' }}>
                          {review.first_name?.[0] || 'U'}
                        </Avatar>
                      }
                      title={
                        <Space>
                          <Text strong>
                            {review.first_name} {review.last_name}
                          </Text>
                          <Rate disabled defaultValue={review.rating} style={{ fontSize: 14 }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(review.created_at).toLocaleDateString()}
                          </Text>
                        </Space>
                      }
                      description={
                        review.comment ? (
                          <Paragraph style={{ marginBottom: 0 }}>{review.comment}</Paragraph>
                        ) : (
                          <Text type="secondary" style={{ fontStyle: 'italic' }}>
                            Sin comentario
                          </Text>
                        )
                      }
                    />
                  </List.Item>
                )}
                pagination={{
                  current: reviewPage,
                  total: reviewsData.total,
                  pageSize: reviewsData.limit,
                  onChange: setReviewPage,
                  showSizeChanger: false,
                }}
              />
            ) : (
              <Empty description="Aún no hay reseñas para este libro" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {canReviewData && (
            <Card>
              {canReviewData.hasReviewed ? (
                <Alert
                  message="Ya has dejado una reseña"
                  description="Ya has calificado este libro. Puedes ver tu reseña en la lista."
                  type="info"
                  showIcon
                />
              ) : canReviewData.canReview ? (
                <Alert
                  message="Puedes dejar una reseña"
                  description="Has comprado este libro. ¡Comparte tu opinión!"
                  type="success"
                  showIcon
                  action={
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => setIsReviewModalOpen(true)}
                    >
                      Reseñar
                    </Button>
                  }
                />
              ) : (
                <Alert
                  message="Compra este libro para reseñarlo"
                  description="Solo los usuarios que han comprado este libro pueden dejar una reseña."
                  type="warning"
                  showIcon
                />
              )}
            </Card>
          )}
        </Col>
      </Row>

      {/* Review Modal */}
      <Modal
        title="Dejar Reseña"
        open={isReviewModalOpen}
        onCancel={() => {
          setIsReviewModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleReviewSubmit}
        >
          <Form.Item
            label="Calificación"
            name="rating"
            rules={[{ required: true, message: 'Por favor, califica el libro' }]}
          >
            <Rate />
          </Form.Item>

          <Form.Item
            label="Comentario (opcional)"
            name="comment"
          >
            <TextArea
              rows={4}
              placeholder="Comparte tu opinión sobre este libro..."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createReviewMutation.isPending}
              >
                Publicar Reseña
              </Button>
              <Button onClick={() => {
                setIsReviewModalOpen(false);
                form.resetFields();
              }}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
