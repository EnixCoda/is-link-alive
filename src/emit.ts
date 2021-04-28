import { promises as fs } from "fs";

export async function emitAsJSON(output: string, results: any) {
  await fs.writeFile(output, JSON.stringify(results, null, 2), "utf-8");
}

export async function emitAsCSV(
  output: string,
  headers: string[],
  results: any
) {
  const delimiter = ",";
  const lineBreak = "\n";
  await fs.writeFile(
    output,
    [headers]
      .concat(results)
      .map((record) =>
        record
          .map((cell) =>
            typeof cell === "string"
              ? cell.includes(delimiter) || cell.includes(lineBreak)
                ? `"${cell.replace(/"|\\/g, "\\$0")}"`
                : cell
              : ""
          )
          .join(delimiter)
      )
      .join(lineBreak),
    "utf-8"
  );
}
