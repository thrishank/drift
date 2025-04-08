"use client";
import { format, formatNumber, pyth, WalletAdapterWrapper } from "@/lib/utils";
import {
  BN,
  DriftClient,
  MainnetSpotMarkets,
  Order,
  PRICE_PRECISION,
} from "@drift-labs/sdk-browser";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Dashboard() {
  const { wallet, connected, publicKey, signTransaction, signAllTransactions } =
    useWallet();

  const [isLoading, setIsLoading] = useState(false);
  const [client, setClient] = useState<DriftClient>();
  const [status, setStatus] = useState(false);

  const [subaccounts, setSubaccounts] = useState<
    {
      name: string;
      index: number;
      orders: Order[];
      total_value: number;
      tokens: { symbol: string; balance: number; value: number }[];
    }[]
  >([]);

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSubaccount, setSelectedSubaccount] = useState(0);
  const [isSubaccountDropdownOpen, setIsSubaccountDropdownOpen] =
    useState(false);

  const walletAdapter = useMemo(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;

    const signAdapter = async (tx: Transaction): Promise<Transaction> => {
      return await signTransaction(tx);
    };

    const signAllAdapter = async (
      txs: Transaction[]
    ): Promise<Transaction[]> => {
      return await signAllTransactions(txs);
    };

    return new WalletAdapterWrapper(publicKey, signAdapter, signAllAdapter);
  }, [publicKey, signTransaction, signAllTransactions]);

  useEffect(() => {
    const connection = new Connection(
      `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_API_KEY}`
    );

    if (connected && walletAdapter && publicKey) {
      const driftClient = new DriftClient({
        connection,
        env: "mainnet-beta",
        wallet: walletAdapter,
      });

      setClient(driftClient);
      setStatus(true);
    }
  }, [connected, publicKey]);

  useEffect(() => {
    async function getSubAccounts() {
      await client?.subscribe();

      const sub_accounts = await client?.getUserAccountsForAuthority(
        publicKey!
      );
      console.log("Subaccounts", sub_accounts);

      const accountPromises = sub_accounts!.map(async (account) => {
        const buffer = Buffer.from(account.name);
        const user_account = client?.getUser(account.subAccountId);
        const account_balance = format(
          user_account?.getNetUsdValue(),
          PRICE_PRECISION
        );
        const open_orders = user_account?.getOpenOrders()!;
        // perp open orders is marketType is perp

        const tokenPromises = MainnetSpotMarkets.map(async (token) => {
          const balance = user_account?.getTokenAmount(token.marketIndex);
          const format_balance = format(balance, token.precision);

          if (balance.gte(new BN(0)) && format_balance > 0) {
            console.log(format_balance);
            return {
              symbol: token.symbol,
              balance: format_balance,
              value: await pyth(token.pythFeedId!),
            };
          }
        });

        // Resolve all token promises and filter out undefined values
        const tokenAmounts = (await Promise.all(tokenPromises)).filter(
          (item): item is { symbol: string; balance: number; value: number } =>
            item !== undefined
        );
        console.log("Token amounts", tokenAmounts);

        return {
          name: buffer.toString("utf8").trim(),
          index: account.subAccountId,
          orders: open_orders,
          total_value: account_balance,
          tokens: tokenAmounts,
        };
      });
      const arr = await Promise.all(accountPromises);
      setSubaccounts(arr);
      console.log("Subaccounts", arr);
    }
    if (status) {
      getSubAccounts();
    }
  }, [status]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="mb-6">
            Connect your Solana wallet to view your Drift subaccounts, balances,
            and positions.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no subaccounts are loaded yet, show loading
  if (subaccounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentSubaccount = subaccounts[selectedSubaccount];
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  const getTokenUsdValue = (balance: number, value: number) => {
    return balance * value;
  };

  const handleSubaccountChange = (index: number) => {
    setSelectedSubaccount(index);
    setIsSubaccountDropdownOpen(false);
  };

  return (
    <div className="bg-gray-950 min-h-screen text-white p-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Subaccounts</h1>
          <p className="text-gray-400">
            Manage your Drift subaccounts, balances, and positions
          </p>
        </div>
        <div className="relative">
          <button
            className="flex items-center bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white"
            onClick={() =>
              setIsSubaccountDropdownOpen(!isSubaccountDropdownOpen)
            }
          >
            <span className="mr-2">{currentSubaccount.name}</span>
            <ChevronDown size={16} />
          </button>

          {isSubaccountDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-lg shadow-lg z-10">
              {subaccounts.map((account, index) => (
                <button
                  key={account.index}
                  className="w-full text-left px-4 py-2 hover:bg-gray-800 text-white"
                  onClick={() => handleSubaccountChange(index)}
                >
                  {account.name}
                </button>
              ))}
            </div>
          )}
          {/* <button className="flex items-center bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white"> */}
          {/*   <span className="mr-2"> */}
          {/*     {currentSubaccount.name || */}
          {/*       `Subaccount ${currentSubaccount.index}`} */}
          {/*   </span> */}
          {/*   <ChevronDown size={16} /> */}
          {/* </button> */}
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="bg-gray-900 rounded-lg p-1">
          <TabsTrigger
            value="overview"
            className="rounded-md px-6 py-3 data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400 hover:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="positions"
            className="rounded-md px-6 py-3 data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400 hover:text-white"
          >
            Positions
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="rounded-md px-6 py-3 data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400 hover:text-white"
          >
            Orders
          </TabsTrigger>
          <TabsTrigger
            value="trade"
            className="rounded-md px-6 py-3 data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400 hover:text-white"
          >
            Trade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Balances Section */}
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Balances</h2>
                <div className="flex space-x-2">
                  <button className="flex items-center bg-gray-800 rounded-lg px-4 py-2 text-white">
                    <span className="mr-2">+</span> Deposit
                  </button>
                  <button className="flex items-center bg-gray-800 rounded-lg px-4 py-2 text-white">
                    <span className="mr-2">−</span> Withdraw
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2 text-sm text-gray-400">
                <div>Asset</div>
                <div className="text-right">Balance</div>
              </div>

              {/* Token Balances */}
              {currentSubaccount.tokens.map((token) => (
                <div
                  key={token.symbol}
                  className="py-4 border-t border-gray-800 flex justify-between items-center"
                >
                  <div className="flex items-center">
                    <div className="bg-gray-800 rounded-full h-8 w-8 flex items-center justify-center mr-3">
                      {token.symbol.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{token.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{token.balance}</div>
                    <div className="text-sm text-gray-400">
                      $
                      {formatNumber(
                        getTokenUsdValue(token.balance, token.value)
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Total Value */}
              <div className="py-4 border-t border-gray-800 flex justify-between items-center">
                <div className="font-bold">Total Value</div>
                <div className="font-bold">
                  ${formatNumber(currentSubaccount.total_value)}
                </div>
              </div>
            </div>

            {/* Positions Section */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-6">Positions</h2>

              <div className="grid grid-cols-4 gap-2 mb-2 text-sm text-gray-400">
                <div>Market</div>
                <div>Size</div>
                <div>Mark Price</div>
                <div>PnL</div>
              </div>

              {/* We would need to fetch positions data from the Drift client */}
              <div className="py-4 border-t border-gray-800 text-center text-gray-400">
                {client ? "Loading positions..." : "No positions found"}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="positions">
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Positions</h2>

            <div className="grid grid-cols-4 gap-2 mb-2 text-sm text-gray-400">
              <div>Market</div>
              <div>Size</div>
              <div>Mark Price</div>
              <div>PnL</div>
            </div>

            <div className="py-4 border-t border-gray-800 text-center text-gray-400">
              {client ? "Loading positions..." : "No positions found"}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          {/* Open Orders Section */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Open Orders</h2>

            <div className="grid grid-cols-7 gap-2 mb-2 text-sm text-gray-400">
              <div>Market</div>
              <div>Side</div>
              <div>Type</div>
              <div>Size</div>
              <div>Price</div>
              <div>Time</div>
              <div>Actions</div>
            </div>

            {currentSubaccount.orders && currentSubaccount.orders.length > 0 ? (
              currentSubaccount.orders.map((order, index) => (
                <div
                  key={index}
                  className="py-4 border-t border-gray-800 grid grid-cols-7 gap-2 items-center"
                >
                  <div>
                    {order.marketIndex}-{order.marketType ? "PERP" : "SPOT"}
                  </div>
                  <div
                    className={
                      order.direction === "long"
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {order.direction === "long" ? "BUY" : "SELL"}
                  </div>
                  <div>{order.baseAssetAmount.toString()}</div>
                  <div>${order.price.toString()}</div>
                  <div className="flex flex-col">
                    <span>
                      {new Date(order.slot * 1000).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <button className="text-gray-400 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 border-t border-gray-800 text-center text-gray-400">
                No open orders
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
