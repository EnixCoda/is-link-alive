import Puppeteer from "puppeteer";

export const preparePuppeteer = async () => {
  const browser = await Puppeteer.launch({
    headless: process.env.HEADLESS !== undefined,
    args: ["--enable-features=NetworkService"],
  });
  async function access(host: string, useHTTPS: boolean): Promise<ResultOfAttempt> {
    const page = await browser.newPage();
    try {
      const protocol = useHTTPS ? "https:" : "http:";
      const res = await page.goto(`${protocol}//${host}`, {
        waitUntil: "load",
      });
      switch (res.status()) {
        case 200:
          return { type: `OK` };
        case 301:
        case 302:
        case 307:
        case 308:
          return {
            type: `REDIRECT`,
            info: res.headers().location,
          };
        default:
          return { type: `OTHER`, info: res.status() };
      }
    } catch (err) {
      return { type: `TIMEOUT`, info: err?.message };
    } finally {
      await page.close();
    }
  }
  return {
    access,
    cleanup() {
      return browser.close();
    },
  };
};
