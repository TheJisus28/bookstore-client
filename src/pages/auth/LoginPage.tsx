import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useMutation } from '@tanstack/react-query';
import api from '../../config/api';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

const { Title } = Typography;

const loginSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida').min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { message } = App.useApp();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await api.post('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.access_token);
      message.success({
        content: `✅ ¡Bienvenido, ${data.user.first_name}! Sesión iniciada exitosamente.`,
        duration: 4,
      });
      setTimeout(() => {
        navigate(data.user.role === 'admin' ? '/admin/books' : '/');
      }, 800);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      message.error({
        content: err.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.',
        duration: 4,
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 450,
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
          Iniciar Sesión
        </Title>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Form.Item
              validateStatus={errors.email ? 'error' : ''}
              help={errors.email?.message}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<UserOutlined />}
                    placeholder="Email"
                    size="large"
                    type="email"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              validateStatus={errors.password ? 'error' : ''}
              help={errors.password?.message}
              style={{ marginBottom: 16 }}
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    prefix={<LockOutlined />}
                    placeholder="Contraseña"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loginMutation.isPending}
              >
                Iniciar Sesión
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Link to="/register">¿No tienes cuenta? Regístrate</Link>
            </div>
          </form>
        </Card>
    </div>
  );
};

