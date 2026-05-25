import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, Mic2, UserRound } from "lucide-react";
import axios from "axios";

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

export default function VoiceRangePage({ onBack, isDarkMode, user, onSelectSinger }: Props) {
  const lowNote: string | null = user?.low_note ?? null;
  const highNote: string | null = user?.high_note ?? null;
  const rangeStartWhiteIndex = lowNote ? getNoteWhiteIndex(lowNote) : -1;
  const rangeEndWhiteIndex = highNote ? getNoteWhiteIndex(highNote) : -1;
  const hasMeasured = lowNote && highNote;

  const [similarSingers, setSimilarSingers] = useState<SimilarSinger[]>([]);

  useEffect(() => {
    if (!user?.midi_median) return;
    axios.get(`${BASE_URL}/songs`).then((res) => {
      // 아티스트별 midi_median 평균
      const artistMap = new Map<string, number[]>();
      for (const s of res.data) {
        if (!s.artist || !s.midi_median) continue;
        if (!artistMap.has(s.artist)) artistMap.set(s.artist, []);
        artistMap.get(s.artist)!.push(s.midi_median);
      }
      const artists = Array.from(artistMap.entries()).map(([name, medians]) => {
        const avg = medians.reduce((a, b) => a + b, 0) / medians.length;
        return { name, avg };
      });
      // 유저 midi_median과 차이가 작은 순 정렬, 상위 6명
      const sorted = artists
        .sort((a, b) => Math.abs(a.avg - user.midi_median) - Math.abs(b.avg - user.midi_median))
        .slice(0, 6);
      setSimilarSingers(sorted.map((a) => ({
        name: a.name,
        range: `중앙음 ${midiToNote(Math.round(a.avg))}`,
        overlap: `음역 중심이 ${Math.abs(Math.round(a.avg - user.midi_median))} 반음 차이`,
      })));
    }).catch(() => {});
  }, [user?.midi_median]);

  const bgColor = isDarkMode ? "bg-[#1f1f1f]/60" : "bg-[#f8f7f9]/60";
  const textColor = isDarkMode ? "text-white" : "text-[#1f1f1f]";
  const subTextColor = isDarkMode ? "text-white/70" : "text-[#1f1f1f]/70";
  const border = isDarkMode ? "border-white/10" : "border-[#1f1f1f]/10";
  const headerBg = isDarkMode ? "bg-[#1f1f1f]/90" : "bg-[#f8f7f9]/90";
  const cardBg = isDarkMode ? "bg-white/8" : "bg-white/82";
  const mutedCardBg = isDarkMode ? "bg-white/5" : "bg-[#1f1f1f]/5";

  return (
    <div
      className={`min-h-screen relative bg-cover bg-center bg-fixed bg-no-repeat ${bgColor}`}
      style={{
        backgroundImage:
          "url('https://cdn.pixabay.com/photo/2022/07/10/01/47/grades-7312021_1280.jpg')",
      }}
    >
      <div
        className={`absolute inset-0 backdrop-blur-md ${
          isDarkMode ? "bg-black/80" : "bg-white/60"
        }`}
      />

      <div className="relative z-10 min-h-screen flex flex-col font-['Pretendard']">
        <header
          className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b ${border} ${headerBg}`}
        >
          <div className="w-[85%] mx-auto px-12 py-6 flex items-center justify-between">
            <button
              onClick={onBack}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? "hover:bg-white/10" : "hover:bg-[#1f1f1f]/10"
              }`}
              aria-label="뒤로 가기"
            >
              <ArrowLeft className={`w-6 h-6 ${textColor}`} />
            </button>

            <h1 className={`font-['Pretendard'] text-[22px] font-thin tracking-wide ${textColor}`}>
              PitchWizard
            </h1>

            <div className="w-8" />
          </div>
        </header>

        <main className="flex-1 px-6 md:px-10 pt-36 pb-16">
          <div className="w-[85%] max-w-[1180px] mx-auto">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.28em] text-[#00d9b1]">Voice Range Result</p>
              <h2 className={`mt-4 text-[50px] md:text-[52px] font-bold leading-[1.04] ${textColor}`}>
                나의 음역대
              </h2>
            </div>


            <div className="mt-8 space-y-6">
              <section className={`rounded-[30px] border ${border} ${cardBg} p-7 md:p-8 backdrop-blur-xl`}>
                <div className="flex items-center gap-3">
                  <BarChart3 className={`w-5 h-5 ${textColor}`} />
                  <h3 className={`text-[20px] font-semibold ${textColor}`}>음역대 테스트 결과</h3>
                </div>

                <div className={`mt-6 rounded-2xl border ${border} ${mutedCardBg} p-6 md:p-7`}>
                  <p className={`text-[14px] tracking-wide ${subTextColor}`}>음역대 범위</p>
                  <p className={`mt-2 text-[54px] md:text-[70px] font-bold leading-none ${textColor}`}>
                    {hasMeasured ? `${lowNote} ~ ${highNote}` : "미측정"}
                  </p>

                  <div
                    className={`mt-5 rounded-2xl border ${border} ${
                      isDarkMode ? "bg-black/30" : "bg-white/80"
                    } p-4`}
                  >
                    <div className="relative h-[120px] rounded-xl border border-black/15 overflow-hidden bg-gradient-to-b from-white to-[#f0f0f0]">
                      <div className="absolute inset-0 flex">
                        {whiteKeys.map((note, index) => {
                          const inRange =
                            index >= rangeStartWhiteIndex && index <= rangeEndWhiteIndex;
                          const noteHead = note[0];
                          const hasBlackRight = noteHead !== "E" && noteHead !== "B";
                          return (
                            <div
                              key={note}
                              className={`relative flex-1 border-r last:border-r-0 ${
                                inRange
                                  ? "bg-gradient-to-b from-[#b8ffef] to-[#83f5d8] border-black/20"
                                  : "bg-gradient-to-b from-white to-[#ececec] border-black/15"
                              }`}
                            >
                              {hasBlackRight && index < whiteKeys.length - 1 ? (
                                <span
                                  className={`absolute right-0 top-0 translate-x-1/2 z-10 h-[66px] w-[54%] rounded-b-md border border-black/50 shadow-[0_7px_10px_rgba(0,0,0,0.35)] ${
                                    inRange &&
                                    index + 1 >= rangeStartWhiteIndex &&
                                    index + 1 <= rangeEndWhiteIndex
                                      ? "bg-gradient-to-b from-[#00f3c8] to-[#00b894]"
                                      : "bg-gradient-to-b from-[#262626] to-black"
                                  }`}
                                />
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className={`mt-3 flex justify-between text-[13px] ${subTextColor}`}>
                      <span>C3</span>
                      <span className="text-[#00efc4] font-semibold">
                        {hasMeasured ? `${lowNote} ~ ${highNote}` : "미측정"}
                      </span>
                      <span>C6</span>
                    </div>
                  </div>
                </div>

                <div className={`mt-6 rounded-2xl border ${border} ${mutedCardBg} p-6`}>
                  <div className="flex items-center gap-2">
                    <Mic2 className={`w-5 h-5 ${textColor}`} />
                    <p className={`text-[20px] font-semibold ${textColor}`}>음역 해석</p>
                  </div>
                  {hasMeasured ? (
                    <p className={`mt-3 text-[20px] leading-8 ${subTextColor} font-light`}>
                      최저음 <span className="text-[#00efc4] font-semibold">{lowNote}</span>부터
                      최고음 <span className="text-[#00efc4] font-semibold">{highNote}</span>까지
                      측정되었습니다.
                    </p>
                  ) : (
                    <p className={`mt-3 text-[20px] leading-8 ${subTextColor} font-light`}>
                      아직 음역대 테스트를 완료하지 않았습니다.
                      홈으로 돌아가 테스트를 진행해주세요.
                    </p>
                  )}
                </div>
              </section>

              <section className={`rounded-[30px] border ${border} ${cardBg} p-7 md:p-8 backdrop-blur-xl`}>
                <div className="flex items-center gap-3">
                  <UserRound className={`w-5 h-5 ${textColor}`} />
                  <h3 className={`text-[24px] font-semibold ${textColor}`}>유사 음역대 가수</h3>
                </div>

                <div className="mt-5 px-1 md:px-2 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {similarSingers.map((singer) => (
                    <button
                      key={singer.name}
                      type="button"
                      onClick={() => onSelectSinger?.(singer.name)}
                      className={`text-left rounded-2xl border ${border} ${mutedCardBg} px-5 py-4 md:px-6 md:py-5 flex items-start gap-3 shadow-lg shadow-black/10 transition-colors ${isDarkMode ? "hover:bg-white/10" : "hover:bg-[#1f1f1f]/10"}`}
                    >
                      <div className="mt-0.5 h-9 w-1 rounded-full bg-gradient-to-b from-[#00efc4] to-[#00b894]" />
                      <div className="min-w-0">
                        <p className={`text-[18px] font-semibold ${textColor}`}>{singer.name}</p>
                        <p className="text-[#00efc4] text-[14px] mt-1">{singer.range}</p>
                        <p className={`mt-2 text-[14px] leading-6 ${subTextColor}`}>{singer.overlap}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
