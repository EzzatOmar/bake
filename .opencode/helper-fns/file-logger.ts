import { appendFileSync } from "node:fs";

export const fileLog = (...args: any[]) => {
  appendFileSync(".opencode/log.txt", args.join(" ") + "\n", "utf8");
}

