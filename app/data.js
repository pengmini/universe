/* Firestore 읽기·쓰기.
   화면 쪽은 아래 모양의 배열 하나만 알면 된다 (기존 프로토타입과 같은 모양):
     [{ id, topic, student, uid, content, acts:[{id, from, type, text}] }]

   문서 ID를 결정론적으로 잡아 중복을 DB 레벨에서 막는다.
   Firestore 에는 UNIQUE 제약이 없지만, create 는 문서가 이미 있으면 실패한다.
     satellites/{topicId}__{uid}                 → 한 주제에 한 사람 한 글
     interactions/{satId}__{uid}__{type}         → 한 글에 공감 1 · 댓글 1
*/
import {
  collection, doc, setDoc, onSnapshot, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./auth.js";

export const satId = (topicId, uid)       => `${topicId}__${uid}`;
export const actId = (satelliteId, uid, t) => `${satelliteId}__${uid}__${t}`;

/* 두 컬렉션을 구독해 합친 배열을 계속 흘려보낸다 */
export function watchAll(onData, onError){
  let rawSats = [], rawActs = [], gotSats = false, gotActs = false;

  const emit = () => {
    if (!gotSats || !gotActs) return;          // 둘 다 한 번은 와야 합친다
    const byId = new Map(rawSats.map(s => [s.id, { ...s, acts: [] }]));
    rawActs.forEach(a => {
      const s = byId.get(a.satId);
      if (s) s.acts.push({ id: a.id, from: a.fromName, type: a.type, text: a.text || "" });
    });
    onData([...byId.values()]);
  };
  const fail = e => { console.error("[firestore]", e); if (onError) onError(e); };
  const byTime = (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);

  const un1 = onSnapshot(collection(db, "satellites"), snap => {
    rawSats = snap.docs.map(d => {
      const v = d.data();
      return { id:d.id, topic:v.topicId, student:v.studentName, uid:v.uid,
               content:v.content, createdAt:v.createdAt };
    }).sort(byTime);
    gotSats = true; emit();
  }, fail);

  const un2 = onSnapshot(collection(db, "interactions"), snap => {
    rawActs = snap.docs.map(d => ({ id:d.id, ...d.data() })).sort(byTime);
    gotActs = true; emit();
  }, fail);

  return () => { un1(); un2(); };
}

/* 글 올리기 — 한 주제에 한 번만 (문서 ID가 막는다) */
export async function postSatellite({ topicId, user, content }){
  const id = satId(topicId, user.uid);
  await setDoc(doc(db, "satellites", id), {
    topicId, uid: user.uid,
    studentName: user.displayName || user.email,
    content, createdAt: serverTimestamp(),
  });
  return id;
}

/* 공감 · 댓글 — 같은 글에 같은 종류는 한 번만 */
export async function addInteraction({ satelliteId, topicId, user, type, text }){
  const id = actId(satelliteId, user.uid, type);
  await setDoc(doc(db, "interactions", id), {
    satId: satelliteId, topicId,
    fromUid: user.uid,
    fromName: user.displayName || user.email,
    type, text: text || "", createdAt: serverTimestamp(),
  });
  return id;
}

/* 이미 있는 문서를 다시 쓰려 할 때의 안내 문구 */
export const friendlyError = e => {
  if (e && e.code === "permission-denied")
    return "이미 했거나, 권한이 없어요.";
  return "저장하지 못했어요. 연결을 확인해 주세요.";
};
