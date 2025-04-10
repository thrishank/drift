"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWalletAdapter } from "@/lib/walletadapter";
import { useDriftStore } from "@/lib/store";
import { SubaccountSelector } from "./subaccountSelector";
import { TokenBalances } from "./tokenBalance";
import { Perps } from "./perps";
import { OrdersPanel } from "./orders";

export function Dashboard() {
  const { connected, publicKey, signTransaction, signAllTransactions } =
    useWallet();

  const {
    isLoading,
    subaccounts,
    selectedSubaccountIndex,
    activeTab,
    setActiveTab,
    initializeClient,
  } = useDriftStore();

  const currentSubaccount = subaccounts[selectedSubaccountIndex];

  // useEffect(() => {
  //   console.log("sub account state changed so re render");
  // }, [currentSubaccount]);

  const walletAdapter = useMemo(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;

    return useWalletAdapter(publicKey, signTransaction, signAllTransactions);
  }, [publicKey, signTransaction, signAllTransactions]);

  // on disconnecting clear the data also on change wallet
  useEffect(() => {
    if (connected && publicKey && walletAdapter) {
      initializeClient(walletAdapter, publicKey);
    }
  }, [connected, publicKey, walletAdapter]);

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

  if (!isLoading && subaccounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center font-bold">No Subaccounts Found</div>
      </div>
    );
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
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
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="bg-gray-900 rounded-lg p-1">
          <TabsTrigger
            value="overview"
            className="rounded-md px-6 py-3 data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400 hover:text-white cursor-pointer"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="positions"
            className="rounded-md px-6 py-3 data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400 hover:text-white cursor-pointer"
          >
            Positions
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="rounded-md px-6 py-3 data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400 hover:text-white cursor-pointer"
          >
            Orders
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TokenBalances
              tokens={currentSubaccount.tokens}
              totalValue={currentSubaccount.total_value}
            />
            <Perps perps={currentSubaccount.perps} />
          </div>
        </TabsContent>{" "}
        <TabsContent value="positions">
          <Perps perps={currentSubaccount.perps} detailed={true} />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersPanel orders={currentSubaccount.orders} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
