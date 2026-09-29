"use client";

import { useApp } from "./AppProvider";
import ChatWidget from "./ChatWidget";

/** 모든 페이지 오른쪽 아래 AI 도우미 버튼 (공유 조건 기준으로 답함) */
export default function SiteChat() {
  const { conditions } = useApp();
  return <ChatWidget conditions={conditions} />;
}
