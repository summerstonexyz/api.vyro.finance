import fs from "fs";
import path from "path";
import util from "util";

import { getProvider } from "./connection";
import { OUTPUT_DIR_V2 } from "./constants";
import type { LiquityV2Deployment } from "./v2/contracts";
import { fetchV2Stats } from "./v2/fetchV2Stats";

import dotenv from "dotenv";

dotenv.config();

const V2_CHAIN = "unichain";
const V2_DEPLOYMENT_FILE = path.resolve(process.cwd(), "addresses", `${V2_CHAIN}.json`);
const V2_OUTPUT_FILE = `${V2_CHAIN}.json`;

const panic = <T>(message: string): T => {
  throw new Error(message);
};

const unichainRpcUrl: string = process.env.UNICHAIN_RPC_URL || panic("missing UNICHAIN_RPC_URL");
const duneApiKey = process.env.DUNE_API_KEY || undefined;
const duneSpApyUrl = process.env.DUNE_SPV2_AVERAGE_APY_URL || null;
const duneSpUpfrontFeeUrl = process.env.DUNE_SPV2_UPFRONT_FEE_URL || null;

const unichainProvider = getProvider(unichainRpcUrl);

interface Tree extends Record<string, string | Tree> {}

const readDeployment = (fileName: string): LiquityV2Deployment => {
  if (!fs.existsSync(fileName)) {
    return panic(`missing deployment file: ${fileName}`);
  }

  return JSON.parse(fs.readFileSync(fileName, "utf-8")) as LiquityV2Deployment;
};

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
  const deployment = readDeployment(V2_DEPLOYMENT_FILE);
  const v2Stats = await fetchV2Stats({
    deployment,
    provider: unichainProvider,
    duneSpApyUrl,
    duneSpUpfrontFeeUrl,
    duneApiKey
  });

  writeTree(OUTPUT_DIR_V2, v2Stats);
  fs.writeFileSync(
    path.join(OUTPUT_DIR_V2, V2_OUTPUT_FILE),
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
