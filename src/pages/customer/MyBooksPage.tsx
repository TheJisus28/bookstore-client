import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Row,
  Col,
  Spin,
  Typography,
  Button,
  Space,
  App,
  Rate,
  Input,
  Form,
  Modal,
  Empty,
  Tag,
  Divider,
  Avatar,
  List,
} from 'antd';
import {
  StarOutlined,
  BookOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Meta } = Card;

interface PurchasedBook {
  id: string;
  title: string;
  isbn: string;
  price: number;
  cover_image_url?: string;
  description?: string;
  language: string;
  pages?: number;
  publication_date?: string;
  last_purchased_at: string;
  has_review: boolean;
  review_id?: string;
  review_rating?: number;
  review_comment?: string;
}


export const MyBooksPage = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [selectedBook, setSelectedBook] = useState<PurchasedBook | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: books, isLoading } = useQuery<PurchasedBook[]>({
    queryKey: ['my-books'],
    queryFn: async () => {
      const response = await api.get('/orders/my-books');
      return response.data.map((book: any) => ({
        ...book,
        price: typeof book.price === 'string' ? parseFloat(book.price) : book.price,
        review_rating: book.review_rating ? parseInt(book.review_rating) : undefined,
      }));
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async ({ bookId, data }: { bookId: string; data: ReviewFormData }) => {
      const response = await api.post('/reviews', {
        book_id: bookId,
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
      reset();
      queryClient.invalidateQueries({ queryKey: ['my-books'] });
      if (selectedBook) {
        queryClient.invalidateQueries({ queryKey: ['reviews', 'book', selectedBook.id] });
        queryClient.invalidateQueries({ queryKey: ['can-review', selectedBook.id] });
      }
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      message.error({
        content: err.response?.data?.message || 'Error al crear la reseña',
        duration: 4,
      });
    },
  });

  const handleReviewClick = (book: PurchasedBook) => {
    setSelectedBook(book);
    if (book.has_review && book.review_rating) {
      form.setFieldsValue({
        rating: book.review_rating,
        comment: book.review_comment || '',
      });
    } else {
      form.setFieldsValue({
        rating: 5,
        comment: '',
      });
    }
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = (values: { rating: number; comment?: string }) => {
    if (!selectedBook) return;
    createReviewMutation.mutate({
      bookId: selectedBook.id,
      data: {
        rating: values.rating,
        comment: values.comment,
      },
    });
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Title level={2} style={{ margin: 0 }}>
          <BookOutlined /> Mis Libros
        </Title>
        <Text type="secondary">
          {books?.length || 0} libro{books?.length !== 1 ? 's' : ''} comprado{books?.length !== 1 ? 's' : ''}
        </Text>
      </Space>

      {books && books.length > 0 ? (
        <Row gutter={[16, 16]}>
          {books.map((book) => (
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
                    key="view"
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/books/${book.id}`)}
                  >
                    Ver
                  </Button>,
                  !book.has_review ? (
                    <Button
                      key="review"
                      type="link"
                      icon={<StarOutlined />}
                      onClick={() => handleReviewClick(book)}
                    >
                      Reseñar
                    </Button>
                  ) : null,
                ].filter(Boolean)}
              >
                <Meta
                  title={book.title}
                  description={
                    <div>
                      <Text strong style={{ fontSize: 16 }}>
                        ${book.price.toFixed(2)}
                      </Text>
                      <br />
                      <Space size="small" style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Comprado: {new Date(book.last_purchased_at).toLocaleDateString()}
                        </Text>
                      </Space>
                      {book.has_review && book.review_rating && (
                        <div style={{ marginTop: 8 }}>
                          <Tag color="green">Ya reseñado</Tag>
                          <Rate disabled defaultValue={book.review_rating} style={{ fontSize: 12 }} />
                        </div>
                      )}
                      {!book.has_review && (
                        <div style={{ marginTop: 8 }}>
                          <Tag color="orange">Pendiente de reseñar</Tag>
                        </div>
                      )}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty
          description="Aún no has comprado ningún libro"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => navigate('/books')}>
            Explorar Libros
          </Button>
        </Empty>
      )}

      {/* Review Modal */}
      <Modal
        title={
          selectedBook ? (
            <Space>
              <StarOutlined />
              <Text strong>
                Dejar Reseña - {selectedBook.title}
              </Text>
            </Space>
          ) : (
            'Dejar Reseña'
          )
        }
        open={isReviewModalOpen}
        onCancel={() => {
          setIsReviewModalOpen(false);
          form.resetFields();
          setSelectedBook(null);
        }}
        footer={null}
        width={600}
      >
        {selectedBook && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleReviewSubmit}
            initialValues={{
              rating: selectedBook.has_review ? selectedBook.review_rating : 5,
              comment: selectedBook.review_comment || '',
            }}
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
                <Button
                  onClick={() => {
                    setIsReviewModalOpen(false);
                    form.resetFields();
                    setSelectedBook(null);
                  }}
                >
                  Cancelar
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

