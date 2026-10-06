// PitchWizard 프론트엔드 핵심 로직 시험 — D07 시스템 시험 결과서의 STC-T02-003~006, T05-005, T06-008~011
//
// 실행:  frontend 폴더에서  node tests/logic_test.cjs
//   - 추가 설치 없음 (vite 가 이미 설치한 esbuild 로 TS/JSX 를 변환)
//   - 화면(React)·마이크는 시험하지 않는다. 소스에서 순수 계산 함수만 뽑아 실행한다.
//   - 기대값은 AI가 코드를 읽고 작성한 것이다. D03/D04 의 요구사항과 맞는지 팀원이 검토할 것.
//   - 함수 이름이 바뀌거나 파일이 옮겨지면 "not found" 로 실패한다 → 아래 경로/이름을 고칠 것.
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");
const SRC = path.join(__dirname, "..", "src");

function extract(file, name) {
  const src = fs.readFileSync(file, "utf8");
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`${name} not found in ${file}`);
  let p = src.indexOf("(", start), pd = 0;
  for (; p < src.length; p++) { if (src[p] === "(") pd++; else if (src[p] === ")") { pd--; if (pd === 0) break; } }
  let i = src.indexOf("{", p), depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) break; }
  }
  const code = src.slice(start, i + 1);
  return esbuild.transformSync(code, { loader: "tsx", target: "es2020" }).code;
}

const results = [];
function check(id, desc, fn) {
  try { fn(); results.push([id, "P", desc]); console.log(`PASS ${id} ${desc}`); }
  catch (e) { results.push([id, "F", desc + " :: " + e.message]); console.log(`FAIL ${id} ${desc} :: ${e.message}`); }
}
function assert(c, msg) { if (!c) throw new Error(msg || "assertion failed"); }

const PT = path.join(SRC, "PitchTestpiano.jsx");
const AP = path.join(SRC, "AccompanimentPage.tsx");
const SD = path.join(SRC, "SongDetailPage.tsx");

// ---- 음역대 측정: 자기상관 피치 검출 ----
const autocorrelate = new Function(extract(PT, "autocorrelate") + "; return autocorrelate;")();
check("STC-T02-003", "자기상관 피치 검출(220Hz·440Hz 정현파, fftSize 2048)", () => {
  for (const f of [220, 440]) {
    const sr = 48000, buf = new Float32Array(2048);
    for (let i = 0; i < buf.length; i++) buf[i] = 0.3 * Math.sin(2 * Math.PI * f * i / sr);
    const { freq } = autocorrelate(buf, sr);
    const cents = Math.abs(1200 * Math.log2(freq / f));
    assert(cents < 10, `f=${f} → ${freq.toFixed(2)}Hz (${cents.toFixed(1)} cents)`);
  }
});
check("STC-T02-004", "무음 입력(RMS < 0.0003) 시 피치 미검출", () => {
  const { freq } = autocorrelate(new Float32Array(2048), 48000);
  assert(freq === -1, `freq=${freq}`);
});

// ---- 음역대 측정: 테시투라 산출 ----
const estimateTessitura = new Function(extract(PT, "estimateTessitura") + "; return estimateTessitura;")();
check("STC-T02-005", "연속 Strong OK 구간(1칸 공백 허용)으로 테시투라 산출", () => {
  const notes = ["C3","D3","E3","F3","G3","A3","B3","C4","D4","E4"];
  const strong = [0.2, 0.7, 0.8, 0.9, 0.3, 0.8, 0.9, 0.7, 0.1, 0.0];
  const res = notes.map((n, i) => ({ note: n, strong: strong[i] }));
  const { tessitura } = estimateTessitura(res, { strongThreshold: 0.6, minNotes: 3, maxAllowedGaps: 1 });
  assert(tessitura && tessitura.low === "D3" && tessitura.high === "C4", JSON.stringify(tessitura));
});
check("STC-T02-006", "Strong OK 음이 3개 미만이면 테시투라 없음", () => {
  const res = [{ note: "C3", strong: 0.9 }, { note: "D3", strong: 0.1 }, { note: "E3", strong: 0.1 }, { note: "F3", strong: 0.9 }];
  const { tessitura } = estimateTessitura(res, { strongThreshold: 0.6, minNotes: 3, maxAllowedGaps: 1 });
  assert(tessitura === null, JSON.stringify(tessitura));
});

// ---- 반주 연습: 완곡 후 점수 산출 ----
function runCalc(log, semi) {
  const body = extract(AP, "calcAnalysis");
  return new Function("fullSongLog", "semitonesRef", body + "; return calcAnalysis();")({ current: log }, { current: semi });
}
check("STC-T06-008", "원곡과 동일 음정으로 전 구간 가창 시 100점", () => {
  const log = Array.from({ length: 50 }, (_, i) => ({ time: i / 10, origMidi: 60, userMidi: 60 }));
  const r = runCalc(log, 0);
  assert(r.score === 100 && r.coverage === 100 && r.perfect === 100, JSON.stringify(r));
});
check("STC-T06-009", "전조(+2키) 반영: 사용자 62 / 원곡 60 → 정확 판정", () => {
  const log = Array.from({ length: 20 }, () => ({ origMidi: 60, userMidi: 62 }));
  const r = runCalc(log, 2);
  assert(r.perfect === 100 && r.score === 100, JSON.stringify(r));
});
check("STC-T06-010", "절반 구간만 가창·3반음 오차 → 정확도·커버리지 가중 점수", () => {
  const log = Array.from({ length: 20 }, (_, i) => ({ origMidi: 60, userMidi: i < 10 ? 63 : null }));
  const r = runCalc(log, 0);
  // accuracy = 0.4 (ok), coverage = 0.5 → (0.4*0.7 + 0.5*0.3)*100 = 43
  assert(r.score === 43 && r.coverage === 50 && r.ok === 100, JSON.stringify(r));
});
check("STC-T06-011", "마이크 입력이 전혀 없으면 결과 없음(null)", () => {
  const log = Array.from({ length: 10 }, () => ({ origMidi: 60, userMidi: null }));
  assert(runCalc(log, 0) === null);
});

// ---- 곡 음역대 비교: 추천 키 범위 제한 ----
const clamp = new Function(extract(SD, "clampToAccompanimentRange") + "; return clampToAccompanimentRange;")();
check("STC-T05-005", "화면 추천 키는 반주 조절 범위(-5~+5)로 제한", () => {
  assert(clamp(Math.round(70 - 60)) === 5 && clamp(Math.round(52 - 60)) === -5 && clamp(Math.round(61.4 - 60)) === 1);
});

const failed = results.filter(r => r[1] === "F").length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
