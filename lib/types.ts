import { Order } from "@drift-labs/sdk-browser";

export interface Perp {
  symbol: string;
  amount: number;
  entryPrice: number;
  markPrice: number;
  PnL: number;
}

export interface Token {
  symbol: string;
  balance: number;
  value: number;
  marketIndex: number;
}

export interface SubaccountData {
  name: string;
  index: number;
  orders: Order[];
  total_value: number;
  tokens: Token[];
  perps: Perp[];
}
