import fs from "fs";
import path from "path";
import util from "util";

import v2ProdDeployment from "../addresses/prod.json";
import { getProvider } from "./connection";
import { fetchV2Stats } from "./v2/fetchV2Stats";

import {
  DUNE_SPV2_AVERAGE_APY_URL_MAINNET,
  DUNE_SPV2_UPFRONT_FEE_URL_MAINNET,
  OUTPUT_DIR_V2
} from "./constants";

import dotenv from "dotenv";

dotenv.config();

const panic = <T>(message: string): T => {
  throw new Error(message);
};

const alchemyApiKey = process.env.ALCHEMY_API_KEY || undefined; // filter out empty string
const duneApiKey: string = process.env.DUNE_API_KEY || panic("missing DUNE_API_KEY");

const arbitrumProvider = getProvider("arbitrum", { alchemyApiKey });

interface Tree extends Record<string, string | Tree> {}

const writeTree = (parentDir: string, tree: Tree) => {
  if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir);

  for (const [k, v] of Object.entries(tree)) {
    const prefix = path.join(parentDir, k);

    if (typeof v === "string") {
      fs.writeFileSync(`${prefix}.txt`, v);
    } else {
      writeTree(prefix, v);
    }
  }
};

async function main() {
  const v2Stats = await fetchV2Stats({
    deployment: v2ProdDeployment,
    provider: arbitrumProvider,
    duneSpApyUrl: DUNE_SPV2_AVERAGE_APY_URL_MAINNET,
    duneSpUpfrontFeeUrl: DUNE_SPV2_UPFRONT_FEE_URL_MAINNET,
    duneApiKey
  });

  writeTree(OUTPUT_DIR_V2, v2Stats);
  fs.writeFileSync(
    path.join(OUTPUT_DIR_V2, "arbitrum.json"),
    JSON.stringify(v2Stats, null, 2)
  );

  console.log();
  console.log("v2 stats:", util.inspect(v2Stats, { colors: true, depth: null }));
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
