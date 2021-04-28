import http from "http";
import https from "https";
import { URL } from "url";

export async function getPageTypeWithHTTPGet(
  host: string,
  useHTTPS: boolean
): Promise<ResultOfAttempt> {
  try {
    const response = await get(host, useHTTPS);
    const responseBody = await promisifyResponse(response);
    return resolveMessageFrom(response, responseBody);
  } catch (err) {
    return {
      type: `TIMEOUT`,
      info: err ? err.message : "Empty Error",
    };
  }
}

function promisifyResponse(response: http.IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: string[] = [];
    response.on("data", (chunk) => {
      /* do nothing but listen so that the 'end' event could be invoked */
      chunks.push(chunk);
    });
    response.on("end", () => resolve(chunks.join("")));
    response.on("error", reject);
  });
}

function resolveMessageFrom(
  res: http.IncomingMessage,
  body: string
): ResultOfAttempt {
  switch (res.statusCode) {
    case 200:
      return { type: `OK`, body };
    case 301:
    case 302:
    case 307:
    case 308:
      return {
        type: `REDIRECT`,
        info:
          res.headers.location ||
          (Array.isArray(res.headers.Location)
            ? JSON.stringify(res.headers.Location)
            : res.headers.Location),
      };
    default:
      return {
        type: `OTHER`,
        info: JSON.stringify(res.headers, null, 2),
      };
  }
}

function get(host: string, useHTTPS = true) {
  const client = useHTTPS ? https : http;

  return new Promise<http.IncomingMessage>((resolve, reject) => {
    const req = client.get(
      new URL(`${useHTTPS ? "https:" : "http:"}//${host}`),
      { timeout: 10000 },
      resolve
    );
    req.on("timeout", reject);
    req.on("error", reject);
  });
}
