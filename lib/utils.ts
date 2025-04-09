import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { Transaction, PublicKey } from "@solana/web3.js";
import { convertToNumber, IWallet } from "@drift-labs/sdk-browser";

import { HermesClient } from "@pythnetwork/hermes-client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function format(num: number, percision: number) {
  return convertToNumber(num, percision);
}

export async function pyth(id: string) {
  if (id === undefined) {
    return 0;
  }
  const connection = new HermesClient("https://hermes.pyth.network", {}); // See Hermes endpoints section below for other endpoints

  const priceIds = [id];
  const priceUpdates = await connection.getLatestPriceUpdates(priceIds);
  const price = priceUpdates.parsed![0].price;
  return parseInt(price.price) / 10 ** (price.expo * -1);
}

export function formatNumber(num: number): string {
  if (Math.abs(num) >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2).replace(/\.00$/, "") + "B";
  } else if (Math.abs(num) >= 1_000_000) {
    return (num / 1_000_000).toFixed(2).replace(/\.00$/, "") + "M";
  } else if (Math.abs(num) >= 1_000) {
    return (num / 1_000).toFixed(2).replace(/\.00$/, "") + "K";
  } else {
    return num.toString();
  }
}
