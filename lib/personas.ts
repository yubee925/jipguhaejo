// 발표 시연 페르소나 (data/guide/personas.md). 조건 입력의 "시연" 버튼과 정답표 테스트가 같이 쓴다.
// 공통: 미혼 / 광진구 주민등록 / 무주택 / 부모와 따로 거주 / 1인가구 / 세대주 / 보증금 1000
import { DEFAULT_CONDITIONS, type Conditions } from "./conditions";

export interface Persona {
  id: string;
  label: string;
  /** 버튼 아래 한 줄 설명 */
  summary: string;
  /** 바뀌는 조건만 (나머지는 공통 기본값) */
  conditions: Partial<Conditions>;
  /** "더 정확하게" 항목을 쓰는 페르소나는 그 영역을 펼쳐 보여 준다 */
  usesOptional?: boolean;
}

export const PERSONAS: Persona[] = [
  {
    id: "A",
    label: "A 사회초년생",
    summary: "27세 · 월 150만원",
    conditions: { age: "27", monthlyIncome: "150", job: "EMPLOYED" },
  },
  {
    id: "B",
    label: "B 대학생",
    summary: "22세 · 월 40만원 · 부모 수급가구(지방)",
    conditions: { age: "22", monthlyIncome: "40", job: "STUDENT", basicBenefitFamily: true, parentRegion: "OTHER" },
    usesOptional: true,
  },
  {
    id: "D",
    label: "D 고소득 직장인",
    summary: "36세 · 월 420만원",
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

/** 지금 조건이 어느 페르소나와 같은지 (버튼 강조용) */
export function matchingPersona(c: Conditions): string | null {
  const same = (p: Persona) => {
    const want = applyPersona(p, c);
    return (Object.keys(want) as (keyof Conditions)[]).every((k) => JSON.stringify(want[k]) === JSON.stringify(c[k]));
  };
  return [...PERSONAS, PERSONA_B2].find(same)?.id ?? null;
}
