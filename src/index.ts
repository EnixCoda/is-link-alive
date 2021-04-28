import { promises as fs } from "fs";
import { emitAsJSON, emitAsCSV } from "./emit";
import { getPageTypeWithHTTPGet } from "./node";
import { preparePuppeteer } from "./puppeteer";
import { withPool } from "./withPool";
import * as stringSimilarity from "string-similarity";

const [, , input, output] = process.argv;
if (!input || !output) throw 1;

(async () => {
  /**
   * if accessible via https
   *   mark as OK
   * else if accessible via http
   *   mark as HTTP_ONLY
   * else
   *   mark as TIMEOUT
   */
  const hosts = (await fs.readFile(input, "utf-8")).split("\n").filter(Boolean);

  const puppeteerControl = await preparePuppeteer();

  const getPageTypeWithPuppeteer = withPool(puppeteerControl.access);
  const getPageType = withPool(getPageTypeWithHTTPGet);

  async function resolveHost(host: string) {
    const node: { https: ResultOfAttempt; http?: ResultOfAttempt } = {
      https: await getPageType(host, true),
    };
    const puppeteer: { https?: ResultOfAttempt; http?: ResultOfAttempt } = {};

    // compare body similarity
    do {
      if (node.https.type === "TIMEOUT") break;

      node.http = await getPageType(host, false);
      if (node.http.type === "TIMEOUT") break;

      if (node.http.body && node.https.body) {
        const sim = stringSimilarity.compareTwoStrings(
          node.http.body,
          node.https.body
        );
        const simString = `Similarity: ${(sim * 100).toFixed(2) + "%"}`;
        node.http.info = [node.http.info || "", simString].join("; ");
      } else {
        const simString = `Both responsive, but one of them has no body.`;
        node.http.info = [node.http.info || "", simString].join("; ");
      }
    } while (false);

    do {
      if (node.https.type !== "TIMEOUT") break;

      puppeteer.https = await getPageTypeWithPuppeteer(host, true);
      if (puppeteer.https.type !== "TIMEOUT") break;

      node.http = node.http || (await getPageType(host, false));
      if (node.http.type !== "TIMEOUT") break;

      puppeteer.http = await getPageTypeWithPuppeteer(host, false);
    } while (false);

    return {
      host,
      node,
      puppeteer,
    };
  }

  const results = await Promise.all(
    hosts.map(resolveHost).map(async (task) => {
      const taskResult = await task;
      console.log(`Got`, taskResult.host);
      return taskResult;
    })
  );

  await puppeteerControl.cleanup();

  if (output.endsWith(".json")) await emitAsJSON(output, results);
  else if (output.endsWith(".csv"))
    await emitAsCSV(
      output,
      [
        "Host",
        "HTTPS Type",
        "HTTPS Info",
        "HTTP Type",
        "HTTP Info",
        "Puppeteer HTTPS Type",
        "Puppeteer HTTPS Info",
        "Puppeteer HTTP Type",
        "Puppeteer HTTP Info",
      ],
      results.map(({ host, node, puppeteer }) => [
        host,
        node.https.type,
        node.https.info,
        node.http?.type,
        node.http?.info,
        puppeteer.https?.type,
        puppeteer.https?.info,
        puppeteer.http?.type,
        puppeteer.http?.info,
      ])
    );
  else console.log(JSON.stringify(results));
})();
