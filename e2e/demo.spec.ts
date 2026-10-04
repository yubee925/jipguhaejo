// 시연 경로 E2E (최소). 선택자는 화면 텍스트·역할 위주.
import { expect, test } from "@playwright/test";
import { listDongs, loadRent } from "../lib/data";

const DONGS = listDongs(loadRent());

test("진단: 기본 조건에서 정책 적용 전·후 금액과 정책 카드가 보인다", async ({ page }) => {
  await page.goto("/diagnosis");
  for (const label of ["정책 적용 전 월 주거비", "정책 적용 후 월 주거비"]) {
    // 라벨 바로 아래 금액 (예: 66.7만원)
    await expect(page.getByText(label).locator("xpath=following-sibling::*[1]")).toHaveText(/[\d.,]+만원/);
  }
  await expect(page.getByRole("link", { name: /신청·공고 보기/ }).first()).toBeVisible();
});

test("진단: 나이를 비우면 입력 안내가 보인다", async ({ page }) => {
  await page.goto("/diagnosis");
  const age = page.getByRole("spinbutton", { name: /나이/ });
  await age.fill("");
  await expect(page.getByText(/입력해 주세요/)).toBeVisible();
});

test("동네 비교: 동 목록이 데이터의 동 개수만큼 보이고, 다른 동을 누르면 선택이 바뀐다", async ({ page }) => {
  await page.goto("/compare");
  // 순위 목록의 동 버튼 (선택 여부를 aria-pressed 로 표시)
  const dongButtons = page.getByRole("listitem").filter({ hasText: new RegExp(DONGS.join("|")) });
  await expect(dongButtons).toHaveCount(DONGS.length);

  const selectedSection = page.getByText("선택한 동", { exact: true }).locator("xpath=..");
  const before = (await page.getByRole("button", { pressed: true }).first().innerText()).trim();
  const target = DONGS.find((d) => !before.includes(d))!;

  await page.getByRole("button", { pressed: false }).filter({ hasText: target }).click();
  await expect(page.getByRole("button", { pressed: true }).filter({ hasText: target })).toBeVisible();
  await expect(selectedSection).toContainText(target);
});

test("AI 패널: 추천 질문을 누르면 답변이 나오고, 답변 중에는 보내기가 비활성화된다", async ({ page }) => {
  // 답변 중 상태를 확인할 수 있게 응답을 1.5초 늦춘다 (제한형 응답은 너무 빨라서)
  await page.route("**/api/explain", async (route) => {
    if (route.request().method() === "POST") await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });

  await page.goto("/diagnosis");
  await page.getByRole("button", { name: /AI에게 물어보기/ }).click();
  const panel = page.getByRole("dialog", { name: "AI 주거비 도우미" });
  await expect(panel.getByText("제한형 응답 모드")).toBeVisible(); // API 키 없이 도는지 확인

  await panel.getByRole("button", { name: "이 동의 실질 주거비를 요약해줘" }).click();
  await panel.getByRole("textbox", { name: "질문" }).fill("보증금을 올리면?");
  await expect(panel.getByText("답변을 작성하는 중…")).toBeVisible();
  await expect(panel.getByRole("button", { name: "보내기" })).toBeDisabled();

  await expect(panel.getByText(/실질 월 주거비는 [\d.,]+만원/)).toBeVisible();
  await expect(panel.getByRole("button", { name: "보내기" })).toBeEnabled();
});
