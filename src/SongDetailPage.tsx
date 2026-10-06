import { useEffect, useState } from "react";
import { ArrowLeft, Music2, PlayCircle, UserRound } from "lucide-react";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

type SongInfo = {
  id: string | number;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  midiMin?: number | null;
  midiMedian?: number | null;
  midiMax?: number | null;
  rmsMean?: number | null;
  rmsStd?: number | null;
};

// GET /songs/{song_id}/transpose 응답 중 화면에서 쓰는 값
export type TransposeResult = { recommended_shift: number | null; message: string };

type Props = {
  onBack: () => void;
  onGoAccompaniment: () => void;
  isDarkMode: boolean;
  user: any;
  song: SongInfo;
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiToNoteName(midi: number) {
  const rounded = Math.round(midi);
  return `${NOTE_NAMES[((rounded % 12) + 12) % 12]}${Math.floor(rounded / 12) - 1}`;
}

function buildWhiteMidiKeys() {
  const keys: number[] = [];
  for (let midi = 36; midi <= 84; midi++) if (!NOTE_NAMES[midi % 12].includes("#")) keys.push(midi);
  return keys;
}

function hasBlackKeyToRight(whiteMidi: number) {
  const note = NOTE_NAMES[whiteMidi % 12];
  return note !== "E" && note !== "B";
}

export function clampToAccompanimentRange(v: number) { return Math.max(-5, Math.min(5, v)); }

function formatShift(v: number) { return v > 0 ? `+${v}` : `${v}`; }

// 서버 추천 키가 반주 조절 범위(-5~+5)를 넘을 때 덧붙이는 안내
export function clampNotice(rawShift: number | null) {
  if (rawShift === null || clampToAccompanimentRange(rawShift) === rawShift) return "";
  return `서버 추천 ${formatShift(rawShift)}키, 반주 조절 범위(±5)로 제한`;
}
function inRange(midi: number, min: number | null, max: number | null) {
  return min !== null && max !== null && midi >= min && midi <= max;
}

function keyClass(inSong: boolean, inUser: boolean, isBlack: boolean) {
  if (inSong && inUser) return isBlack ? "bg-gradient-to-b from-[#00f4c9] to-[#00c89f]" : "bg-gradient-to-b from-[#b9ffef] to-[#82f1d6]";
  if (inSong) return isBlack ? "bg-gradient-to-b from-[#ffd37a] to-[#ffad33]" : "bg-gradient-to-b from-[#ffe8bc] to-[#ffd388]";
  if (inUser) return isBlack ? "bg-gradient-to-b from-[#79d2ff] to-[#3b9fff]" : "bg-gradient-to-b from-[#c5edff] to-[#8ad4ff]";
  return isBlack ? "bg-gradient-to-b from-[#2a2a2a] to-black" : "bg-gradient-to-b from-white to-[#ececec]";
}

export default function SongDetailPage({ onBack, onGoAccompaniment, isDarkMode, user, song }: Props) {
  const dark = isDarkMode;
  const bg = dark ? "bg-[#0a0a0a]" : "bg-[#f5f5f7]";
  const text = dark ? "text-white" : "text-[#1d1d1f]";
  const sub = dark ? "text-white/50" : "text-[#1d1d1f]/50";
  const card = dark ? "bg-white/[0.04]" : "bg-black/[0.03]";
  const cardHover = dark ? "hover:bg-white/[0.07]" : "hover:bg-black/[0.06]";
  const border = dark ? "border-white/[0.08]" : "border-black/[0.08]";
  const innerCard = dark ? "bg-white/[0.03]" : "bg-black/[0.02]";

  const songMin = typeof song.midiMin === "number" ? song.midiMin : null;
  const songMedian = typeof song.midiMedian === "number" ? song.midiMedian : null;
  const songMax = typeof song.midiMax === "number" ? song.midiMax : null;
  const userMin = typeof user?.midi_min === "number" && user.midi_min > 0 ? user.midi_min : null;
  const userMax = typeof user?.midi_max === "number" && user.midi_max > 0 ? user.midi_max : null;
  const hasSongRange = songMin !== null && songMax !== null;
  const hasUserRange = userMin !== null && userMax !== null;
  const overlapMin = hasSongRange && hasUserRange ? Math.max(songMin, userMin) : null;
  const overlapMax = hasSongRange && hasUserRange ? Math.min(songMax, userMax) : null;
  const hasOverlap = overlapMin !== null && overlapMax !== null && overlapMin <= overlapMax;
  const songId = song.id;
  const userId = user?.id ?? null;
  const canRequestTranspose = userId !== null && hasUserRange && hasSongRange;

  // 추천 키: 서버 calc_smart_transpose(음역 경계 기준) 결과를 반주 화면과 똑같이 사용
  const [transpose, setTranspose] = useState<TransposeResult | null>(null);
  const [transposeError, setTransposeError] = useState(false);

  async function fetchTranspose(songId: string | number) {
    const res = await axios.get(`${BASE_URL}/songs/${songId}/transpose`, { params: { user_id: userId } });
    return { recommended_shift: res.data?.recommended_shift ?? null, message: res.data?.message ?? "" } as TransposeResult;
  }

  useEffect(() => {
    setTranspose(null);
    setTransposeError(false);
    if (!canRequestTranspose) return;
    let cancelled = false;
    fetchTranspose(songId)
      .then((r) => { if (!cancelled) setTranspose(r); })
      .catch(() => { if (!cancelled) setTransposeError(true); });
    return () => { cancelled = true; };
  }, [songId, userId, canRequestTranspose]);

  const rawShift = transpose?.recommended_shift ?? null;
  const recommendedShift = rawShift !== null ? clampToAccompanimentRange(rawShift) : null;
  const shiftNotice = clampNotice(rawShift);
  const whiteKeys = buildWhiteMidiKeys();

  return (
    <div className={`min-h-screen ${bg} relative overflow-hidden`}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[120px] opacity-20 bg-[#00d9b1]" />
        <div className={`absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 ${dark ? "bg-blue-500" : "bg-blue-400"}`} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col font-['Pretendard']">
        <header className={`fixed top-0 left-0 right-0 z-50 ${dark ? "bg-[#0a0a0a]/80" : "bg-[#f5f5f7]/80"} backdrop-blur-xl border-b ${border}`}>
          <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
            <button onClick={onBack} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${card} ${cardHover} border ${border}`}>
              <ArrowLeft className={`w-4 h-4 ${sub}`} />
            </button>
            <span className={`text-[15px] font-semibold tracking-tight ${text}`}>PitchWizard</span>
            <div className="w-8" />
          </div>
        </header>

        <main className="flex-1 pt-16 px-8 pb-16 max-w-6xl mx-auto w-full">
          {/* 히어로 */}
          <div className="text-center pt-16 pb-10">
            <div className={`inline-flex items-center gap-2 text-[12px] px-3 py-1 rounded-full border ${border} ${card} ${sub} mb-7`}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00d9b1] animate-pulse" />
              Song Profile
            </div>
            <h2 className={`text-[48px] font-bold leading-[1.05] tracking-tight ${text} mb-3`}>
              {song.title}
            </h2>
            <p className={`text-[18px] ${sub}`}>{song.artist}</p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
              {hasSongRange && (
                <span className="rounded-full border border-[#00d9b1]/30 px-3 py-1 text-[12px] text-[#00d9b1]">
                  음역 {midiToNoteName(songMin)} ~ {midiToNoteName(songMax)}
                </span>
              )}
              {typeof songMedian === "number" && (
                <span className={`rounded-full border ${border} px-3 py-1 text-[12px] ${sub}`}>중앙 {midiToNoteName(songMedian)}</span>
              )}
              {song.album && <span className={`rounded-full border ${border} px-3 py-1 text-[12px] ${sub}`}>앨범 {song.album}</span>}
              {song.duration && <span className={`rounded-full border ${border} px-3 py-1 text-[12px] ${sub}`}>{song.duration}</span>}
            </div>
          </div>

          <div className="space-y-4">
            {/* 음역대 비교 */}
            <section className={`rounded-2xl border ${border} ${card} p-7`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${border} ${innerCard}`}>
                  <Music2 className={`w-4 h-4 ${sub}`} />
                </div>
                <h3 className={`text-[20px] font-semibold ${text}`}>음역대 비교</h3>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                <span className="rounded-full border border-[#ffbf59]/30 px-2.5 py-0.5 text-[11px] text-[#ffcf7d]">곡 음역대</span>
                <span className="rounded-full border border-[#63c8ff]/30 px-2.5 py-0.5 text-[11px] text-[#9edfff]">내 음역대</span>
                <span className="rounded-full border border-[#00d9b1]/30 px-2.5 py-0.5 text-[11px] text-[#00d9b1]">겹치는 구간</span>
              </div>

              <div className={`rounded-xl border ${border} ${innerCard} p-4 mb-5`}>
                <div className="relative h-[120px] rounded-xl border border-black/15 overflow-hidden bg-gradient-to-b from-white to-[#f0f0f0]">
                  <div className="absolute inset-0 flex">
                    {whiteKeys.map((whiteMidi, index) => {
                      const whiteInSong = inRange(whiteMidi, songMin, songMax);
                      const whiteInUser = inRange(whiteMidi, userMin, userMax);
                      const blackMidi = whiteMidi + 1;
                      const blackInSong = hasBlackKeyToRight(whiteMidi) && inRange(blackMidi, songMin, songMax);
                      const blackInUser = hasBlackKeyToRight(whiteMidi) && inRange(blackMidi, userMin, userMax);
                      return (
                        <div key={`white-${whiteMidi}`} className={`relative flex-1 border-r last:border-r-0 border-black/15 ${keyClass(whiteInSong, whiteInUser, false)}`}>
                          {hasBlackKeyToRight(whiteMidi) && index < whiteKeys.length - 1 && (
                            <span className={`absolute right-0 top-0 translate-x-1/2 z-10 h-[72px] w-[54%] rounded-b-md border border-black/50 shadow-[0_7px_10px_rgba(0,0,0,0.35)] ${keyClass(blackInSong, blackInUser, true)}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className={`mt-3 flex justify-between text-[11px] ${sub}`}><span>C2</span><span>C4</span><span>C6</span></div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 mb-4">
                <div className={`rounded-xl border ${border} ${innerCard} p-4`}>
                  <p className={`text-[12px] ${sub}`}>곡 음역대</p>
                  <p className={`mt-1 text-[20px] font-semibold ${text}`}>{hasSongRange ? `${midiToNoteName(songMin)} ~ ${midiToNoteName(songMax)}` : "정보 없음"}</p>
                </div>
                <div className={`rounded-xl border ${border} ${innerCard} p-4`}>
                  <p className={`text-[12px] ${sub}`}>내 음역대</p>
                  <p className={`mt-1 text-[20px] font-semibold ${text}`}>{hasUserRange ? `${midiToNoteName(userMin)} ~ ${midiToNoteName(userMax)}` : "아직 측정 전"}</p>
                </div>
              </div>

              <div className={`rounded-xl border ${border} ${innerCard} p-5`}>
                <div className="flex items-center gap-2 mb-3">
                  <UserRound className={`h-4 w-4 ${sub}`} />
                  <p className={`text-[16px] font-semibold ${text}`}>비교 해석</p>
                </div>
                {!hasUserRange ? (
                  <p className={`text-[14px] leading-7 ${sub}`}>내 음역대 데이터가 아직 없습니다. 먼저 음역대 테스트를 완료해주세요.</p>
                ) : (
                  <div className="space-y-1.5">
                    <p className={`text-[14px] leading-7 ${sub}`}>
                      {hasOverlap ? `겹치는 구간은 ${midiToNoteName(overlapMin)} ~ ${midiToNoteName(overlapMax)}입니다.` : "현재 측정값 기준으로는 겹치는 구간이 거의 없습니다."}
                    </p>
                    {userId === null ? (
                      <p className={`text-[14px] leading-7 ${sub}`}>로그인하면 추천 전조를 확인할 수 있습니다.</p>
                    ) : !hasSongRange ? (
                      <p className={`text-[14px] leading-7 ${sub}`}>곡 음역대 정보가 없어 추천 전조를 계산할 수 없습니다.</p>
                    ) : transposeError ? (
                      <p className={`text-[14px] leading-7 ${sub}`}>추천 전조를 불러오지 못했습니다.</p>
                    ) : transpose === null ? (
                      <p className={`text-[14px] leading-7 ${sub}`}>추천 전조를 계산하는 중입니다…</p>
                    ) : recommendedShift === null ? (
                      <p className={`text-[14px] leading-7 ${sub}`}>{transpose.message}</p>
                    ) : (
                      <>
                        <p className={`text-[14px] leading-7 ${sub}`}>
                          추천 전조는{" "}
                          <span className="font-semibold text-[#00d9b1]">{formatShift(recommendedShift)}키</span>입니다.
                          {shiftNotice && <span className="ml-1 text-[12px]">({shiftNotice})</span>}
                        </p>
                        <p className={`text-[14px] leading-7 ${sub}`}>{transpose.message}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* 반주 이동 */}
            <section className={`rounded-2xl border ${border} ${card} p-6`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`text-[17px] font-semibold ${text}`}>반주 재생으로 이어가기</p>
                  <p className={`mt-1 text-[13px] ${sub}`}>
                    선택한 곡을 반주 페이지에서 바로 불러옵니다
                    {recommendedShift !== null ? ` · 추천 ${formatShift(recommendedShift)}키` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onGoAccompaniment}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#00d9b1] text-white text-[14px] font-semibold shadow-lg shadow-[#00d9b1]/20 hover:shadow-[#00d9b1]/40 hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 flex-shrink-0"
                >
                  <PlayCircle className="h-4 w-4" />
                  반주 페이지로 이동
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
