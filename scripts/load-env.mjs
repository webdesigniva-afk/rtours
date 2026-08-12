import fs from "node:fs";

export function loadLocalEnv() {
  if (!fs.existsSync(".env.local")) {
    return;
  }

  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+)=(.*)$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    process.env[key.trim()] = rawValue.trim().replace(/^["']|["']$/g, "");
  }
}
