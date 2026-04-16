export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}
