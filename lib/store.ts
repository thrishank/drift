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
  tokens: {
    symbol: string;
    balance: number;
    value: number;
    marketIndex: number;
  }[];
  perps: {
    symbol: string;
    amount: number;
    entryPrice: number;
    markPrice: number;
    PnL: number;
  }[];
}

// Add cache interface for Pyth prices
interface PythPriceCache {
  [feedId: string]: {
    price: number;
    lastUpdated: number;
  };
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

  priceCache: PythPriceCache;
  setPriceCache: (cache: PythPriceCache) => void;
  getCachedPythPrice: (feedId: string) => Promise<number>;
  updatePythPrices: () => Promise<void>;

  initializeClient: (wallet: any, publicKey: PublicKey) => Promise<void>;
  fetchSubaccounts: (publicKey: PublicKey, loading: boolean) => Promise<void>;
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
  priceCache: {},
  setPriceCache: (cache) => set({ priceCache: cache }),

  // Get price from cache or fetch if needed
  getCachedPythPrice: async (feedId: string) => {
    const { priceCache } = get();
    const now = Date.now();
    const cacheEntry = priceCache[feedId];

    // If we have a cache entry that's less than 10 seconds old, use it
    if (cacheEntry && now - cacheEntry.lastUpdated < 10000) {
      return cacheEntry.price;
    }

    try {
      const price = await pyth(feedId);
      get().setPriceCache({
        ...get().priceCache,
        [feedId]: {
          price,
          lastUpdated: now,
        },
      });
      return price;
    } catch (error) {
      console.error(`Error fetching price for feed ${feedId}:`, error);
      // Return cached price if available, even if outdated
      return cacheEntry ? cacheEntry.price : 0;
    }
  },

  updatePythPrices: async () => {
    try {
      const now = Date.now();
      const newCache: PythPriceCache = { ...get().priceCache };

      // Update spot market prices
      for (const token of MainnetSpotMarkets) {
        if (token.pythFeedId) {
          try {
            const price = await pyth(token.pythFeedId);
            newCache[token.pythFeedId] = {
              price,
              lastUpdated: now,
            };
          } catch (error) {
            console.error(`Failed to update price for ${token.symbol}:`, error);
          }
        }
      }

      // Update perp market prices
      for (const token of MainnetPerpMarkets) {
        if (token.pythFeedId) {
          try {
            const price = await pyth(token.pythFeedId);
            newCache[token.pythFeedId] = {
              price,
              lastUpdated: now,
            };
          } catch (error) {
            console.error(`Failed to update price for ${token.symbol}:`, error);
          }
        }
      }

      set({ priceCache: newCache });
    } catch (error) {
      console.error("Error updating Pyth prices:", error);
    }
  },

  initializeClient: async (wallet, publicKey) => {
    set({ isLoading: true });

    const connection = new Connection(
      `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_API_KEY}`
    );

    const driftClient = new DriftClient({
      connection,
      env: "mainnet-beta",
      wallet,
      accountSubscription: {
        type: "websocket",
      },
    });

    set({ client: driftClient });

    // Initialize price cache
    await get().updatePythPrices();

    await get().fetchSubaccounts(publicKey, true);
    set({ isLoading: false });

    // Set up polling for price updates (every 10 seconds)
    setInterval(() => {
      get().updatePythPrices();
    }, 10000);

    // Set up polling for subaccount updates
    setInterval(() => {
      get().fetchSubaccounts(publicKey, false);
    }, 30000); // Every minute
  },

  fetchSubaccounts: async (publicKey, loading: boolean) => {
    const { client } = get();
    if (!client) return;

    set({ isLoading: loading });

    try {
      await client.subscribe();
      const sub_accounts = await client.getUserAccountsForAuthority(publicKey);

      if (sub_accounts.length === 0) return;

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
              value: await get().getCachedPythPrice(token.pythFeedId!),
              marketIndex: token.marketIndex,
            };
          }
        });

        const tokenAmounts = (await Promise.all(tokenPromises)).filter(
          (
            item
          ): item is {
            symbol: string;
            balance: number;
            value: number;
            marketIndex: number;
          } => item !== undefined
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

          const marketPrice =
            (await get().getCachedPythPrice(token.pythFeedId!)) * -1;

          const entryPrice =
            entryBaseAmount !== 0 ? entryQuoteAmount / entryBaseAmount : 0;
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
