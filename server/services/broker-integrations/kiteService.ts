import type { KiteCredentials, BrokerTrade } from "@shared/schema";

export async function fetchKiteTrades(credentials: KiteCredentials): Promise<BrokerTrade[]> {
  throw new Error("Kite integration not implemented yet");
}
