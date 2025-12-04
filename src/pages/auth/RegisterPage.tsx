import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useMutation } from '@tanstack/react-query';
import api from '../../config/api';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

const { Title } = Typography;

const registerSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida').min(6, 'La contraseña debe tener al menos 6 caracteres'),
  first_name: z.string().min(1, 'El nombre es requerido').min(2, 'El nombre debe tener al menos 2 caracteres'),
  last_name: z.string().min(1, 'El apellido es requerido').min(2, 'El apellido debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { message } = App.useApp();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await api.post('/auth/register', data);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.access_token);
      message.success({
        content: `🎉 ¡Bienvenido, ${data.user.first_name}! Tu cuenta ha sido creada exitosamente.`,
        duration: 5,
      });
      setTimeout(() => {
        navigate('/');
      }, 1500);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      message.error({
        content: err.response?.data?.message || 'Error al registrarse. Por favor, intenta nuevamente.',
        duration: 4,
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
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
          maxWidth: 500,
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
          Registrarse
        </Title>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Form.Item
              validateStatus={errors.first_name ? 'error' : ''}
              help={errors.first_name?.message}
            >
              <Controller
                name="first_name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<UserOutlined />}
                    placeholder="Nombre"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              validateStatus={errors.last_name ? 'error' : ''}
              help={errors.last_name?.message}
            >
              <Controller
                name="last_name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<UserOutlined />}
                    placeholder="Apellido"
                    size="large"
                  />
                )}
              />
            </Form.Item>

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
                    prefix={<MailOutlined />}
                    placeholder="Email"
                    size="large"
                    type="email"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              validateStatus={errors.phone ? 'error' : ''}
              help={errors.phone?.message}
            >
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<PhoneOutlined />}
                    placeholder="Teléfono (opcional)"
                    size="large"
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
                loading={registerMutation.isPending}
              >
                Registrarse
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
            </div>
          </form>
        </Card>
    </div>
  );
};

