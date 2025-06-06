export interface BinanceAccount {
  name: string;
  apiKey: string;
  secretKey: string;
  testnet: boolean;
}

export interface BinanceTrade {
  id: string;
  orderId: string;
  symbol: string;
  time: string;
  price: string;
  qty: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  isBuyer: boolean;
  isMaker: boolean;
  account_name?: string;
}

export interface FormattedTrade {
  index: number;
  id: string;
  account: string;
  time: string;
  direction: string;
  price: number;
  qty: number;
  amount: number;
  commission: number;
  commission_asset: string;
  raw_data: BinanceTrade;
}

export interface TradeStats {
  avg_price: number;
  total_qty: number;
  total_amount: number;
  commission_by_asset: { [key: string]: number };
}

export interface ProfitStats {
  price_diff: number;
  total_profit: number;
  profit_percentage: number;
  min_qty: number;
}

export interface TradeAnalysis {
  total_count: number;
  buy_count: number;
  sell_count: number;
  accounts: string[];
  buy_stats?: TradeStats;
  sell_stats?: TradeStats;
  profit_stats?: ProfitStats;
  total_commission_by_asset: { [key: string]: number };
}

export interface QueryParams {
  symbol: string;
  start_date: string;
  end_date: string;
}

export interface AccountStats {
  [accountName: string]: {
    count: number;
    success: boolean;
    error?: string;
  };
} 