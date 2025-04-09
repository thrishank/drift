"use client";
import { format, formatNumber, pyth } from "@/lib/utils";
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
import { useWalletAdapter } from "@/lib/walletadapter";
import { useDriftStore } from "@/lib/store";
import { SubaccountSelector } from "./subaccountSelector";
import { TokenBalances } from "./tokenBalance";

export function Dashboard() {
  const { wallet, connected, publicKey, signTransaction, signAllTransactions } =
    useWallet();

  const {
    isLoading,
    client,
    subaccounts,
    selectedSubaccountIndex,
    activeTab,
    setActiveTab,
    initializeClient,
  } = useDriftStore();

  const [status, setStatus] = useState(false);

  const [selectedSubaccount, setSelectedSubaccount] = useState(0);
  const [isSubaccountDropdownOpen, setIsSubaccountDropdownOpen] =
    useState(false);

  const walletAdapter = useMemo(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;

    return useWalletAdapter(publicKey, signTransaction, signAllTransactions);
  }, [publicKey, signTransaction, signAllTransactions]);

  useEffect(() => {
    if (connected && publicKey && walletAdapter) {
      initializeClient(walletAdapter, publicKey);
    }
  }, [connected, publicKey]);

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

  if (isLoading || subaccounts.length === 0) {
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
        <SubaccountSelector />
      </div>{" "}
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
            <TokenBalances
              tokens={currentSubaccount.tokens}
              totalValue={currentSubaccount.total_value}
            />
            {/* <PositionsPanel hasClient={!!client} /> */}
          </div>
        </TabsContent>{" "}
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
