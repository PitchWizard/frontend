import React from "react";
import PitchTestpiano from "./PitchTestpiano";
import './App.css'

function App() {

  return (
    <div>
      <h1>Web Audio API Test</h1>
      <PitchTestpiano />
    </div>

    
  )
  
}

export default App


/*
import React from "react";
import PitchTest from "./PitchTest";

export default function App() {
  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>Vocal Range Test (따라부르기 방식 프로토타입)</h1>
      <p>
        화면의 안내에 따라 기준음을 듣고 따라 불러 보세요. 시스템이 자동으로 판정합니다.
        <br />
        (테스트는 로컬 브라우저에서만 동작하며, 마이크 권한을 허용해야 합니다.)
      </p>

      <PitchTest />
    </div>
  );
}
*/