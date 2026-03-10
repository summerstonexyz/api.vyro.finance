import path from "path";

export const OUTPUT_DIR = "docs";
export const OUTPUT_DIR_V2 = path.join(OUTPUT_DIR, "v2");

// { [coinGeckoId]: symbol }
export const PRICES = {
  ethereum: "ETH",
  "wrapped-steth": "wstETH",
  uniswap: "UNI",
  "vyro-vyusd": "vyUSD"
} as const;
