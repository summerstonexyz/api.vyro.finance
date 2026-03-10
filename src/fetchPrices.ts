import { PRICES } from "./constants";

type CoinGeckoId = keyof typeof PRICES;
type Symbol = (typeof PRICES)[CoinGeckoId];

function isCoinGeckoId(id: string): id is CoinGeckoId {
  return id in PRICES;
}

function getCoinGeckoUrl(ids: CoinGeckoId[]) {
  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("ids", ids.join(","));
  return url;
}

function isCoinGeckoResult(result: unknown): result is Record<CoinGeckoId, { usd: number }> {
  if (typeof result !== "object" || result === null) {
    return false;
  }

  const entries = Object.entries(result) as Array<[string, unknown]>;
  return (
    entries.length > 0 &&
    entries.every(([id, value]) => {
      return (
        isCoinGeckoId(id) &&
        typeof value === "object" &&
        value !== null &&
        "usd" in value &&
        typeof value.usd === "number"
      );
    })
  );
}

export async function fetchPrices({
  manualPrices = {}
}: {
  manualPrices?: Partial<Record<Symbol, string>>;
}) {
  const ids = Object.keys(PRICES) as CoinGeckoId[];
  const idsToFetch = ids.filter(id => manualPrices[PRICES[id]] === undefined);
  const prices: Partial<Record<Symbol, string>> = { ...manualPrices };

  if (idsToFetch.length > 0) {
    const response = await fetch(getCoinGeckoUrl(idsToFetch), {
      headers: { accept: "application/json" }
    });

    if (!response.ok) {
      console.error("Failed to fetch prices from CoinGecko API:", response.statusText);
      throw new Error("Failed to fetch prices from CoinGecko API");
    }

    const result = await response.json().catch((error: unknown) => {
      console.error("Error parsing JSON response from CoinGecko API:", error);
      throw new Error("Error parsing JSON response from CoinGecko API");
    });

    if (!isCoinGeckoResult(result)) {
      console.error("Invalid response format from CoinGecko API:", result);
      throw new Error("Invalid response format from CoinGecko API");
    }

    Object.assign(
      prices,
      Object.fromEntries(
        Object.entries(result).map(([id, value]) => {
          if (!isCoinGeckoId(id)) {
            throw new Error(`Unexpected CoinGecko ID: ${id}`);
          }
          if (value.usd <= 0) {
            throw new Error(`Invalid price for ${id}: ${value.usd}`);
          }
          return [PRICES[id], String(value.usd)];
        })
      ) as Partial<Record<Symbol, string>>
    );
  }

  for (const id of ids) {
    const symbol = PRICES[id];
    if (!(symbol in prices)) {
      throw new Error(
        `Missing price for ${symbol} (${id}). Set a manual override until CoinGecko lists it.`
      );
    }
  }

  return prices as Record<Symbol, string>;
}
