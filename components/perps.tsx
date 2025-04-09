import { formatNumber } from "@/lib/utils";

interface PositionsPanelProps {
  perps: {
    symbol: string;
    amount: number;
    entryPrice: number;
    markPrice: number;
    PnL: number;
  }[];
}

export function Perps({ perps }: PositionsPanelProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6 text-white">Positions</h2>

      <div className="grid grid-cols-5 gap-4 mb-2 text-sm text-gray-400">
        <div>Market</div>
        <div>Size</div>
        <div>Entry Price</div>
        <div>Mark Price</div>
        <div>PnL</div>
      </div>

      {perps && perps.length > 0 ? (
        perps.map((position, index) => (
          <div
            key={index}
            className="py-3 border-t border-gray-800 grid grid-cols-5 gap-4 items-center text-white"
          >
            <div>{position.symbol}</div>
            <div
              className={
                position.amount > 0 ? "text-green-500" : "text-red-500"
              }
            >
              {position.amount > 0 ? "+" : ""}
              {formatNumber(position.amount)}
            </div>
            <div>
              ${formatNumber(parseFloat(position.entryPrice.toFixed(2)) * -1)}
            </div>
            <div>
              ${formatNumber(parseFloat(position.markPrice.toFixed(2)) * -1)}
            </div>
            <div
              className={position.PnL >= 0 ? "text-green-500" : "text-red-500"}
            >
              {position.PnL >= 0 ? "+" : "-"}$
              {formatNumber(parseFloat(position.PnL.toFixed(2)))}
            </div>
          </div>
        ))
      ) : (
        <div className="py-4 border-t border-gray-800 text-center text-gray-400">
          No open positions
        </div>
      )}
    </div>
  );
}
