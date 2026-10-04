import { defineConfig } from "vitest/config";

// 단위 테스트는 lib/ 만. e2e/ 는 Playwright(npm run test:e2e)가 돌린다.
export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts"],
  },
});
