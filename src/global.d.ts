type ResultOfAttempt = {
  type: "TIMEOUT" | "OK" | "OTHER" | "REDIRECT";
  info?: number | string;
  body?: string
};

declare module "string-similarity" {
  export function compareTwoStrings(s1:string,s2:string):number
}
