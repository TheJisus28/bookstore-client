import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { BooksPage } from '../pages/customer/BooksPage';
import { BookDetailPage } from '../pages/customer/BookDetailPage';
import { CartPage } from '../pages/customer/CartPage';
import { CheckoutPage } from '../pages/customer/CheckoutPage';
import { OrdersPage } from '../pages/customer/OrdersPage';
import { AddressesPage } from '../pages/customer/AddressesPage';
import { AdminBooksPage } from '../pages/admin/AdminBooksPage';
import { AdminOrdersPage } from '../pages/admin/AdminOrdersPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminReportsPage } from '../pages/admin/AdminReportsPage';
import { AdminCategoriesPage } from '../pages/admin/AdminCategoriesPage';
import { AdminPublishersPage } from '../pages/admin/AdminPublishersPage';
import { AdminAuthorsPage } from '../pages/admin/AdminAuthorsPage';
import { HomePage } from '../pages/HomePage';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="books" element={<BooksPage />} />
          <Route path="books/:id" element={<BookDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="addresses" element={<AddressesPage />} />

          <Route path="admin">
            <Route
              path="books"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminBooksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="categories"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminCategoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="publishers"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPublishersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="authors"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminAuthorsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminReportsPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

