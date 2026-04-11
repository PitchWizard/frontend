import { useState } from "react";
import {
  CheckCircle,
  Headphones,
  LogIn,
  Menu,
  Moon,
  Music,
  Search,
  Smile,
  Sparkles,
  Sun,
  VolumeX,
  X,
} from "lucide-react";
import AccompanimentPage from "./AccompanimentPage.tsx";
import LoginPage from "./LoginPage.tsx";
import PitchTest from "./PitchTest.tsx";
import SearchPage from "./SearchPage.tsx";
import SignupPage from "./SignupPage.tsx";
import VoiceRangePage from "./VoiceRangePage.tsx";

type Page = "home" | "login" | "signup" | "test" | "search" | "accompaniment" | "range";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  function handleLogin(userData: any) {
    setUser(userData);
  }

  function handleLogout() {
    localStorage.removeItem("user");
    setUser(null);
  }

  if (currentPage === "login") {
    return (
      <LoginPage
        onBack={() => setCurrentPage("home")}
        onLogin={handleLogin}
        onGoSignup={() => setCurrentPage("signup")}
        isDarkMode={isDarkMode}
      />
    );
  }

  if (currentPage === "signup") {
    return (
      <SignupPage
        onBack={() => setCurrentPage("home")}
        onGoLogin={() => setCurrentPage("login")}
        isDarkMode={isDarkMode}
      />
    );
  }

  if (currentPage === "test") {
    return (
      <PitchTest
        onBack={() => setCurrentPage("home")}
        isDarkMode={isDarkMode}
        user={user}
        onTestComplete={(updated: any) => {
          const newUser = { ...user, ...updated };
          setUser(newUser);
          localStorage.setItem("user", JSON.stringify(newUser));
        }}
      />
    );
  }

  if (currentPage === "search") {
    return <SearchPage onBack={() => setCurrentPage("home")} isDarkMode={isDarkMode} />;
  }

  if (currentPage === "accompaniment") {
    return <AccompanimentPage onBack={() => setCurrentPage("home")} isDarkMode={isDarkMode} user={user} />;
  }

  if (currentPage === "range") {
    return <VoiceRangePage onBack={() => setCurrentPage("home")} isDarkMode={isDarkMode} user={user} />;
  }

  const bgColor = isDarkMode ? "bg-[#1f1f1f]/60" : "bg-[#f8f7f9]/60";
  const textColor = isDarkMode ? "text-[#f8f7f9]" : "text-[#1f1f1f]";
  const textSecondary = isDarkMode ? "text-[#f8f7f9]/70" : "text-[#1f1f1f]/70";
  const textTertiary = isDarkMode ? "text-[#f8f7f9]/60" : "text-[#1f1f1f]/60";
  const cardBg = isDarkMode ? "bg-white/5" : "bg-[#1f1f1f]/5";
  const cardHoverBg = isDarkMode ? "hover:bg-white/10" : "hover:bg-[#1f1f1f]/10";
  const border = isDarkMode ? "border-white/10" : "border-[#1f1f1f]/10";
  const iconBg = isDarkMode ? "bg-[#f8f7f9]" : "bg-[#1f1f1f]";
  const iconColor = isDarkMode ? "text-[#1f1f1f]" : "text-[#f8f7f9]";
  const heroOffsetClass = "mt-[244px]";

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
          isDarkMode ? "bg-black/60" : "bg-white/60"
        }`}
      />

      <div className="relative z-10">
        <header
          className={`
            fixed top-0 left-0 right-0 z-50
            ${isDarkMode ? "bg-[#1f1f1f]/90" : "bg-[#f8f7f9]/90"}
            backdrop-blur-md border-b ${border}
          `}
        >
          <div className="w-[85%] mx-auto px-12 py-6 flex items-center justify-between">
            <h1 className={`font-['Pretendard'] text-[22px] font-thin tracking-wide ${textColor}`}>
              PitchWizard
            </h1>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${textSecondary}`}>{user.username}</span>
                  <button
                    onClick={handleLogout}
                    className={`px-4 py-2 rounded-full border ${border} ${cardBg} ${textColor} transition-colors ${
                      isDarkMode ? "hover:bg-white/10" : "hover:bg-[#1f1f1f]/10"
                    } text-sm`}
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCurrentPage("login")}
                  className={`px-4 py-2 rounded-full border ${border} ${cardBg} ${textColor} transition-colors ${
                    isDarkMode ? "hover:bg-white/10" : "hover:bg-[#1f1f1f]/10"
                  } flex items-center gap-2`}
                >
                  <LogIn className="w-4 h-4" />
                  로그인
                </button>
              )}

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-white/10" : "hover:bg-[#1f1f1f]/10"
                }`}
                aria-label={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
              >
                {isDarkMode ? (
                  <Sun className={`w-6 h-6 ${textColor}`} />
                ) : (
                  <Moon className={`w-6 h-6 ${textColor}`} />
                )}
              </button>

              <button
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-white/10" : "hover:bg-[#1f1f1f]/10"
                }`}
                aria-label="메뉴 열기"
              >
                <Menu className={`w-6 h-6 ${textColor}`} />
              </button>
            </div>
          </div>
        </header>

        <main className="pt-32 md:pt-40 px-10 pb-40">
          <div className="w-[85%] mx-auto flex flex-col items-center">
            <div className={heroOffsetClass}>
              <div className="flex flex-col items-center text-center max-w-3xl space-y-0">
                <h2 className={`font-['Pretendard'] font-thin text-[56px] ${textColor}`}>
                  자신의 음역대를 찾고
                </h2>

                <h1 className="font-['Pretendard'] text-[83px] font-bold leading-tight text-[#00d9b1]">
                  자신 있게 노래하세요
                </h1>

                <div className="translate-y-[90px]">
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-14 py-5 rounded-full border border-white/40 bg-white/10 backdrop-blur-lg shadow-xl shadow-white/5 text-white text-[20px] font-semibold flex items-center gap-3 transition-colors duration-300 hover:bg-[#00d9b1]/65"
                  >
                    음역대 찾기
                    <Music className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex gap-10 pt-[160px]">
                  {["5분 소요", "무료", "간편한 분석"].map((label) => (
                    <div key={label} className="flex items-center gap-3">
                      <CheckCircle className={`w-5 h-5 ${textColor}`} />
                      <span className={`text-[16px] ${textTertiary}`}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full mt-32 grid md:grid-cols-3 gap-12">
              <button
                onClick={() => setCurrentPage("range")}
                className={`relative text-left w-full ${cardBg} border ${border} rounded-2xl p-10 backdrop-blur-sm transition-all ${cardHoverBg}`}
              >
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-5 ${iconBg}`}>
                  <Music className={`w-8 h-8 ${iconColor}`} />
                </div>
                <h3 className={`text-[24px] font-semibold mb-3 ${textColor}`}>나의 음역대</h3>
                <p className={`text-[16px] ${textTertiary}`}>
                  테스트 결과와 음역 해석, 유사 가수 정보를 확인합니다
                </p>
              </button>

              <button
                onClick={() => setCurrentPage("search")}
                className={`relative text-left w-full ${cardBg} border ${border} rounded-2xl p-10 backdrop-blur-sm transition-all ${cardHoverBg}`}
              >
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-5 ${iconBg}`}>
                  <Search className={`w-8 h-8 ${iconColor}`} />
                </div>
                <h3 className={`text-[24px] font-semibold mb-3 ${textColor}`}>노래 검색</h3>
                <p className={`text-[16px] ${textTertiary}`}>
                  당신에게 맞는 노래를 추천합니다
                </p>
              </button>

              <button
                onClick={() => setCurrentPage("accompaniment")}
                className={`relative text-left w-full ${cardBg} border ${border} rounded-2xl p-10 backdrop-blur-sm transition-all ${cardHoverBg}`}
              >
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-5 ${iconBg}`}>
                  <Sparkles className={`w-8 h-8 ${iconColor}`} />
                </div>
                <h3 className={`text-[24px] font-semibold mb-3 ${textColor}`}>노래 추천</h3>
                <p className={`text-[16px] ${textTertiary}`}>반주 제공 페이지로 연결됩니다</p>
              </button>
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          <div
            className={`relative w-full max-w-2xl ${
              isDarkMode ? "bg-[#1f1f1f]" : "bg-[#f8f7f9]"
            } rounded-3xl shadow-2xl border ${border} overflow-hidden`}
          >
            <div className="relative p-10 pb-8">
              <button
                onClick={() => setShowModal(false)}
                className={`absolute top-6 right-6 p-2 rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-white/10" : "hover:bg-[#1f1f1f]/10"
                }`}
                aria-label="안내 닫기"
              >
                <X className={`w-6 h-6 ${textColor}`} />
              </button>

              <h2 className={`font-['Pretendard'] text-[32px] font-bold ${textColor} mb-3`}>
                테스트 시작 전 안내
              </h2>
              <p className={`font-['Pretendard'] text-[16px] ${textSecondary}`}>
                정확한 음역대 측정을 위해 아래 사항을 확인해주세요
              </p>
            </div>

            <div className="px-10 pb-6 space-y-8">
              <div className="flex gap-6 items-start">
                <div
                  className={`flex-shrink-0 w-16 h-16 rounded-2xl ${cardBg} border ${border} flex items-center justify-center`}
                >
                  <VolumeX className={`w-8 h-8 ${textColor}`} />
                </div>
                <div>
                  <h3 className={`font-['Pretendard'] text-[20px] font-semibold ${textColor} mb-2`}>
                    조용한 환경
                  </h3>
                  <p className={`font-['Pretendard'] text-[16px] ${textSecondary} leading-relaxed`}>
                    주변 소음이 적은 조용한 공간에서 테스트를 진행해주세요
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div
                  className={`flex-shrink-0 w-16 h-16 rounded-2xl ${cardBg} border ${border} flex items-center justify-center`}
                >
                  <Smile className={`w-8 h-8 ${textColor}`} />
                </div>
                <div>
                  <h3 className={`font-['Pretendard'] text-[20px] font-semibold ${textColor} mb-2`}>
                    편안한 발성
                  </h3>
                  <p className={`font-['Pretendard'] text-[16px] ${textSecondary} leading-relaxed`}>
                    무리하게 높은 음을 내지 말고, 편안하게 부를 수 있는 음역대로 노래해주세요
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div
                  className={`flex-shrink-0 w-16 h-16 rounded-2xl ${cardBg} border ${border} flex items-center justify-center`}
                >
                  <Headphones className={`w-8 h-8 ${textColor}`} />
                </div>
                <div>
                  <h3 className={`font-['Pretendard'] text-[20px] font-semibold ${textColor} mb-2`}>
                    헤드폰 권장
                  </h3>
                  <p className={`font-['Pretendard'] text-[16px] ${textSecondary} leading-relaxed`}>
                    헤드폰이나 이어폰을 착용하면 더 정확한 측정이 가능합니다
                  </p>
                </div>
              </div>
            </div>

            <div className={`mx-10 mb-6 p-6 rounded-2xl ${cardBg} border ${border}`}>
              <p className={`font-['Pretendard'] text-[16px] ${textSecondary} leading-relaxed text-center`}>
                <span className={`font-semibold ${textColor}`}>테스트 방법:</span> 제시되는 음을 듣고
                해당 음을 따라 불러주세요
              </p>
            </div>

            <div className="p-10 pt-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setCurrentPage("test");
                }}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#00d9b1] to-[#00e6bf] text-white font-['Pretendard'] text-[20px] font-bold shadow-xl shadow-[#00d9b1]/30 hover:shadow-[#00d9b1]/50 hover:scale-[1.02] transition-all duration-300 active:scale-100"
              >
                테스트 하러 가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
