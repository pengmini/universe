/* ───────────────────────────────────────────────────────────
   ① 여기만 채우면 됩니다.
   Firebase 콘솔 → 프로젝트 설정(⚙) → 내 앱 → SDK 설정 및 구성 → "구성"
   에 나오는 객체를 그대로 붙여넣으세요.

   이 값들은 브라우저에 공개되는 값이 맞습니다(웹 API 키는 비밀이 아닙니다).
   실제 접근 통제는 firestore.rules 가 합니다. 규칙을 꼭 배포하세요.
   ─────────────────────────────────────────────────────────── */
export const firebaseConfig = {
  apiKey: "AIzaSyA4jBNQn1wfSbbwWpVI1yO6UtY8PdGWFiE",
  authDomain: "universe-15a3c.firebaseapp.com",
  projectId: "universe-15a3c",
  storageBucket: "universe-15a3c.firebasestorage.app",
  messagingSenderId: "102242303374",
  appId: "1:102242303374:web:b97b821e157821c175f8df"

};

/* ② 교사 계정.
   ★ 이건 '화면 이동'용일 뿐입니다. 브라우저에서 누구나 읽을 수 있으므로
     보안 장치가 아닙니다. 실제 권한은 firestore.rules 의 isTeacher() 가 막습니다.
     두 곳의 이메일을 반드시 같게 유지하세요. */
export const TEACHER_EMAIL = "pengmini90@gmail.com";

/* ③ 주제 정의. 프로토타입이라 코드에 둡니다(사용자 데이터가 아니라 설정값).
   active:false 인 주제는 학생 화면에 나오지 않습니다. */
export const TOPICS = [
  { id:"t1", title:"전통놀이 종류 제안", short:"전통놀이", active:true, type:"board",
    hint:"우리가 해보고 싶은 전통놀이를 올려요", placeholder:"예) 딱지치기",
    css:"#E8604F", mix:["#5A1A22","#E8604F","#F0A03C","#C0304E"] },
  { id:"t2", title:"음악 취향 인터뷰", short:"음악 취향", active:true, type:"board",
    hint:"요즘 즐겨 듣는 음악을 알려줘요", placeholder:"예) 아이유",
    css:"#3D9AE0", mix:["#0E2B48","#3D9AE0","#45C8C0","#2A5FAE"] },
  // 단소는 다음 단계에서 작업합니다. 구조만 남겨 두고 학생 화면에는 띄우지 않습니다.
  { id:"t3", title:"단소 도움 횟수", short:"단소 도움", active:false, type:"counter",
    hint:"(다음 단계에서 작업)", placeholder:"",
    css:"#A276E8", mix:["#241442","#A276E8","#D46FC8","#6A4BBF"] },
];
