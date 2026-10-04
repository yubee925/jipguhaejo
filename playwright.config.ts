import { defineConfig, devices } from "@playwright/test";

// 시연 경로 E2E. npm run test:e2e
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    locale: "ko-KR",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // API 키를 빈 값으로 덮어써서 제한형 응답 모드로만 돈다 (.env.local 의 키를 쓰지 않음 → 비용 없음)
    env: { ANTHROPIC_API_KEY: "", ANTHROPIC_AUTH_TOKEN: "" },
  },
});
