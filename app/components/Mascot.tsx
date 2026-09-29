/**
 * 집구해조 캐릭터 "구해봇": 구름 모양 머리에 화면 얼굴, 가슴에 집 표시.
 * awake면 눈을 뜨고, 아니면 감은 눈(졸린 표정).
 */
export default function Mascot({ awake = false, className = "" }: { awake?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      {/* 다리 */}
      <rect x="23" y="54" width="7" height="7" rx="2" fill="#4a5bd4" />
      <rect x="34" y="54" width="7" height="7" rx="2" fill="#4a5bd4" />
      {/* 몸통 */}
      <rect x="18" y="38" width="28" height="19" rx="7" fill="#5b6ee8" />
      {/* 가슴: 집 */}
      <path d="M27 50.5v-4.5l5-4 5 4v4.5z" fill="none" stroke="#e8f1ff" strokeWidth="2" strokeLinejoin="round" />
      {/* 팔 */}
      <rect x="12" y="41" width="7" height="11" rx="3.5" fill="#5b6ee8" />
      <rect x="45" y="41" width="7" height="11" rx="3.5" fill="#5b6ee8" />
      {/* 구름 머리 */}
      <g fill="#6b7ef0">
        <circle cx="20" cy="22" r="11" />
        <circle cx="32" cy="16" r="13" />
        <circle cx="44" cy="22" r="11" />
        <rect x="9" y="20" width="46" height="21" rx="10.5" />
      </g>
      {/* 화면 얼굴 */}
      <rect x="15" y="21" width="34" height="17" rx="7" fill="#1b2040" />
      {awake ? (
        <g fill="#7fe7ff">
          <rect x="23" y="26" width="4" height="6" rx="2" />
          <rect x="37" y="26" width="4" height="6" rx="2" />
        </g>
      ) : (
        <g fill="none" stroke="#7fe7ff" strokeWidth="2" strokeLinecap="round">
          <path d="M22 29q3 2.5 6 0" />
          <path d="M36 29q3 2.5 6 0" />
        </g>
      )}
    </svg>
  );
}
