import type { DiscountReward } from "@/types/api";

export type BookInfoCardBook = {
  cover: string;
  title: string;
  author?: string;
  writer?: {
    user_id: number;
    writer_name: string;
    img: string;
    isFollowing?: boolean;
  } | null;
  price?: number;
  remaining_paid_total?: number;
  remaining_paid_count?: number;
  total_remaining_count?: number;
  total_remaining_total?: number;
  chapters?: number;
  views?: number;
  reviews?: number;
  tag?: string;
  promotion?: {
    id: number;
    title: string;
    startDate: string;
    endDate: string;
    percent: number;
    price: number;
    rewards?: DiscountReward[];
  };
  fastTicket?: {
    can_buy: boolean;
    user_ticket_balance: number;
    ep_count: number;
    remaining_count: number;
    remaining_total: number;
    web_enabled: boolean;
    book_enabled: boolean;
  };
  use_freecoin?: number;
  end?: string;
  status?: string;
  ep_purchase_reward?: {
    has_promotion: boolean;
    campaign?: {
      campaign_id: number;
      buy_count: number;
      reward_count: number;
      badge_label: string;
      display_title: string;
      display_description: string;
      icon_url: string | null;
      detail_text: string;
      start_date: string;
      end_date: string | null;
    } | null;
  } | null;
};

export interface BookInfoCardProps {
  book: BookInfoCardBook;
  bookId?: string | number | null;
}

export type PaymentMethod = "coin" | "freecoin";
export type FastPaymentMethod = "coin" | "fast_ticket";
