import { useDriftStore } from "@/lib/store";
import { formatNumber } from "@/lib/utils";
import { MainnetSpotMarkets, SpotMarketConfig } from "@drift-labs/sdk-browser";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "./ui/input";

interface TokenBalancesProps {
  tokens: { symbol: string; balance: number; value: number }[];
  totalValue: number;
}

export function TokenBalances({ tokens, totalValue }: TokenBalancesProps) {
  const getTokenUsdValue = (balance: number, value: number) => {
    return balance * value;
  };

  const { client, selectedSubaccountIndex } = useDriftStore();
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState(0);
  const [amount, setAmount] = useState("");

  const handleDeposit = async (marketIndex: number, amount: number) => {
    const amount_value = client?.convertToSpotPrecision(marketIndex, amount);
    const associatedTokenAccount = await client?.getAssociatedTokenAccount(
      marketIndex
    )!;

    await client?.deposit(
      amount_value,
      marketIndex,
      associatedTokenAccount,
      selectedSubaccountIndex
    );
  };

  const handleWithdraw = async (marketIndex: number, amount: number) => {
    const amount_value = client?.convertToSpotPrecision(marketIndex, amount);
    const associatedTokenAccount = await client?.getAssociatedTokenAccount(
      marketIndex
    )!;

    await client?.withdraw(amount_value, marketIndex, associatedTokenAccount);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Balances</h2>
        <div className="flex space-x-2">
          <Button
            className="flex items-center bg-gray-800 rounded-lg px-4 py-2 text-white cursor-pointer"
            onClick={() => setIsDepositOpen(true)}
          >
            <span className="mr-2">+</span> Deposit
          </Button>
          <Button
            onClick={() => setIsWithdrawOpen(true)}
            variant="secondary"
            className="flex items-center bg-gray-800 rounded-lg px-4 py-2 text-white cursor-pointer"
          >
            <span className="mr-2">−</span> Withdraw
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2 text-sm text-gray-400">
        <div>Asset</div>
        <div className="text-right">Balance</div>
      </div>

      {tokens.map((token) => (
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
              ${formatNumber(getTokenUsdValue(token.balance, token.value))}
            </div>
          </div>
        </div>
      ))}

      <div className="py-4 border-t border-gray-800 flex justify-between items-center">
        <div className="font-bold">Total Value</div>
        <div className="font-bold">${formatNumber(totalValue)}</div>
      </div>

      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent className="bg-gray-900 border border-gray-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Deposit Funds
            </DialogTitle>
            <p className="text-gray-400 mt-2">
              Add funds to your Drift subaccount.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-lg text-white">
                Select Token
              </label>
              <Select
                value={selectedToken?.toString()}
                onValueChange={(val) => setSelectedToken(parseInt(val))}
              >
                <SelectTrigger className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-3 px-4">
                  <SelectValue placeholder="Select a token" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border border-gray-700 rounded-lg">
                  {MainnetSpotMarkets.map((token) => (
                    <SelectItem
                      key={token.marketIndex}
                      value={token.marketIndex.toString()}
                      className="hover:bg-gray-700 focus:bg-gray-700"
                    >
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-2 text-lg">Amount</label>{" "}
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-3 px-4"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDepositOpen(false)}
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              disabled={selectedToken === null || !amount}
              onClick={() => handleDeposit(selectedToken, parseFloat(amount))}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg cursor-pointer"
            >
              Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent className="bg-gray-900 border border-gray-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Withdraw Funds
            </DialogTitle>
            <p className="text-gray-400 mt-2">
              Withdraw funds from your Drift subaccount.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-lg text-white">
                Select Token
              </label>
              <Select
                value={selectedToken.toString()}
                onValueChange={(val) => setSelectedToken(parseInt(val))}
              >
                <SelectTrigger className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-3 px-4">
                  <SelectValue placeholder="Select a token" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border border-gray-700 rounded-lg">
                  {MainnetSpotMarkets.map((token) => (
                    <SelectItem
                      key={token.marketIndex}
                      value={token.marketIndex.toString()}
                      className="hover:bg-gray-700 focus:bg-gray-700"
                    >
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-2 text-lg">Amount</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-3 px-4"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsWithdrawOpen(false)}
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              disabled={selectedToken === null || !amount}
              onClick={() => handleWithdraw(selectedToken!, parseFloat(amount))}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg cursor-pointer"
            >
              Withdraw
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
