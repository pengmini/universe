# 소통의 우주 (Communication Universe)

학생들의 학급 내 상호작용을 3D 우주로 시각화하는 교육용 웹앱 프로토타입.
글을 올리면 **위성 행성**이 생기고, 공감·댓글·도움이 쌓이면 그 주위에 **숨은 별**이 늘어납니다.

> **Phase 0 프로토타입입니다.** 데이터는 브라우저 메모리에만 있고, 새로고침하면 초기화됩니다.
> 실시간 동기화(Firebase) 연동은 아래 «다음 단계»를 참고하세요.

---

## 바로 실행

의존성도 빌드도 없습니다. 파일 하나짜리 정적 페이지입니다.

```bash
# 아무 정적 서버나 띄우면 됩니다
python3 -m http.server 8000
# → http://localhost:8000
```

`index.html`을 브라우저에서 바로 열어도 동작합니다.

---

## 배포

### GitHub Pages

1. 이 저장소를 GitHub에 올립니다.
2. Settings → Pages → Source를 `main` 브랜치 `/ (root)`로 지정합니다.
3. 잠시 뒤 `https://<계정>.github.io/<저장소>/` 에서 열립니다.

### Vercel

```bash
npx vercel
```

빌드 설정 없이 그대로 배포됩니다. 프레임워크는 **Other**, 출력 디렉터리는 루트로 두세요.

---

## 써보기

| 하는 일 | 결과 |
|---|---|
| 우측 상단 **나는** 에서 이름 선택 | 그 학생으로 활동합니다 |
| **전통놀이 / 음악 취향** 탭에서 글 올리기 | 해당 주제 행성 주위에 내 위성이 생깁니다 |
| 친구 글에 **공감 / 댓글** | 그 위성 주위에 숨은 별이 하나 늘어납니다 |
| **단소 도움** 탭에서 친구 이름 클릭 | 그 친구의 도움 횟수 +1, 숨은 별 +1 |
| 위성에 **마우스 올리기** | 이름·내용 툴팁 + 그 위성의 숨은 별이 환하게 켜집니다 |
| 위성 **클릭** → 우하단 **숨은 태양 띄우기** | 숨은 별 3개가 태양으로 커지고 연결선이 뻗습니다 |
| 캔버스 **드래그 / 휠** | 360° 회전 / 줌 |
| **전자칠판 모드** | 대시보드를 접고 우주만 전체 화면으로 |

교실 앞 전자칠판에서는 전자칠판 모드로 띄워두고, 학생들은 크롬북에서 대시보드로 접속하는 구성을 상정했습니다.

---

## 시각 규칙

| 요소 | 의미 |
|---|---|
| **주제 행성** (중앙 3개) | 위성이 늘수록 크기와 자체 발광이 증가 |
| **위성 행성** | 상호작용이 많을수록 크고 밝고 공전이 미세하게 빨라짐 |
| **숨은 별** | 평소 투명도 14%로 배경에 묻혀 있다가, 해당 위성에 호버하면 92%로 켜짐 |
| **숨은 태양** | 선택한 위성의 숨은 별 중 3개가 태양으로 전환 + 연결선 |

색은 주제마다 계열이 다릅니다 — 전통놀이(붉은 계열), 음악 취향(푸른 계열), 단소 도움(보라 계열).
행성 표면은 단색이 아니라 같은 계열 2~3색을 섞은 마블 텍스처를 캔버스로 생성해 입힙니다.

---

## 구조

```
index.html        전부 여기 들어 있습니다 (마크업 · 스타일 · 3D 로직)
README.md
```

- **3D**: [Three.js r128](https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js) (CDN, UMD)
- **폰트**: Google Fonts — Jua, IBM Plex Sans KR, IBM Plex Mono
- 그 외 의존성 없음. 텍스처는 전부 `<canvas>`로 런타임 생성하므로 이미지 파일이 없습니다.

### 주요 함수

| 함수 | 하는 일 |
|---|---|
| `marbleTex(mix)` | 주제 색 2~3개를 섞은 마블 텍스처를 캔버스로 생성 |
| `buildSats()` | `sats` 배열을 3D 오브젝트로 재구성 (데이터 변경 시 호출) |
| `buildStars(sa)` | 한 위성의 상호작용을 숨은 별 스프라이트로 배치 |
| `fireSuns()` | 선택 위성의 숨은 별 3개를 태양으로 전환 + 연결선 생성 |
| `frame(now)` | 매 프레임 공전·크기·밝기·호버 갱신 |
| `renderPanes()` | 대시보드 3개 탭 다시 그리기 |

### 데이터 모델 (현재: 메모리)

```js
sats = [{
  id:      "s1",
  topic:   "t1",          // t1 전통놀이 · t2 음악 · t3 단소도움
  student: "민준",
  content: "딱지치기",     // t3는 횟수 문자열
  acts:    [{ from: "서연", type: "like" | "comment" | "help" }]
}]
```

---

## 다음 단계

### 1. Firebase 실시간 동기화

현재 데이터 모양이 PRD의 Firestore 구조와 그대로 맞습니다.

```
topics/{topicId}                      title, type, total_interactions
satellites/{satId}                    topic_id, student_name, content, interaction_count
interactions/{id}                     target_satellite_id, from_student_name, type, created_at
```

붙이는 지점은 세 곳입니다.

```js
// ① 읽기 — sats 배열만 갈아끼우고 buildSats() 호출
onSnapshot(collection(db, "satellites"), snap => {
  sats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  buildSats(); renderPanes(); stats();
});

// ② 글 올리기 — [data-post] 핸들러의 sats.push() 자리
await addDoc(collection(db, "satellites"), { topic_id, student_name, content });

// ③ 공감·댓글·도움 — [data-act] / [data-help] 핸들러의 acts.push() 자리
await addDoc(collection(db, "interactions"), { target_satellite_id, from_student_name, type });
```

**중복 방지는 문서 ID로 거세요.** Firestore에는 UNIQUE 제약이 없지만, `create`는 문서가 이미 있으면 실패합니다.

```
interactions/{satId}__{fromUid}__{type}    ← 같은 사람이 같은 글에 두 번 공감 못 함
```

점수·집계를 클라이언트가 쓰지 못하도록 `interaction_count` 갱신은 Cloud Functions 트리거로 옮기고, 보안 규칙에서 클라이언트 쓰기를 막으세요.

### 2. React Three Fiber 이관

PRD의 원래 계획대로 R3F로 옮기려면, `frame()` 안의 갱신 로직이 그대로 `useFrame`으로 들어갑니다. 위성 하나가 컴포넌트 하나가 되고, 호버는 `onPointerOver`로 대체됩니다. 이 프로토타입을 순수 Three.js로 짠 이유는 R3F의 UMD 빌드를 CDN으로 불러올 수 없는 실행 환경 제약 때문이며, 로직 자체는 그대로 옮겨집니다.

### 3. 후처리 블룸

지금 발광은 가산합성(additive) 스프라이트를 겹쳐 흉내 낸 것입니다. 실제 블룸을 쓰려면:

```bash
npm i @react-three/postprocessing
```

```jsx
<EffectComposer>
  <Bloom intensity={0.9} luminanceThreshold={0.25} mipmapBlur />
</EffectComposer>
```

### 4. 폰트

PRD가 요청한 프리텐다드는 Google Fonts에 없어 여기서는 **Jua**로 대체했습니다.
자체 호스팅하려면 [Pretendard](https://github.com/orioncactus/pretendard) 를 `public/fonts/`에 넣고 `@font-face`로 선언하세요.

---

## 남은 과제

- [ ] 학생 신원 — 지금은 드롭다운 선택. 실제로는 세션 코드 + 익명 인증 권장 (초등 개인정보 최소화)
- [ ] 부적절한 입력 필터링 (비속어, 장난 이름)
- [ ] 교사 화면 — 참여가 적은 학생 확인. **반 전체가 보는 화면에는 띄우지 말 것** (낙인)
- [ ] 위성 수가 60개를 넘을 때의 성능 측정 (현재 구조는 위성마다 Mesh 1 + Sprite 1)
- [ ] 모바일 터치 제스처 (핀치 줌)
- [ ] 세션 종료 후 데이터 자동 삭제 정책

---

## 라이선스

교실에서 자유롭게 쓰고 고치세요.
