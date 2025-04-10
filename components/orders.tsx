import { format } from "@/lib/utils";
import {
  Order,
  BN,
  BASE_PRECISION,
  MainnetPerpMarkets,
  MainnetSpotMarkets,
  PRICE_PRECISION,
} from "@drift-labs/sdk-browser";

interface OrdersPanelProps {
  orders: Order[];
}

export function OrdersPanel({ orders }: OrdersPanelProps) {
  // Function to check if an object has a specific property
  const hasProperty = (obj: any, prop: string): boolean => {
    return obj && Object.prototype.hasOwnProperty.call(obj, prop);
  };

  // Function to format BN to string with appropriate decimals
  const formatBN = (bn: BN): string => {
    return bn.toString();
  };

  const token = (order: Order) => {
    const perp = hasProperty(order.marketType, "perp");
    let symbol = "";
    if (perp) {
      symbol = MainnetPerpMarkets[order.marketIndex].baseAssetSymbol;
    } else {
      symbol = MainnetSpotMarkets[order.marketIndex].symbol;
    }
    return symbol;
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">Open Orders</h2>
      <div className="grid grid-cols-7 gap-2 mb-2 text-sm text-gray-400">
        <div>Market</div>
        <div>Token</div>
        <div>Side</div>
        <div>Type</div>
        <div>Size</div>
        <div>Price</div>
        <div>Time</div>
      </div>
      {orders && orders.length > 0 ? (
        orders.map((order, index) => (
          <div
            key={index}
            className="py-4 border-t border-gray-800 grid grid-cols-7 gap-2 items-center"
          >
            <div>{hasProperty(order.marketType, "perp") ? "PERP" : "SPOT"}</div>
            <div>{token(order)}</div>
            <div
              className={
                hasProperty(order.direction, "long")
                  ? "text-green-500"
                  : "text-red-500"
              }
            >
              {hasProperty(order.direction, "long") ? "BUY" : "SELL"}
            </div>
            <div>
              {hasProperty(order.orderType, "limit")
                ? "Limit"
                : hasProperty(order.orderType, "market")
                ? "Market"
                : hasProperty(order.orderType, "triggerMarket")
                ? "Trigger Market"
                : hasProperty(order.orderType, "triggerLimit")
                ? "Trigger Limit"
                : "Oracle"}
            </div>
            <div>{format(order.baseAssetAmount, BASE_PRECISION)}</div>
            <div>{format(order.price, PRICE_PRECISION)}</div>
            <div className="flex flex-col">
              <span>
                {new Date(order.slot.toNumber() * 1000).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))
      ) : (
        <div className="py-4 border-t border-gray-800 text-center text-gray-400">
          No open orders
        </div>
      )}
    </div>
  );
}
