// WalletAdapter.ts - Separate wallet adapter utility
import { IWallet } from "@drift-labs/sdk-browser";
import { PublicKey, Transaction } from "@solana/web3.js";

// Create an adapter class that implements IWallet interface for Drift SDK
export class WalletAdapterWrapper implements IWallet {
  constructor(
    public publicKey: PublicKey,
    private _signTransaction: (
      transaction: Transaction
    ) => Promise<Transaction>,
    private _signAllTransactions: (
      transactions: Transaction[]
    ) => Promise<Transaction[]>
  ) {}

  async signTransaction(tx: Transaction): Promise<Transaction> {
    return await this._signTransaction(tx);
  }

  async signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
    return await this._signAllTransactions(txs);
  }
}

export function useWalletAdapter(
  publicKey: PublicKey | null,
  signTransaction: ((tx: Transaction) => Promise<Transaction>) | undefined,
  signAllTransactions:
    | ((txs: Transaction[]) => Promise<Transaction[]>)
    | undefined
) {
  if (!publicKey || !signTransaction || !signAllTransactions) return null;

  const signAdapter = async (tx: Transaction): Promise<Transaction> => {
    return await signTransaction(tx);
  };

  const signAllAdapter = async (txs: Transaction[]): Promise<Transaction[]> => {
    return await signAllTransactions(txs);
  };

  return new WalletAdapterWrapper(publicKey, signAdapter, signAllAdapter);
}
