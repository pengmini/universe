/* Firebase 초기화 · 구글 로그인 · 권한 판정 · 페이지 가드 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
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

/* 학교 크롬북은 팝업이 막히는 경우가 많다. 막히면 리디렉션으로 넘어간다. */
export async function login(){
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    if (["auth/popup-blocked", "auth/popup-closed-by-user",
         "auth/cancelled-popup-request", "auth/operation-not-supported-in-this-environment"]
        .includes(e.code)) {
      await signInWithRedirect(auth, provider);
      return;
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
   역할이 맞지 않으면 제 페이지로 돌려보낸다. */
export function guard(need, onReady){
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
