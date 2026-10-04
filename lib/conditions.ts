// 조건 입력 폼 상태 ↔ 계산 입력(UserInput) 변환. 화면과 AI 해설 API가 같이 쓴다.
// 입력 항목·선택지·기본값은 data/input_fields.csv 기준 (lib/__tests__/conditions.test.ts 가 일치 여부를 검사)
import type { HousingType, UserInput } from "./types";

type Option<T extends string> = { value: T; label: string };

export const MARITAL = [
  { value: "SINGLE", label: "미혼" },
  { value: "NEWLYWED", label: "신혼 7년 이내" },
  { value: "MARRIED", label: "기혼" },
] as const satisfies readonly Option<NonNullable<UserInput["marital"]>>[];

export const JOB = [
  { value: "EMPLOYED", label: "재직" },
  { value: "JOBSEEKER", label: "구직·미취업" },
  { value: "STUDENT", label: "대학(원)생" },
  { value: "FREELANCE", label: "프리랜서" },
] as const satisfies readonly Option<NonNullable<UserInput["job"]>>[];

export const RESIDENT = [
  { value: "GWANGJIN", label: "광진구" },
  { value: "SEOUL_OTHER", label: "서울 타구" },
  { value: "OTHER", label: "서울 외" },
] as const satisfies readonly Option<NonNullable<UserInput["resident"]>>[];

export const PARENT_INCOME = [
  { value: "UNKNOWN", label: "모름" },
  { value: "UNDER_100", label: "중위 100% 이하" },
  { value: "OVER_100", label: "초과" },
] as const satisfies readonly Option<NonNullable<UserInput["parentIncome"]>>[];

export const PARENT_REGION = [
  { value: "UNKNOWN", label: "모름" },
  { value: "SEOUL", label: "서울" },
  { value: "OTHER_METRO", label: "타 특별·광역시" },
  { value: "OTHER", label: "그 외" },
] as const satisfies readonly Option<NonNullable<UserInput["parentRegion"]>>[];

export const MOVED_IN = [
  { value: "UNKNOWN", label: "모름" },
  { value: "AFTER_2024", label: "2024.1.1 이후" },
  { value: "BEFORE_2024", label: "이전" },
] as const satisfies readonly Option<NonNullable<UserInput["movedInYear"]>>[];

export const CURRENT_SUPPORT = [
  { value: "YOUTH_ALLOWANCE", label: "서울 청년수당" },
  { value: "P01", label: "국토부 청년월세" },
  { value: "P03", label: "광진형 청년월세" },
  { value: "P12", label: "주거급여" },
] as const;

type V<T extends readonly { value: string }[]> = T[number]["value"];

/** 폼 상태. 입력 중 빈 칸을 허용하려고 숫자 필드는 문자열로 보관 */
export type Conditions = {
  age: string;
  /** 월소득(만원) */
  monthlyIncome: string;
  marital: V<typeof MARITAL>;
  job: V<typeof JOB>;
  resident: V<typeof RESIDENT>;
  homeless: boolean;
  independent: boolean;
  /** 1인 가구 */
  single: boolean;
  housingType: HousingType;
  /** 보유 보증금(만원) */
  myDeposit: string;
  dong: string;
  // 더 정확하게 (선택)
  houseHead: boolean;
  /** 본인 총자산(만원). 빈 칸 = 모름 */
  asset: string;
  parentIncome: V<typeof PARENT_INCOME>;
  basicBenefitFamily: boolean;
  parentRegion: V<typeof PARENT_REGION>;
  movedInYear: V<typeof MOVED_IN>;
  parentHouseRent: boolean;
  currentSupport: V<typeof CURRENT_SUPPORT>[];
};

/** input_fields.csv 의 기본값 (dong 은 데이터에서 정함) */
export const DEFAULT_CONDITIONS: Omit<Conditions, "dong"> = {
  age: "27",
  monthlyIncome: "150",
  marital: "SINGLE",
  job: "EMPLOYED",
  resident: "GWANGJIN",
  homeless: true,
  independent: true,
  single: true,
  housingType: "officetel",
  myDeposit: "1000",
  houseHead: true,
  asset: "",
  parentIncome: "UNKNOWN",
  basicBenefitFamily: false,
  parentRegion: "UNKNOWN",
  movedInYear: "UNKNOWN",
  parentHouseRent: false,
  currentSupport: [],
};

export const HOUSING_TYPE_LABEL: Record<HousingType, string> = {
  officetel: "오피스텔",
  villa: "연립·다세대",
};

const isBlank = (v: unknown) => v == null || (typeof v === "string" && v.trim() === "");

const toNumber = (v: unknown) => {
  if (isBlank(v)) return 0;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** 빈칸 = 미입력(undefined), 0 = 0. 둘을 구분해야 하는 값(보유 보증금)에 사용 */
const toOptionalNumber = (v: unknown): number | undefined => {
  if (isBlank(v)) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(n, 0) : undefined;
};

/** 계산에 꼭 필요한데 빈칸인 항목 (화면 안내·API 검증용) */
export function missingRequired(c: Pick<Conditions, "age" | "monthlyIncome">): string[] {
  const out: string[] = [];
  if (isBlank(c.age)) out.push("나이");
  if (isBlank(c.monthlyIncome)) out.push("월소득");
  return out;
}

/** API로 들어온 숫자 입력의 범위 검사. 문제가 있으면 안내 문구, 없으면 null */
export function invalidConditions(c: Partial<Record<keyof Conditions, unknown>>): string | null {
  const missing = missingRequired({ age: c.age as string, monthlyIncome: c.monthlyIncome as string });
  if (missing.length) return `${missing.join("·")}을(를) 입력해 주세요.`;
  const ranges: [keyof Conditions, string, number, number][] = [
    ["age", "나이", 15, 70],
    ["monthlyIncome", "월소득", 0, 10000],
    ["myDeposit", "보유 보증금", 0, 100000],
    ["asset", "자산", 0, 1000000],
  ];
  for (const [key, label, min, max] of ranges) {
    if (isBlank(c[key])) continue;
    const n = Number(c[key]);
    if (!Number.isFinite(n) || n < min || n > max) return `${label} 값이 올바르지 않습니다 (${min}~${max}).`;
  }
  if (c.housingType !== undefined && !(c.housingType === "officetel" || c.housingType === "villa"))
    return "주택유형 값이 올바르지 않습니다.";
  return null;
}

/** 선택지에 없는 값(API로 들어온 잘못된 값 등)은 기본값 */
function pick<T extends readonly { value: string }[]>(opts: T, v: unknown, fallback: V<T>): V<T> {
  return opts.some((o) => o.value === v) ? (v as V<T>) : fallback;
}

/** 폼 상태 → UserInput. 음수·NaN은 0. 보유 보증금은 빈칸(미입력)과 0을 구분 */
export function toUserInput(c: Conditions): UserInput {
  const d = DEFAULT_CONDITIONS;
  const asset = typeof c.asset === "string" && c.asset.trim() !== "" && Number.isFinite(Number(c.asset)) ? Math.max(Number(c.asset), 0) : null;
  return {
    age: toNumber(c.age),
    monthlyIncome: toNumber(c.monthlyIncome),
    homeless: c.homeless === true,
    independent: c.independent === true,
    single: c.single === true,
    housingType: c.housingType === "villa" ? "villa" : "officetel",
    myDeposit: toOptionalNumber(c.myDeposit),
    marital: pick(MARITAL, c.marital, d.marital),
    job: pick(JOB, c.job, d.job),
    resident: pick(RESIDENT, c.resident, d.resident),
    houseHead: c.houseHead !== false,
    asset,
    parentIncome: pick(PARENT_INCOME, c.parentIncome, d.parentIncome),
    basicBenefitFamily: c.basicBenefitFamily === true,
    parentRegion: pick(PARENT_REGION, c.parentRegion, d.parentRegion),
    movedInYear: pick(MOVED_IN, c.movedInYear, d.movedInYear),
    parentHouseRent: c.parentHouseRent === true,
    currentSupport: Array.isArray(c.currentSupport)
      ? c.currentSupport.filter((s) => CURRENT_SUPPORT.some((o) => o.value === s))
      : [],
  };
}
