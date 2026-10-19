// Mirrors the API's serialized shapes. The UI never derives score or order from these.
export interface QueueItem {
  menu_item_id: number;
  name: string;
  category: string;
  prep_time_minutes: number;
  quantity: number;
}

export interface QueueOrder {
  id: number;
  customer_name: string;
  type: string;
  is_vip: boolean;
  status: string;
  placed_at: string;
  promised_at: string | null;
  items: QueueItem[];
  items_summary: string;
  available_actions: string[];
  score: number;
  score_breakdown: Record<string, number>;
  minutes_waiting: number;
  total_prep_minutes: number;
}

export interface QueueResponse {
  generated_at: string;
  orders: QueueOrder[];
}

export type QueueFilter = 'all' | 'received' | 'preparing';
