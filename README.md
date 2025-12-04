# Frontend - Bookstore E-commerce

Frontend desarrollado con React, TypeScript, Ant Design, React Query y Zustand.

## Tecnologías

- **React 19** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Ant Design** - Componentes UI
- **React Query (@tanstack/react-query)** - Gestión de estado del servidor
- **React Table (@tanstack/react-table)** - Tablas avanzadas
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas
- **Zustand** - Gestión de estado global
- **React Router** - Navegación
- **Axios** - Cliente HTTP

## Instalación

```bash
pnpm install
```

## Configuración

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:3000
```

## Desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:5173`

## Build

```bash
pnpm build
```

## Estructura del Proyecto

```
src/
├── components/        # Componentes reutilizables
│   ├── auth/        # Componentes de autenticación
│   └── layout/      # Layout principal
├── config/          # Configuración (API, etc.)
├── pages/           # Páginas de la aplicación
│   ├── auth/        # Login, Register
│   ├── customer/    # Páginas para clientes
│   └── admin/       # Páginas para administradores
├── providers/       # Providers (Query, Antd)
├── routes/          # Configuración de rutas
├── store/           # Store de Zustand
└── types/           # Tipos TypeScript
```

## Funcionalidades

### Para Clientes

- ✅ Registro e inicio de sesión
- ✅ Catálogo de libros con búsqueda
- ✅ Detalle de libros
- ✅ Carrito de compras
- ✅ Checkout y creación de pedidos
- ✅ Ver mis pedidos
- ✅ Gestión de direcciones
- ✅ Reseñas de libros

### Para Administradores

- ✅ Gestión completa de libros (CRUD)
- ✅ Gestión de autores, categorías, editoriales
- ✅ Ver todos los pedidos
- ✅ Actualizar estados de pedidos
- ✅ Gestión de usuarios
- ✅ Reportes y estadísticas

## Estado de Autenticación

El estado de autenticación se maneja con Zustand y se persiste en localStorage.

## API Integration

Todas las llamadas a la API se hacen a través de Axios configurado en `src/config/api.ts`. El token JWT se agrega automáticamente a todas las peticiones.
# bookstore-client
