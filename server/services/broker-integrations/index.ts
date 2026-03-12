import type {
  BrokerCredentials,
  BrokerTrade,
  KiteCredentials,
  DhanCredentials,
  DeltaCredentials,
} from "@shared/schema";
import { fetchKiteTrades } from "./kiteService.js";
import { fetchDhanTrades } from "./dhanService.js";
import { fetchDeltaTrades } from "./deltaExchangeService.js";
import { getGrowwAccessToken, fetchGrowwFunds, fetchGrowwTrades } from "./growwService.js";

export async function fetchBrokerTrades(
  credentials: BrokerCredentials
): Promise<BrokerTrade[]> {
  switch (credentials.broker) {
    case "kite":
      return fetchKiteTrades(credentials as KiteCredentials);
    case "dhan":
      return fetchDhanTrades(credentials as DhanCredentials) as any;
    case "delta":
      return fetchDeltaTrades(
        (credentials as any).apiKey,
        (credentials as any).apiSecret
      );
    case "groww":
      const accessToken = await getGrowwAccessToken(
        (credentials as any).apiKey,
        (credentials as any).apiSecret
      );
      return fetchGrowwTrades(accessToken); 
    default:
      throw new Error(`Unsupported broker: ${(credentials as any).broker}`);
  }
}
