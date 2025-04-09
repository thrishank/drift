"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useMemo } from "react";
import { Transaction } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import { DriftClient, MarketType } from "@drift-labs/sdk-browser";
import { Navbar } from "@/components/navabar";
import { useWalletAdapter } from "@/lib/walletadapter";

export default function page() {
  const { wallet, connected, publicKey, signTransaction, signAllTransactions } =
    useWallet();

  const walletAdapter = useWalletAdapter(
    publicKey,
    signTransaction,
    signAllTransactions
  );

  const connection = new Connection(
    `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_API_KEY}`
  );

  useEffect(() => {
    async function tst() {
      const driftClient = new DriftClient({
        connection,
        wallet: walletAdapter!,
        env: "mainnet-beta",
      });

      await driftClient.subscribe();

      const user = driftClient.getUser();
      const open_orders = user.getOpenOrders();
      open_orders.map((order) => {
        if (order.marketType && "perp" in order.marketType) {
          console.log("perp", order);
        }
      });
    }
    if (connected) {
      tst();
    }
  }, [connected, publicKey]);
  return (
    <div>
      <Navbar />
    </div>
  );
}
