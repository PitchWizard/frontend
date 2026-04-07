import { useState } from "react";
import { ArrowLeft, Search } from "lucide-react";

type Props = {
  onBack: () => void;
  isDarkMode: boolean;
};

export default function SearchPage({ onBack, isDarkMode }: Props) {
  const [query, setQuery] = useState("");

  const bgColor = isDarkMode ? "bg-[#1f1f1f]/60" : "bg-[#f8f7f9]/60";
  const textColor = isDarkMode ? "text-white" : "text-[#1f1f1f]";
  const subTextColor = isDarkMode ? "text-white/70" : "text-[#1f1f1f]/70";
  const border = isDarkMode ? "border-white/10" : "border-[#1f1f1f]/10";
  const headerBg = isDarkMode ? "bg-[#1f1f1f]/90" : "bg-[#f8f7f9]/90";
  const inputBg = isDarkMode ? "bg-white/10" : "bg-black/5";
  const placeholderColor = isDarkMode ? "placeholder:text-white/40" : "placeholder:text-black/40";

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

      <div className="relative z-10 min-h-screen flex flex-col">
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

        <main className="pt-40 px-10 pb-20">
          <div className="w-[85%] mx-auto">
            <div className="text-center">
              <h2 className={`font-['Pretendard'] text-[38px] font-bold ${textColor}`}>
                노래 찾기
              </h2>
              <p className={`mt-4 font-['Pretendard'] text-[16px] ${subTextColor}`}>
                내 음역대에 맞는 노래를 찾아보세요
              </p>
            </div>

            <div className="mt-12 flex justify-center">
              <div
                className={`w-full max-w-4xl rounded-2xl border ${border} ${inputBg} backdrop-blur-xl`}
              >
                <div className="flex items-center gap-4 px-6 py-5">
                  <Search className={`w-5 h-5 ${subTextColor}`} />

                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="노래 제목이나 가수를 검색해보세요"
                    className={`w-full bg-transparent outline-none border-none font-['Pretendard'] text-[16px] ${textColor} ${placeholderColor}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
