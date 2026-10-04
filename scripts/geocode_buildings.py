"""실거래 건물 주소 → 좌표 (브이월드 지오코더 API 2.0).

data/rent_gwangjin_clean.csv 의 건물(동+도로명주소)마다 한 번만 조회해 data/building_coords.csv 에 저장한다.
도로명주소로 먼저 찾고, 없으면 지번주소로 찾는다. 사이트는 결과 CSV 만 읽으므로 키는 이 스크립트에서만 쓴다.

키: 환경변수 VWORLD_API_KEY 또는 .env.local 의 VWORLD_API_KEY (키 값은 출력하지 않는다)
precision: building(도로명 건물) / parcel(지번) / none(못 찾음)

실행: python3 scripts/geocode_buildings.py          (이미 찾은 건물은 건너뜀)
      python3 scripts/geocode_buildings.py --fresh  (처음부터 다시)
"""
import csv
import json
import os
import sys
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "rent_gwangjin_clean.csv")
OUT = os.path.join(ROOT, "data", "building_coords.csv")
FIELDS = ["dong", "road_addr", "jibun", "lat", "lng", "precision"]
API = "https://api.vworld.kr/req/address"


def load_key():
    key = os.environ.get("VWORLD_API_KEY")
    if not key:
        env = os.path.join(ROOT, ".env.local")
        if os.path.exists(env):
            for line in open(env, encoding="utf-8"):
                if line.startswith("VWORLD_API_KEY="):
                    key = line.split("=", 1)[1].strip()
    if not key:
        sys.exit("VWORLD_API_KEY 가 없습니다 (.env.local 에 추가하세요)")
    return key


def getcoord(key, address, kind):
    params = {
        "service": "address", "request": "getcoord", "version": "2.0", "crs": "epsg:4326",
        "address": address, "refine": "true", "simple": "true", "format": "json", "type": kind,
        "key": key, "domain": "https://jipguhaejo.vercel.app",
    }
    for attempt in range(3):
        try:
            with urllib.request.urlopen(f"{API}?{urllib.parse.urlencode(params)}", timeout=20) as f:
                r = json.load(f).get("response", {})
            time.sleep(0.1)
            if r.get("status") == "OK":
                p = r["result"]["point"]
                return float(p["y"]), float(p["x"])
            if r.get("status") == "ERROR" and r.get("error", {}).get("code") in ("INVALID_KEY", "OVER_REQUEST_LIMIT"):
                sys.exit(f"브이월드 오류: {r['error'].get('code')}")
            return None
        except (OSError, ValueError):
            time.sleep(3 * (attempt + 1))
    return None


def main():
    key = load_key()
    rows = list(csv.DictReader(open(SRC, encoding="utf-8-sig")))
    # 도로명주소가 빈 거래는 위치를 특정할 수 없어 뺀다
    buildings = sorted({(r["dong"], r["road_addr"], r["jibun"]) for r in rows if r["road_addr"].strip()})
    if "--fresh" in sys.argv and os.path.exists(OUT):
        os.remove(OUT)
    done = set()
    if os.path.exists(OUT):
        done = {(r["dong"], r["road_addr"]) for r in csv.DictReader(open(OUT, encoding="utf-8"))}
    new_file = not os.path.exists(OUT)
    todo = [b for b in buildings if (b[0], b[1]) not in done]
    found = 0
    with open(OUT, "a", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        if new_file:
            w.writeheader()
        for i, (dong, road, jibun) in enumerate(todo, 1):
            precision = "building"
            hit = getcoord(key, f"서울특별시 광진구 {road}", "road")
            if not hit:
                precision = "parcel"
                hit = getcoord(key, f"서울특별시 광진구 {dong} {jibun}", "parcel")
            found += bool(hit)
            w.writerow({
                "dong": dong, "road_addr": road, "jibun": jibun,
                "lat": round(hit[0], 6) if hit else "", "lng": round(hit[1], 6) if hit else "",
                "precision": precision if hit else "none",
            })
            f.flush()
            if i % 200 == 0:
                print(f"{i}/{len(todo)}", flush=True)
    print(f"done: {found}/{len(todo)} found", flush=True)


if __name__ == "__main__":
    main()
