/* Firebase 초기화 · 구글 로그인 · 권한 판정 · 페이지 가드 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  getRedirectResult, signOut, onAuthStateChanged,
  setPersistence, browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, TEACHER_EMAIL } from "./config.js";

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

await setPersistence(auth, browserLocalPersistence);   // 탭을 닫아도 로그인 유지

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export const isTeacher = u => !!u && u.email === TEACHER_EMAIL;
export const roleOf    = u => (isTeacher(u) ? "teacher" : "student");

/* 로그인은 팝업 방식만 쓴다.

   리디렉션(signInWithRedirect)을 쓰지 않는 이유 —
   크롬이 저장소 분할(storage partitioning)을 시작하면서, 앱 주소(localhost)와
   authDomain(프로젝트.firebaseapp.com)이 서로 다르면 리디렉션이 돌아오는 길에
   상태를 잃어버린다. 그때 나오는 게
     "Unable to process request due to missing initial state."
   이다. 이건 설정 문제가 아니라 브라우저 정책이라 고칠 수가 없다.

   나중에 Firebase 호스팅에 올려서 앱 주소와 authDomain이 같아지면
   그때는 리디렉션도 정상 동작한다. 필요해지면 그때 되살릴 것. */
const POPUP_BLOCKED = new Set([
  "auth/popup-blocked",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
]);

export async function login(){
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    if (e.code === "auth/popup-closed-by-user") return;   // 사용자가 그냥 닫음 — 조용히 넘어간다
    if (POPUP_BLOCKED.has(e.code)) {
      const blocked = new Error("popup-blocked");
      blocked.code = "app/popup-blocked";
      throw blocked;
    }
    throw e;
  }
}
export async function logout(){
  await signOut(auth);
  location.replace("./index.html");
}

/* 리디렉션으로 돌아온 경우를 처리한다. 실패해도 조용히 넘어간다. */
export async function settleRedirect(){
  try { await getRedirectResult(auth); } catch (_) {}
}

/* 페이지 가드.
   need: "teacher" | "student" | null(로그인만 확인)
   역할이 맞지 않으면 제 페이지로 돌려보낸다.

   ★ 시연용 우회 — 주소에 ?demo=1 이 붙어 있으면 로그인 없이 바로 통과시킨다.
     실제 Firebase 로그인이 없으므로 Firestore 읽기·쓰기는 다 막힌다(권한 없음).
     교사 화면은 [예시 데이터] 버튼으로 대신 보여주면 된다. 시연 끝나면
     index.html 의 데모 버튼만 지우면 이 우회로도 같이 안 쓰이게 된다. */
export function guard(need, onReady){
  if (new URLSearchParams(location.search).get("demo") === "1"){
    const demoUser = need === "teacher"
      ? { uid: "demo-teacher", displayName: "시연(교사)", email: TEACHER_EMAIL }
      : { uid: "demo-student", displayName: "시연(학생)", email: "" };
    onReady(demoUser, need || "student");
    return () => {};
  }
  return onAuthStateChanged(auth, user => {
    if (!user){ location.replace("./index.html"); return; }
    const role = roleOf(user);
    if (need && role !== need){
      location.replace(role === "teacher" ? "./teacher.html" : "./student.html");
      return;
    }
    onReady(user, role);
  });
}

/* 헤더에 로그인 정보와 로그아웃 버튼을 꽂는다 */
export function mountAccount(el, user){
  const role = isTeacher(user) ? "교사" : "학생";
  el.innerHTML =
    `<span class="acc-name">${user.displayName || user.email}</span>` +
    `<span class="acc-role">${role}</span>` +
    `<button class="btn" id="logout">로그아웃</button>`;
  el.querySelector("#logout").addEventListener("click", logout);
}
