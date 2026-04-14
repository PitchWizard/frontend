import { useState } from "react";
import { AlertCircle, ArrowLeft, Loader2, Music2, Search } from "lucide-react";
import { getSongCatalog } from "./api/songApi";

type Props = {
  onBack: () => void;
  isDarkMode: boolean;
  onSelectSong?: (song: SongItem) => void;
};

type SongItem = {
  id: string | number;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  key?: string;
  coverUrl?: string;
  midiMin?: number | null;
  midiMedian?: number | null;
  midiMax?: number | null;
  rmsMean?: number | null;
  rmsStd?: number | null;
};

const MOCK_SONGS: SongItem[] = [
  { id: "mock-1", title: "Love wins all", artist: "아이유", album: "The Winning", duration: "4:31", midiMin: 54, midiMedian: 65, midiMax: 79 },
  { id: "mock-2", title: "밤편지", artist: "아이유", album: "Palette", duration: "4:14", midiMin: 52, midiMedian: 62, midiMax: 74 },
  { id: "mock-3", title: "사건의 지평선", artist: "윤하", album: "YOUNHA 6th", duration: "5:00", midiMin: 55, midiMedian: 66, midiMax: 80 },
  { id: "mock-4", title: "주저하는 연인들을 위해", artist: "잔나비", album: "전설", duration: "4:25", midiMin: 49, midiMedian: 60, midiMax: 71 },
  { id: "mock-5", title: "Super Shy", artist: "NewJeans", album: "Get Up", duration: "2:35", midiMin: 57, midiMedian: 64, midiMax: 74 },
  { id: "mock-6", title: "Hype Boy", artist: "NewJeans", album: "New Jeans", duration: "2:59", midiMin: 56, midiMedian: 64, midiMax: 75 },
  { id: "mock-7", title: "너의 모든 순간", artist: "성시경", album: "별에서 온 그대 OST", duration: "4:05", midiMin: 45, midiMedian: 55, midiMax: 67 },
  { id: "mock-8", title: "좋니", artist: "윤종신", album: "LISTEN 010", duration: "6:10", midiMin: 46, midiMedian: 56, midiMax: 68 },
  { id: "mock-9", title: "밤양갱", artist: "비비", album: "밤양갱", duration: "2:26", midiMin: 53, midiMedian: 61, midiMax: 72 },
];

function midiToNoteName(midi: number) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const rounded = Math.round(midi);
  const octave = Math.floor(rounded / 12) - 1;
  return `${names[((rounded % 12) + 12) % 12]}${octave}`;
}

function formatRangeLabel(song: SongItem) {
  const min = song.midiMin;
  const max = song.midiMax;
  if (typeof min === "number" && typeof max === "number") {
    return `${midiToNoteName(min)} ~ ${midiToNoteName(max)}`;
  }
  return song.key ? `키 ${song.key}` : "";
}

export default function SearchPage({ onBack, isDarkMode, onSelectSong }: Props) {
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<SongItem[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const bgColor = isDarkMode ? "bg-[#1f1f1f]/60" : "bg-[#f8f7f9]/60";
  const textColor = isDarkMode ? "text-white" : "text-[#1f1f1f]";
  const subTextColor = isDarkMode ? "text-white/70" : "text-[#1f1f1f]/70";
  const border = isDarkMode ? "border-white/10" : "border-[#1f1f1f]/10";
  const headerBg = isDarkMode ? "bg-[#1f1f1f]/90" : "bg-[#f8f7f9]/90";
  const inputBg = isDarkMode ? "bg-white/10" : "bg-white/70";
  const placeholderColor = isDarkMode ? "placeholder:text-white/40" : "placeholder:text-black/40";
  const cardBg = isDarkMode ? "bg-white/5" : "bg-[#1f1f1f]/5";

  function filterByKeyword(list: SongItem[], keyword: string) {
    const q = keyword.toLowerCase();
    return list.filter((song) => {
      const title = song.title.toLowerCase();
      const artist = song.artist.toLowerCase();
      return title.includes(q) || artist.includes(q);
    });
  }

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const keyword = query.trim();
    if (!keyword) {
      setError("검색어를 입력해 주세요.");
      setNotice("");
      setHasSearched(false);
      setSongs([]);
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    setHasSearched(true);
    try {
      let source = catalog;
      if (!catalogLoaded) {
        source = await getSongCatalog();
        setCatalog(source);
        setCatalogLoaded(true);
      }
      setSongs(filterByKeyword(source, keyword));
    } catch (err: any) {
      const fallback = filterByKeyword(MOCK_SONGS, keyword);
      if (fallback.length > 0) {
        setSongs(fallback);
        setNotice("백엔드 연결이 없어 샘플 데이터로 표시 중입니다.");
        setError("");
      } else {
        setSongs([]);
        setError(err?.response?.data?.detail || "곡 목록 조회에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`min-h-screen relative bg-cover bg-center bg-fixed bg-no-repeat ${bgColor}`}
      style={{
        backgroundImage:
          "url('https://cdn.pixabay.com/photo/2022/07/10/01/47/grades-7312021_1280.jpg')",
      }}
    >
      {/* Background overlay */}
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

        <main className="pt-40 px-6 md:px-10 pb-20">
          <div className="w-[92%] max-w-[1320px] mx-auto">
            <div className="text-center">
              <h2 className={`text-[38px] font-bold ${textColor}`}>노래 찾기</h2>
              <p className={`mt-4 text-[16px] ${subTextColor}`}>
                내 음역대에 맞는 노래를 찾아보세요
              </p>
            </div>

            <div className="mt-12 flex justify-center">
              <form
                onSubmit={handleSearch}
                className={`group w-full max-w-[1160px] rounded-[24px] border ${border} px-2 backdrop-blur-xl transition-all duration-300 ${
                  isDarkMode
                    ? "bg-white/8 shadow-[0_14px_38px_rgba(0,0,0,0.35)]"
                    : "bg-white/88 shadow-[0_14px_38px_rgba(0,0,0,0.10)]"
                }`}
              >
                <div className="flex items-center gap-4 px-5 py-3.5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                      isDarkMode ? "bg-white/10" : "bg-black/5"
                    }`}
                  >
                    <Search className={`w-5 h-5 ${subTextColor}`} />
                  </div>

                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="노래 제목이나 가수를 검색해보세요"
                    className={`w-full bg-transparent outline-none border-none text-[16px] md:text-[17px] ${textColor} ${placeholderColor}`}
                  />
                </div>
              </form>
            </div>

            {hasSearched && error ? (
              <div
                className={`mx-auto mt-6 flex w-full max-w-[1160px] items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200`}
              >
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            ) : null}

            {hasSearched && notice ? (
              <div
                className={`mx-auto mt-4 flex w-full max-w-[1160px] items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                  isDarkMode
                    ? "border-amber-300/25 bg-amber-400/10 text-amber-200"
                    : "border-amber-500/30 bg-amber-100/70 text-amber-800"
                }`}
              >
                <AlertCircle className="h-4 w-4" />
                <span>{notice}</span>
              </div>
            ) : null}

            <section className="mx-auto mt-8 w-full max-w-[1160px]">
              {hasSearched && loading ? (
                <div className={`rounded-2xl border ${border} ${cardBg} px-5 py-12 text-center`}>
                  <Loader2 className={`mx-auto h-6 w-6 animate-spin ${subTextColor}`} />
                  <p className={`mt-3 text-sm ${subTextColor}`}>곡 목록을 불러오는 중입니다...</p>
                </div>
              ) : null}

              {!hasSearched && !loading ? (
                <div className={`rounded-2xl border ${border} ${cardBg} px-5 py-12 text-center`}>
                  <p className={`text-sm ${subTextColor}`}>노래 제목 또는 가수를 입력하고 검색해 주세요.</p>
                </div>
              ) : null}

              {hasSearched && !loading && songs.length === 0 && !error ? (
                <div className={`rounded-2xl border ${border} ${cardBg} px-5 py-12 text-center`}>
                  <p className={`text-sm ${subTextColor}`}>검색 결과가 없습니다.</p>
                </div>
              ) : null}

              {hasSearched && !loading && songs.length > 0 ? (
                <div className="space-y-3">
                  <p className={`text-sm ${subTextColor}`}>총 {songs.length}곡</p>
                  {songs.map((song) => (
                    <button
                      type="button"
                      onClick={() => onSelectSong?.(song)}
                      key={song.id}
                      className={`w-full text-left rounded-2xl border ${border} ${cardBg} p-6 backdrop-blur-sm transition-colors ${
                        isDarkMode ? "hover:bg-white/10" : "hover:bg-[#1f1f1f]/10"
                      }`}
                    >
                      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                        <div className="flex min-w-0 items-center gap-4">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                              isDarkMode ? "bg-white/10" : "bg-[#1f1f1f]/10"
                            }`}
                          >
                            <Music2 className={`h-5 w-5 ${textColor}`} />
                          </div>
                          <div className="min-w-0">
                            <p className={`truncate text-[18px] font-semibold ${textColor}`}>
                              {song.title}
                            </p>
                            <p className={`truncate text-sm ${subTextColor}`}>{song.artist}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 md:justify-end">
                          {formatRangeLabel(song) ? (
                            <span className="rounded-full border border-[#00d9b1]/35 px-3 py-1 text-xs text-[#00e5be]">
                              음역 {formatRangeLabel(song)}
                            </span>
                          ) : null}
                          {typeof song.midiMedian === "number" ? (
                            <span
                              className={`rounded-full border ${border} px-3 py-1 text-xs ${subTextColor}`}
                            >
                              중앙 {midiToNoteName(song.midiMedian)}
                            </span>
                          ) : null}
                          {song.album ? (
                            <span
                              className={`rounded-full border ${border} px-3 py-1 text-xs ${subTextColor}`}
                            >
                              앨범 {song.album}
                            </span>
                          ) : null}
                          {song.duration ? (
                            <span
                              className={`rounded-full border ${border} px-3 py-1 text-xs ${subTextColor}`}
                            >
                              재생 {song.duration}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
