export interface Product {
  id?: string;
  name: string;
  category: string;
  priceM?: number;
  priceL: number;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface CartItem extends Product {
  cartItemId: string; // unique ID for the cart item (since same product can be added multiple times with different options)
  size: 'M' | 'L';
  ice: string;
  sugar: string;
  quantity: number;
  price: number;
}

export interface Order {
  id?: string;
  customerName: string;
  customerPhone?: string;
  tableNumber?: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  createdAt: number;
  updatedAt?: number;
}
