export interface Merchant {
  merchantId?: string;
  merchantName: string;
  merchantPageUrl?: string;
  merchantUrlName?: string;
}

export interface MainImage {
  path: string;
  name: string;
}

export interface Deal {
  threadId: string;
  title: string;
  url: string;
  price?: number | null;
  nextBestPrice?: number | null;
  temperature: number;
  voucherCode?: string | null;
  description?: string | null;
  status?: string;
  isExpired?: boolean;
  commentCount?: number;
  shareCount?: number;
  publishedAt?: number;
  merchant?: Merchant | null;
  mainImage?: MainImage | null;
  user?: {
    username: string;
  } | null;
}

export interface SearchResultItem {
  id: string;
  title: string;
  price: string;
  temperature: string;
  merchant: string;
  url: string;
  isExpired: boolean;
}

export interface HotOptions {
  limit?: number;
  minTemp?: number;
  json?: boolean;
}

export interface NewOptions {
  limit?: number;
  json?: boolean;
}

export interface SearchOptions {
  page?: number;
  hideExpired?: boolean;
  json?: boolean;
}

export interface OpenOptions {
  clean?: boolean;
  print?: boolean;
}
