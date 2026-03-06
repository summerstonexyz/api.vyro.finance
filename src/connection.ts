import type { Provider } from "@ethersproject/abstract-provider";
import { StaticJsonRpcProvider } from "@ethersproject/providers";

const UNICHAIN_MAINNET = {
  chainId: 130,
  name: "unichain"
};

export const getProvider = (rpcUrl: string): Provider =>
  new StaticJsonRpcProvider(rpcUrl, UNICHAIN_MAINNET);
