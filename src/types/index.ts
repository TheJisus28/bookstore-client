export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'customer';
  phone?: string;
  created_at: Date;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  pages?: number;
  publication_date?: Date;
  language: string;
  publisher_id?: string;
  category_id?: string;
  cover_image_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Author {
  id: string;
  first_name: string;
  last_name: string;
  bio?: string;
  birth_date?: Date;
  nationality?: string;
  created_at: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at: Date;
}

export interface Publisher {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  created_at: Date;
}

export interface CartItem {
  id: string;
  user_id: string;
  book_id: string;
  quantity: number;
  title: string;
  price: number;
  cover_image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: string;
  user_id: string;
  address_id: string;
  status: string;
  total_amount: number;
  shipping_cost: number;
  discount_amount: number;
  created_at: Date;
  updated_at: Date;
  shipped_at?: Date;
  delivered_at?: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  book_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: Date;
}

export interface Review {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  comment?: string;
  first_name?: string;
  last_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Address {
  id: string;
  user_id: string;
  street: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

