export interface Trade {
  symbol: string;
  trade_type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  order_value: number;
  exchange: string;
}

export interface Charges {
  brokerage: number;
  stt: number;
  gst: number;
  stamp_duty: number;
  exchange_charges: number;
  sebi_charges: number;
  total_charges: number;
}

export interface ContractNoteSummary {
  gross_pnl: number;
  net_pnl: number;
}

export interface ExtractedData {
  trades: Trade[];
  charges: Charges;
  summary: ContractNoteSummary;
}

export enum Page {
  DASHBOARD = 'DASHBOARD',
  UPLOAD = 'UPLOAD',
  ANALYTICS = 'ANALYTICS',
  JOURNAL = 'JOURNAL',
  SETTINGS = 'SETTINGS'
}

export interface HeatmapDay {
  date: string;
  pnl: number;
  trades: number;
}