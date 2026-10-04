// 발표 시연 페르소나 (data/guide/personas.md). 정답표 테스트(lib/__tests__/persona.test.ts)가 쓴다.
// 공통: 미혼 / 광진구 주민등록 / 무주택 / 부모와 따로 거주 / 1인가구 / 세대주 / 보증금 1000
import { DEFAULT_CONDITIONS, type Conditions } from "./conditions";

export interface Persona {
  id: string;
  label: string;
  /** 바뀌는 조건만 (나머지는 공통 기본값) */
  conditions: Partial<Conditions>;
}

export const PERSONAS: Persona[] = [
  {
    id: "A",
    label: "A 사회초년생",
    conditions: { age: "27", monthlyIncome: "150", job: "EMPLOYED" },
  },
  {
    id: "B",
    label: "B 대학생",
    conditions: { age: "22", monthlyIncome: "40", job: "STUDENT", basicBenefitFamily: true, parentRegion: "OTHER" },
  },
  {
    id: "D",
    label: "D 고소득 직장인",
    conditions: { age: "36", monthlyIncome: "420", job: "EMPLOYED" },
  },
];

/** 정답표 테스트용: B 에서 부모 주소지만 서울로 바꾼 경우 */
export const PERSONA_B2: Persona = {
  ...PERSONAS[1],
  id: "B2",
  label: "B2 대학생(부모 서울)",
  conditions: { ...PERSONAS[1].conditions, parentRegion: "SEOUL" },
};

/** 페르소나 조건 적용: 공통 기본값 + 페르소나 값. 동·주택유형은 지금 선택을 유지 */
export function applyPersona(p: Persona, current: Pick<Conditions, "dong" | "housingType">): Conditions {
  return { ...DEFAULT_CONDITIONS, myDeposit: "1000", ...p.conditions, dong: current.dong, housingType: current.housingType };
}
