import { create } from "zustand";
import {
  BASE_PRECISION,
  BN,
  convertToNumber,
  DriftClient,
  MainnetPerpMarkets,
  MainnetSpotMarkets,
  Order,
  PRICE_PRECISION,
} from "@drift-labs/sdk-browser";
import { Connection, PublicKey } from "@solana/web3.js";
import { format, pyth } from "@/lib/utils";

interface SubaccountData {
  name: string;
  index: number;
  orders: Order[];
  total_value: number;
  tokens: { symbol: string; balance: number; value: number }[];
  perps: {
    symbol: string;
    amount: number;
    entryPrice: number;
    markPrice: number;
    PnL: number;
  }[];
}

interface DriftState {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  client: DriftClient | null;
  setClient: (client: DriftClient | null) => void;
  subaccounts: SubaccountData[];
  setSubaccounts: (subaccounts: SubaccountData[]) => void;
  selectedSubaccountIndex: number;
  setSelectedSubaccountIndex: (index: number) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  initializeClient: (wallet: any, publicKey: PublicKey) => Promise<void>;
  fetchSubaccounts: (publicKey: PublicKey) => Promise<void>;
}

export const useDriftStore = create<DriftState>((set, get) => ({
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  client: null,
  setClient: (client) => set({ client }),
  subaccounts: [],
  setSubaccounts: (subaccounts) => set({ subaccounts }),
  selectedSubaccountIndex: 0,
  setSelectedSubaccountIndex: (index) =>
    set({ selectedSubaccountIndex: index }),
  activeTab: "overview",
  setActiveTab: (tab) => set({ activeTab: tab }),

  initializeClient: async (wallet, publicKey) => {
    set({ isLoading: true });

    const connection = new Connection(
      `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_API_KEY}`
    );

    const driftClient = new DriftClient({
      connection,
      env: "mainnet-beta",
      wallet,
    });

    set({ client: driftClient });
    await get().fetchSubaccounts(publicKey);
    set({ isLoading: false });
  },

  fetchSubaccounts: async (publicKey) => {
    const { client } = get();
    if (!client) return;

    set({ isLoading: true });

    try {
      await client.subscribe();
      const sub_accounts = await client.getUserAccountsForAuthority(publicKey);

      const accountPromises = sub_accounts.map(async (account) => {
        const user_account = client.getUser(account.subAccountId);
        const account_balance = format(
          user_account?.getNetUsdValue(),
          PRICE_PRECISION
        );
        const open_orders = user_account?.getOpenOrders() || [];

        const tokenPromises = MainnetSpotMarkets.map(async (token) => {
          const balance = user_account?.getTokenAmount(token.marketIndex);
          const format_balance = format(balance, token.precision);

          if (balance && balance.gte(new BN(0)) && format_balance > 0) {
            return {
              symbol: token.symbol,
              balance: format_balance,
              value: await pyth(token.pythFeedId!),
            };
          }
        });

        const tokenAmounts = (await Promise.all(tokenPromises)).filter(
          (item): item is { symbol: string; balance: number; value: number } =>
            item !== undefined
        );

        const perpsPromises = MainnetPerpMarkets.map(async (token) => {
          const userAccount = client.getUser(account.subAccountId);
          const perpPosition = userAccount.getPerpPosition(token.marketIndex);

          if (!perpPosition) {
            return null; // Return null instead of an empty object
          }

          const isLong = perpPosition.baseAssetAmount.gte(new BN(0));

          const entryBaseAmount = convertToNumber(
            perpPosition.baseAssetAmount,
            BASE_PRECISION
          );
          const entryQuoteAmount = convertToNumber(
            perpPosition.quoteEntryAmount,
            new BN(1000000)
          );
          const markQuoteAmount = convertToNumber(
            perpPosition.quoteAssetAmount,
            new BN(1000000)
          );

          const marketPrice = (await pyth(token.pythFeedId!)) * -1;

          const entryPrice =
            entryBaseAmount !== 0 ? entryQuoteAmount / entryBaseAmount : 0;
          // const PnL = (markPrice - entryPrice) * entryBaseAmount * -1;
          const PnL = isLong
            ? (marketPrice - entryPrice) * entryBaseAmount * -1
            : (entryPrice - marketPrice) * entryBaseAmount;
          return {
            symbol: token.symbol,
            amount: entryBaseAmount,
            entryPrice,
            markPrice: marketPrice,
            PnL,
          };
        });

        const perps = await Promise.all(perpsPromises).then((results) =>
          results.filter((item) => item !== null)
        );

        return {
          name: Buffer.from(account.name).toString("utf8").trim(),
          index: account.subAccountId,
          orders: open_orders,
          total_value: account_balance,
          tokens: tokenAmounts,
          perps,
        };
      });

      const subaccountsData = await Promise.all(accountPromises);
      set({ subaccounts: subaccountsData });
    } catch (error) {
      console.error("Error fetching subaccounts:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
