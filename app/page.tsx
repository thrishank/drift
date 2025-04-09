"use client";
import { Navbar } from "@/components/navabar";
import { Dashboard } from "@/components/dashboard";

export default function Home() {
  /* 

          await driftClient.subscribe();
          setDriftClient(driftClient);
          console.log("Drift client initialized and set in store");
          const subaccounts = await driftClient.getUserAccountsForAuthority(
            publicKey!
          );

          setSubaccounts(subaccounts);
          // console.log("User accounts:", data);
          const user = driftClient.getUser();
          const format = (num: number) => {
            return convertToNumber(num, PRICE_PRECISION);
          };
          const wtf = user.getNetUsdValue();
          console.log("Total Balance", format(wtf));

          const marketIndex = 15;
          const tokenAmount = user.getTokenAmount(marketIndex);
                   const perps = user.getPerpPosition(0)?.baseAssetAmount;

          const isLong = perps.gte(new BN(0));
          const isShort = perps.lt(new BN(0));
          const perps_format = (num: number) => {
            return convertToNumber(num, BASE_PRECISION);
          };
          console.log("Perps", isLong, "data", perps_format(perps));

          const isDeposit = format(tokenAmount);
          const isBorrow = tokenAmount.lt(new BN(0));
          console.log("Depoist", isDeposit);
          console.log("Borrow", isBorrow);
*/

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-6">
        <Dashboard />
      </div>
    </main>
  );
}
