import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "packages/**/tests/**/*.test.ts",
      "packages/**/test/**/*.test.ts",
      "tests/**/*.test.ts",
    ],
  },
  resolve: {
    alias: [
      {
        find: /^@dp\/(.*)$/,
        replacement: path.resolve(__dirname, "packages/$1/src"),
      },
    ],
  },
});
