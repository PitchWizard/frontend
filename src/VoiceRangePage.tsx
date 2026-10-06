import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, Mic2, Music2, UserRound } from "lucide-react";
import axios from "axios";
import { getSongCatalog } from "./api/songApi";
import { clampToAccompanimentRange } from "./SongDetailPage.tsx";

const BASE_URL = "http://127.0.0.1:8000";

function midiToNote(midi: number): string {
  const names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  return names[midi % 12] + (Math.floor(midi / 12) - 1);
}

type Props = {
  onBack: () => void;
  isDarkMode: boolean;
  user: any;
  onSelectSinger?: (name: string) => void;
  onSelectSong?: (song: any) => void;
};

const whiteKeys = [
  "C3","D3","E3","F3","G3","A3","B3",
  "C4","D4","E4","F4","G4","A4","B4",
  "C5","D5","E5","F5","G5","A5","B5","C6",
];

function getNoteWhiteIndex(note: string): number {
  return whiteKeys.indexOf(note);
}

type SimilarSinger = { name: string; range: string; overlap: string };

// GET /songs/recommend 응답 항목 (서버가 부르기 어려운 곡은 이미 제외)
type RecommendedSong = { song_id: number; title: string; artist: string; recommended_shift: number; message: string };

export default function VoiceRangePage({ onBack, isDarkMode, user, onSelectSinger, onSelectSong }: Props) {
  const lowNote: string | null = user?.low_note ?? null;
  const highNote: string | null = user?.high_note ?? null;
  const rangeStartWhiteIndex = lowNote ? getNoteWhiteIndex(lowNote) : -1;
  const rangeEndWhiteIndex = highNote ? getNoteWhiteIndex(highNote) : -1;
  const hasMeasured = lowNote && highNote;
  // 진성 최고음이 저장돼 있으면 그 위(최고음까지)는 가성 구간으로 표시
  const chestNote: string | null = user?.chest_high_note ?? null;
  const chestEndIndex = chestNote ? getNoteWhiteIndex(chestNote) : -1;
  const hasChest = hasMeasured && chestEndIndex >= rangeStartWhiteIndex && chestEndIndex < rangeEndWhiteIndex;

  const [similarSingers, setSimilarSingers] = useState<SimilarSinger[]>([]);

  useEffect(() => {
    if (!user?.midi_median) return;
    axios.get(`${BASE_URL}/songs`).then((res) => {
      const artistMap = new Map<string, number[]>();
      for (const s of res.data) {
        if (!s.artist || !s.midi_median) continue;
        if (!artistMap.has(s.artist)) artistMap.set(s.artist, []);
        artistMap.get(s.artist)!.push(s.midi_median);
      }
      const artists = Array.from(artistMap.entries()).map(([name, medians]) => ({
        name,
        avg: medians.reduce((a, b) => a + b, 0) / medians.length,
      }));
      const sorted = artists
        .filter((a) => Math.abs(a.avg - user.midi_median) <= 3)
        .sort((a, b) => Math.abs(a.avg - user.midi_median) - Math.abs(b.avg - user.midi_median))
        .slice(0, 6);
      setSimilarSingers(sorted.map((a) => ({
        name: a.name,
        range: `중앙음 ${midiToNote(Math.round(a.avg))}`,
        overlap: `음역 중심이 ${Math.abs(Math.round(a.avg - user.midi_median))} 반음 차이`,
      })));
    }).catch(() => {});
  }, [user?.midi_median]);

  // 내 음역에 맞는 곡 (US-34): 측정 기록이 있을 때만 서버에 요청
  const userId = user?.id ?? null;
  const hasUserRange = user?.midi_min > 0 && user?.midi_max > 0;
  const [recommendedSongs, setRecommendedSongs] = useState<RecommendedSong[]>([]);
  const [recommendStatus, setRecommendStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function fetchRecommendations() {
    setRecommendStatus("loading");
    try {
      const res = await axios.get(`${BASE_URL}/songs/recommend`, { params: { user_id: userId } });
      const list: RecommendedSong[] = Array.isArray(res.data) ? res.data : [];
      setRecommendedSongs([...list].sort((a, b) => Math.abs(a.recommended_shift) - Math.abs(b.recommended_shift)));
      setRecommendStatus("done");
    } catch {
      setRecommendedSongs([]);
      setRecommendStatus("error");
    }
  }

  useEffect(() => {
    if (userId === null || !hasUserRange) return;
    fetchRecommendations();
  }, [userId, hasUserRange]);

  // 검색 화면과 같은 곡 정보(getSongCatalog)로 곡 상세 화면에 넘긴다
  async function openSongDetail(rec: RecommendedSong) {
    let song: any = null;
    try {
      const catalog = await getSongCatalog();
      song = catalog.find((s: any) => String(s.id) === String(rec.song_id)) ?? null;
    } catch { /* 목록을 못 불러오면 추천 결과만으로 이동 */ }
    onSelectSong?.(song ?? { id: rec.song_id, title: rec.title, artist: rec.artist });
  }

  const dark = isDarkMode;
  const bg = dark ? "bg-[#0a0a0a]" : "bg-[#f5f5f7]";
  const text = dark ? "text-white" : "text-[#1d1d1f]";
  const sub = dark ? "text-white/50" : "text-[#1d1d1f]/50";
  const card = dark ? "bg-white/[0.04]" : "bg-black/[0.03]";
  const cardHover = dark ? "hover:bg-white/[0.07]" : "hover:bg-black/[0.06]";
  const border = dark ? "border-white/[0.08]" : "border-black/[0.08]";
  const innerCard = dark ? "bg-white/[0.03]" : "bg-black/[0.02]";

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
              Voice Range Result
            </div>
            <h2 className={`text-[52px] font-bold leading-[1.05] tracking-tight ${text} mb-4`}>
              나의 음역대를<br />
              <span className="text-[#00d9b1]">확인하세요</span>
            </h2>
            <p className={`text-[16px] ${sub} leading-relaxed max-w-md mx-auto`}>
              테스트 결과와 유사 음역대 가수를 한눈에 볼 수 있습니다
            </p>
          </div>

          <div className="space-y-4">
            {/* 테스트 결과 */}
            <section className={`rounded-2xl border ${border} ${card} p-7`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${border} ${innerCard}`}>
                  <BarChart3 className={`w-4 h-4 ${sub}`} />
                </div>
                <h3 className={`text-[20px] font-semibold ${text}`}>음역대 테스트 결과</h3>
              </div>

              <div className={`rounded-xl border ${border} ${innerCard} p-6 mb-4`}>
                <p className={`text-[12px] tracking-wide ${sub} mb-2`}>음역대 범위</p>
                <p className={`text-[48px] font-bold leading-none ${text}`}>
                  {hasMeasured ? `${lowNote} ~ ${highNote}` : "미측정"}
                </p>

                <div className={`mt-5 rounded-xl border ${border} ${dark ? "bg-black/30" : "bg-white/80"} p-4`}>
                  <div className="relative h-[110px] rounded-xl border border-black/15 overflow-hidden bg-gradient-to-b from-white to-[#f0f0f0]">
                    <div className="absolute inset-0 flex">
                      {whiteKeys.map((note, index) => {
                        const inRange = index >= rangeStartWhiteIndex && index <= rangeEndWhiteIndex;
                        const isFalsetto = hasChest && index > chestEndIndex;
                        const blackInRange = inRange && index + 1 >= rangeStartWhiteIndex && index + 1 <= rangeEndWhiteIndex;
                        const blackIsFalsetto = hasChest && index >= chestEndIndex;
                        const noteHead = note[0];
                        const hasBlackRight = noteHead !== "E" && noteHead !== "B";
                        const whiteClass = !inRange
                          ? "bg-gradient-to-b from-white to-[#ececec] border-black/15"
                          : isFalsetto
                            ? "bg-gradient-to-b from-[#e6dcff] to-[#c8b6ff] border-black/20"
                            : "bg-gradient-to-b from-[#b8ffef] to-[#83f5d8] border-black/20";
                        const blackClass = !blackInRange
                          ? "bg-gradient-to-b from-[#262626] to-black"
                          : blackIsFalsetto
                            ? "bg-gradient-to-b from-[#a98bff] to-[#7b5cf0]"
                            : "bg-gradient-to-b from-[#00f3c8] to-[#00b894]";
                        return (
                          <div
                            key={note}
                            className={`relative flex-1 border-r last:border-r-0 ${whiteClass}`}
                          >
                            {hasBlackRight && index < whiteKeys.length - 1 && (
                              <span className={`absolute right-0 top-0 translate-x-1/2 z-10 h-[66px] w-[54%] rounded-b-md border border-black/50 shadow-[0_7px_10px_rgba(0,0,0,0.35)] ${blackClass}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className={`mt-3 flex justify-between text-[11px] ${sub}`}>
                    <span>C3</span>
                    <span className="text-[#00d9b1] font-semibold">{hasMeasured ? `${lowNote} ~ ${highNote}` : "미측정"}</span>
                    <span>C6</span>
                  </div>
                  {hasChest && (
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      <span className="rounded-full border border-[#00d9b1]/30 px-2.5 py-0.5 text-[11px] text-[#00d9b1]">진성 {lowNote} ~ {chestNote}</span>
                      <span className="rounded-full border border-[#a98bff]/40 px-2.5 py-0.5 text-[11px] text-[#b9a2ff]">가성 ~ {highNote}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={`rounded-xl border ${border} ${innerCard} p-5`}>
                <div className="flex items-center gap-2 mb-3">
                  <Mic2 className={`w-4 h-4 ${sub}`} />
                  <p className={`text-[16px] font-semibold ${text}`}>음역 해석</p>
                </div>
                {hasMeasured ? (
                  <p className={`text-[15px] leading-7 ${sub}`}>
                    최저음 <span className="text-[#00d9b1] font-semibold">{lowNote}</span>부터
                    최고음 <span className="text-[#00d9b1] font-semibold">{highNote}</span>까지 측정되었습니다.
                    {hasChest
                      ? <> 진성은 <span className="text-[#00d9b1] font-semibold">{chestNote}</span>까지이며, 곡 추천은 진성 음역을 기준으로 합니다.</>
                      : " 가성 구분을 하지 않아 가성을 포함한 최고음으로 곡을 추천합니다."}
                  </p>
                ) : (
                  <p className={`text-[15px] leading-7 ${sub}`}>
                    아직 음역대 테스트를 완료하지 않았습니다. 홈으로 돌아가 테스트를 진행해주세요.
                  </p>
                )}
              </div>
            </section>

            {/* 유사 음역대 가수 */}
            <section className={`rounded-2xl border ${border} ${card} p-7`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${border} ${innerCard}`}>
                  <UserRound className={`w-4 h-4 ${sub}`} />
                </div>
                <h3 className={`text-[20px] font-semibold ${text}`}>유사 음역대 가수</h3>
              </div>

              {similarSingers.length === 0 ? (
                <p className={`text-[13px] ${sub}`}>
                  {user?.midi_median ? "유사한 음역대의 가수가 없습니다." : "음역대 테스트를 완료하면 유사한 가수를 확인할 수 있습니다."}
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {similarSingers.map((singer) => (
                    <button
                      key={singer.name}
                      type="button"
                      onClick={() => onSelectSinger?.(singer.name)}
                      className={`text-left rounded-xl border ${border} ${innerCard} px-5 py-4 flex items-start gap-3 transition-all ${cardHover} hover:border-[#00d9b1]/20 group`}
                    >
                      <div className="mt-1 h-8 w-0.5 rounded-full bg-gradient-to-b from-[#00d9b1] to-[#00b894] flex-shrink-0" />
                      <div className="min-w-0">
                        <p className={`text-[16px] font-semibold ${text} group-hover:text-[#00d9b1] transition-colors`}>{singer.name}</p>
                        <p className="text-[#00d9b1] text-[12px] mt-1">{singer.range}</p>
                        <p className={`mt-1.5 text-[12px] ${sub}`}>{singer.overlap}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* 내 음역에 맞는 곡 */}
            <section className={`rounded-2xl border ${border} ${card} p-7`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${border} ${innerCard}`}>
                  <Music2 className={`w-4 h-4 ${sub}`} />
                </div>
                <h3 className={`text-[20px] font-semibold ${text}`}>내 음역에 맞는 곡</h3>
              </div>

              {userId === null ? (
                <p className={`text-[13px] ${sub}`}>로그인하면 맞춤 곡을 확인할 수 있습니다.</p>
              ) : !hasUserRange ? (
                <p className={`text-[13px] ${sub}`}>음역대 테스트를 완료하면 맞춤 곡을 확인할 수 있습니다.</p>
              ) : recommendStatus === "loading" || recommendStatus === "idle" ? (
                <p className={`text-[13px] ${sub}`}>맞춤 곡을 불러오는 중입니다…</p>
              ) : recommendStatus === "error" ? (
                <p className={`text-[13px] ${sub}`}>맞춤 곡을 불러오지 못했습니다.</p>
              ) : recommendedSongs.length === 0 ? (
                <p className={`text-[13px] ${sub}`}>추천할 곡이 없습니다.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {recommendedSongs.map((rec) => {
                    const shift = clampToAccompanimentRange(rec.recommended_shift);
                    return (
                      <button
                        key={rec.song_id}
                        type="button"
                        onClick={() => openSongDetail(rec)}
                        className={`text-left rounded-xl border ${border} ${innerCard} px-5 py-4 flex items-start gap-3 transition-all ${cardHover} hover:border-[#00d9b1]/20 group`}
                      >
                        <div className="mt-1 h-8 w-0.5 rounded-full bg-gradient-to-b from-[#00d9b1] to-[#00b894] flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-[16px] font-semibold ${text} group-hover:text-[#00d9b1] transition-colors`}>{rec.title}</p>
                          <p className={`truncate mt-1 text-[12px] ${sub}`}>{rec.artist}</p>
                          <p className="text-[#00d9b1] text-[12px] mt-1.5">
                            {shift === 0 ? "원키 추천" : `추천 키 ${shift > 0 ? `+${shift}` : shift}`}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
