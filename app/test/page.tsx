"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useMemo } from "react";
import { Transaction } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import {
  BASE_PRECISION,
  BN,
  convertToNumber,
  DriftClient,
  MarketType,
  PRICE_PRECISION,
} from "@drift-labs/sdk-browser";
import { Navbar } from "@/components/navabar";
import { useWalletAdapter } from "@/lib/walletadapter";
import { format } from "@/lib/utils";

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
      const perps = user.getPerpPosition(0)!;

      const entryPrice =
        convertToNumber(perps.quoteEntryAmount, new BN(1000000)) /
        convertToNumber(perps.baseAssetAmount, BASE_PRECISION);

      console.log("entry price", entryPrice);

      const markPrice =
        convertToNumber(perps.quoteAssetAmount, new BN(1000000)) /
        convertToNumber(perps.baseAssetAmount, BASE_PRECISION);

      console.log("mark price", markPrice);
      const PnL =
        (markPrice - entryPrice) *
        convertToNumber(perps.baseAssetAmount, BASE_PRECISION);
      console.log("pnl", PnL);
      console.log(
        "amount",
        convertToNumber(perps.baseAssetAmount, BASE_PRECISION)
      );

      // amount and type of PERP
      // const amount = perps?.baseAssetAmount;
      // const isLong = amount.gte(new BN(0));
      // console.log(isLong);
      // console.log(format(amount, BASE_PRECISION));
      //
      // const open_orders = user.getOpenOrders();
      // open_orders.map((order) => {
      //   if (order.marketType && "perp" in order.marketType) {
      //     const id = order.orderId;
      //     console.log(id);
      //   }
      // });
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
