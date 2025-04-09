import { formatNumber } from "@/lib/utils";

interface PositionsPanelProps {
  perps: {
    symbol: string;
    amount: number;
    entryPrice: number;
    markPrice: number;
    PnL: number;
  }[];
  detailed?: boolean;
}

export function Perps({ perps, detailed }: PositionsPanelProps) {
  const grid_col = detailed ? "grid-cols-6" : "grid-cols-5";
  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6 text-white">Positions</h2>

      <div className={`grid ${grid_col} gap-4 mb-2 text-sm text-gray-400`}>
        <div>Market</div>
        <div>Size</div>
        <div>Type</div>
        <div>Entry Price</div>
        {detailed ? <div>Mark Price</div> : null}
        <div>PnL</div>
      </div>

      {perps && perps.length > 0 ? (
        perps.map((position, index) => (
          <div
            key={index}
            className={`py-3 border-t border-gray-800 grid ${grid_col} gap-4 items-center text-white`}
          >
            <div>{position.symbol}</div>
            <div className="font-bold">{formatNumber(position.amount)}</div>
            <div
              className={
                position.amount > 0 ? "text-green-500" : "text-red-500"
              }
            >
              {position.amount > 0 ? "LONG" : "SHORT"}
            </div>
            <div>
              ${formatNumber(parseFloat(position.entryPrice.toFixed(2)) * -1)}
            </div>

            {detailed ? (
              <div>
                ${formatNumber(parseFloat(position.markPrice.toFixed(2)) * -1)}
              </div>
            ) : null}
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
