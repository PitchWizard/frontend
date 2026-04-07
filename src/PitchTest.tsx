import PitchTestpiano from "./PitchTestpiano";
import { ArrowLeft, LogIn } from "lucide-react";

type Props = {
  onBack: () => void;
  isDarkMode: boolean;
  user: any;
  onTestComplete: (updated: object) => void;
};

export default function PitchTest({ onBack, isDarkMode, user, onTestComplete }: Props) {
  const bgColor = isDarkMode ? "bg-[#1f1f1f]/60" : "bg-[#f8f7f9]/60";
  const textColor = isDarkMode ? "text-white" : "text-[#1f1f1f]";
  const subTextColor = isDarkMode ? "text-white/70" : "text-[#1f1f1f]/70";
  const border = isDarkMode ? "border-white/10" : "border-[#1f1f1f]/10";

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

      <div className="relative z-10 min-h-screen flex flex-col">
        <header
          className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b ${border}
          ${isDarkMode ? "bg-[#1f1f1f]/90" : "bg-[#f8f7f9]/90"}`}
        >
          <div className="w-[85%] mx-auto px-12 py-6 flex items-center justify-between">
            <button
              onClick={onBack}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? "hover:bg-white/10" : "hover:bg-[#1f1f1f]/10"
              }`}
              aria-label="뒤로가기"
            >
              <ArrowLeft className={`w-6 h-6 ${textColor}`} />
            </button>

            <h1 className={`font-['Pretendard'] text-[22px] font-thin tracking-wide ${textColor}`}>
              PitchWizard
            </h1>

            <div className="w-8" />
          </div>
        </header>

        <main className="pt-40 px-10 w-[85%] mx-auto flex-1">
          <div className="text-center mb-10">
            <h2 className={`font-['Pretendard'] text-[38px] font-bold ${textColor}`}>
              음역대 테스트
            </h2>
            <p className={`mt-3 font-['Pretendard'] text-[16px] ${subTextColor}`}>
              마이크 버튼을 누르고 재생되는 제시음을 따라 부르세요.
            </p>
          </div>

          {!user ? (
            <div className={`flex flex-col items-center justify-center gap-6 py-24 rounded-3xl border ${border} bg-white/5 backdrop-blur-xl`}>
              <LogIn className={`w-12 h-12 ${subTextColor}`} />
              <p className={`text-[20px] font-semibold ${textColor}`}>로그인이 필요한 기능입니다</p>
              <p className={`text-[15px] ${subTextColor}`}>측정 결과를 저장하려면 먼저 로그인해주세요.</p>
              <button
                onClick={onBack}
                className="px-8 py-3 rounded-full bg-[#00d9b1] text-white font-semibold text-[16px] hover:opacity-90 transition"
              >
                돌아가기
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                className={`w-full max-w-5xl rounded-3xl border ${border} bg-white/10 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden`}
              >
                <PitchTestpiano userId={user.id} onTestComplete={onTestComplete} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
