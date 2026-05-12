export interface Order {
  id: string;
  traderId: string;
  symbol: string;
  side: string;
  type: string;
  quantity: number;
  price: number;
  filledQuantity: number;
  filledPrice: number;
  status: string;
  createdAt: number;
  updatedAt: number;
}
