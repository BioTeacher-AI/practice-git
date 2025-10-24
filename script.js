/*****************
 * 문제 정의
 *****************/
const TOPIC = "광합성";
const QUESTIONS = [
  { q: "1) 광합성이 일어나는 세포 소기관은 어디일까요?", options: ["A. 미토콘드리아", "B. 엽록체", "C. 리보솜", "D. 핵"], answer: "B" },
  { q: "2) 광합성에 필요한 주요 기체는 무엇인가요?", options: ["A. 산소", "B. 이산화탄소", "C. 질소", "D. 아르곤"], answer: "B" },
  { q: "3) 광합성의 산물로 생성되는 물질은?", options: ["A. 물", "B. 포도당", "C. 단백질", "D. 지방"], answer: "B" },
  { q: "4) 광합성이 잘 일어나기 위해 필요한 조건이 아닌 것은?", options: ["A. 빛", "B. 엽록체", "C. 고온", "D. 물"], answer: "C" },
  { q: "5) 광합성의 광반응이 일어나는 장소는?", options: ["A. 기질", "B. 틸라코이드막", "C. 세포질", "D. 핵막"], answer: "B" },
  { q: "6) 광합성의 두 단계는 각각 무엇이라고 하나요? (주관식)", options: null, answer: "광반응과 암반응" },
  { q: "7) 암반응에서 주로 생성되는 물질은 무엇인가요? (주관식)", options: null, answer: "포도당" },
  { q: "8) 엽록체가 없는 식물 세포에서 광합성이 가능한가요? 이유와 함께 설명하세요. (주관식)", options: null, answer: "불가능하다. 엽록체가 있어야 빛에너지를 화학에너지로 전환할 수 있기 때문이다." }
];

/*****************
 * 탭 전환
 *****************/
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");
tabs.forEach(btn => {
  btn.addEventListener("click", () => {
    tabs.forEach(b => b.classList.remove("active"));
    panels.forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

/*****************
 * 공통 유틸
 *****************/
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, v);
  });
  children.forEach(c => node.append(c));
  return node;
}

function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(x => `"${String(x ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" }); // BOM 포함(엑셀 호환)
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function scoreMCQ(answers) {
  let c = 0;
  for (let i = 0; i < 5; i++) {
    const expect = (QUESTIONS[i].answer || "").trim().toUpperCase();
    if ((answers[i] || "").trim().toUpperCase() === expect) c++;
  }
  return c;
}

/*****************
 * 📘 수업 전 (폼)
 *****************/
const mcqArea = document.getElementById("mcq-area");
const shortArea = document.getElementById("short-area");
const preName = document.getElementById("pre-name");
const preSubmit = document.getElementById("pre-submit");
const preOutput = document.getElementById("pre-output");
const preStatus = document.getElementById("pre-status");

// 렌더
function renderPreForm() {
  mcqArea.innerHTML = "";
  shortArea.innerHTML = "";

  for (let i = 0; i < 5; i++) {
    const q = QUESTIONS[i];
    const wrap = el("div", { class: "q" }, el("div", { class: "q-title", html: q.q }));
    const opts = el("div");
    q.options.forEach(opt => {
      const id = `mcq-${i}-${opt[0]}`;
      const label = el("label", {}, el("input", { type: "radio", name: `mcq-${i}`, value: opt[0], id }), ` ${opt}`);
      opts.append(label, el("br"));
    });
    wrap.append(opts);
    mcqArea.append(wrap);
  }

  for (let i = 5; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    const wrap = el("div", { class: "q" },
      el("div", { class: "q-title", html: q.q }),
      el("textarea", { id: `short-${i}`, rows: "3", placeholder: "여기에 답 입력" })
    );
    shortArea.append(wrap);
  }
}

renderPreForm();

preSubmit.addEventListener("click", () => {
  const name = (preName.value || "").trim();
  if (!name) {
    preOutput.textContent = "이름을 입력하세요.";
    return;
  }

  const mcqAnswers = [];
  for (let i = 0; i < 5; i++) {
    const checked = document.querySelector(`input[name="mcq-${i}"]:checked`);
    mcqAnswers.push(checked ? checked.value : "");
  }
  const shortAnswers = [];
  for (let i = 5; i < QUESTIONS.length; i++) {
    shortAnswers.push((document.getElementById(`short-${i}`).value || "").trim());
  }
  const allAnswers = [...mcqAnswers, ...shortAnswers];

  // 점수 계산 + CSV 다운로드 + localStorage 저장
  const mcqCorrect = scoreMCQ(allAnswers);
  const rows = [["문제", "답안"], ...QUESTIONS.map((q, idx) => [q.q, allAnswers[idx] || ""])];
  const filename = `${name}_pre.csv`;
  downloadCSV(filename, rows);

  // localStorage 저장
  const key = `cellsam_pre_${name}`;
  localStorage.setItem(key, JSON.stringify({ name, answers: allAnswers, ts: Date.now() }));

  preOutput.textContent = `✅ 수업 전 진단 제출 완료: ${name}\n객관식 정답 수: ${mcqCorrect}/5\n파일 저장(다운로드됨): ${filename}`;
  preStatus.textContent = "저장 완료";
  setTimeout(() => (preStatus.textContent = ""), 1500);
});

/*****************
 * 💬 수업 후 (채팅형)
 *****************/
const chatLog = document.getElementById("chat-log");
const chatMsg = document.getElementById("chat-message");
const chatSend = document.getElementById("chat-send");

let studentName = null;
let currentIndex = 0;
let postAnswers = [];

function appendMsg(text, who = "ai") {
  const item = el("div", { class: `msg ${who}` },
    el("span", { class: "bubble" }, text)
  );
  chatLog.append(item);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function askOpenAI(payload) {
  // Netlify Function 호출
  const res = await fetch("/.netlify/functions/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function nextQuestionText(idx) {
  const q = QUESTIONS[idx];
  let t = `문제 ${idx + 1}️⃣: ${q.q}`;
  if (q.options) t += "\n" + q.options.join("\n");
  return t;
}

async function handleChatSend() {
  const msg = (chatMsg.value || "").trim();
  if (!msg) return;

  appendMsg(msg, "me");
  chatMsg.value = "";

  if (!studentName) {
    // 이름 등록
    studentName = msg;
    currentIndex = 0;
    postAnswers = [];
    const hello = `안녕하세요, ${studentName}님! 🌿\n수업 후 확인 문제를 시작합니다.\n\n${nextQuestionText(currentIndex)}`;
    appendMsg(hello, "ai");
    return;
  }

  // 답 기록 → 피드백 요청
  const q = QUESTIONS[currentIndex];
  postAnswers.push(msg);

  const user_prompt = [
    `문제: ${q.q}`,
    `학생 답변: ${msg}`,
    q.answer ? `기대(정답 or 핵심): ${q.answer}` : "",
    "학생의 답이 맞는지/틀린지 간단히 설명하고, 틀렸다면 올바른 개념을 쉽게 설명해줘."
  ].filter(Boolean).join("\n");

  try {
    const { reply } = await askOpenAI({
      mode: "feedback",
      topic: TOPIC,
      message: user_prompt
    });
    appendMsg(`🧾 세포쌤 피드백:\n${reply}`, "ai");
  } catch (e) {
    appendMsg(`(피드백 생성 중 오류: ${e.message})`, "ai");
  }

  currentIndex += 1;

  if (currentIndex < QUESTIONS.length) {
    appendMsg(`\n${nextQuestionText(currentIndex)}`, "ai");
  } else {
    // 모든 문제 완료 → 점수 계산 + CSV + 요약 피드백
    const rows = [["문제", "답안"], ...QUESTIONS.map((q, idx) => [q.q, postAnswers[idx] || ""])];
    const postFilename = `${studentName}_post_${new Date().toISOString().replace(/[-:T]/g,"").slice(0,15)}.csv`;
    downloadCSV(postFilename, rows);

    const postScore = scoreMCQ(postAnswers);
    // pre 로드 (있으면)
    let preScore = 0;
    const preKey = `cellsam_pre_${studentName}`;
    const preSaved = localStorage.getItem(preKey);
    if (preSaved) {
      try {
        const obj = JSON.parse(preSaved);
        preScore = scoreMCQ(obj.answers || []);
      } catch (_) {}
    }

    // 요약 피드백 생성 (OpenAI)
    try {
      const prompt = [
        "너는 따뜻한 중등 생물 교사 '세포쌤'이야.",
        `학생 이름: ${studentName}`,
        `주제: ${TOPIC}`,
        `수업 전 점수: ${preScore}`,
        `수업 후 점수: ${postScore}`,
        "학생의 개념 이해 변화를 분석하고, 남은 오개념을 쉽게 설명하고, 다음 학습에서 권장할 활동 2-3개를 제안해줘."
      ].join("\n");

      const { reply } = await askOpenAI({ mode: "summary", topic: TOPIC, message: prompt });
      const finalText = `✅ 모든 문제 완료!\n수업 전(객관식): ${preScore}/5\n수업 후(객관식): ${postScore}/5\n수업 후 답안 저장(다운로드됨): ${postFilename}\n\n${reply}`;
      appendMsg(finalText, "ai");
    } catch (e) {
      appendMsg(`요약 피드백 생성 오류: ${e.message}`, "ai");
    }

    // 상태 초기화
    studentName = null;
    currentIndex = 0;
    postAnswers = [];
  }
}

chatSend.addEventListener("click", handleChatSend);
chatMsg.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleChatSend();
  }
});

/*****************
 * ❓ 자유 질문
 *****************/
const freeQ = document.getElementById("free-q");
const freeBtn = document.getElementById("free-btn");
const freeA = document.getElementById("free-a");
const freeStatus = document.getElementById("free-status");

freeBtn.addEventListener("click", async () => {
  const text = (freeQ.value || "").trim();
  if (!text) {
    freeA.textContent = "질문을 입력해 주세요.";
    return;
  }
  freeStatus.textContent = "⏳ 처리 중...";
  freeA.textContent = "";
  try {
    const { reply } = await askOpenAI({ mode: "free", topic: TOPIC, message: text });
    freeA.textContent = reply || "(빈 응답)";
  } catch (e) {
    freeA.textContent = `오류: ${e.message}`;
  } finally {
    freeStatus.textContent = "";
  }
});

/*****************
 * 👩‍🏫 교사용 대시보드
 * 업로드한 CSV들(수업 전/후)을 합쳐서 테이블/차트 표시
 *****************/
const dashPw = document.getElementById("dash-pw");
const dashFiles = document.getElementById("dash-files");
const dashLoad = document.getElementById("dash-load");
const dashStatus = document.getElementById("dash-status");
const dashTbody = document.querySelector("#dash-table tbody");
const dashChartEl = document.getElementById("dash-chart");
let dashChart = null;

function parseCSV(text) {
  // 매우 단순한 CSV 파서(따옴표 처리 & BOM 제거)
  const t = text.replace(/^\uFEFF/, "");
  const lines = t.split(/\r?\n/).filter(Boolean);
  const rows = lines.map(line => {
    const out = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') { inQ = false; }
        else { cur += ch; }
      } else {
        if (ch === '"') inQ = true;
        else if (ch === ",") { out.push(cur); cur = ""; }
        else { cur += ch; }
      }
    }
    out.push(cur);
    return out;
  });
  return rows;
}

function isPreFile(name) { return /_pre\.csv$/i.test(name); }
function isPostFile(name) { return /_post_/i.test(name) && /\.csv$/i.test(name); }

function computeScoreFromCSV(rows) {
  // rows: [["문제","답안"], ["Q","A"], ...]
  const idxStart = 1;
  const ans = [];
  for (let i = idxStart; i < rows.length; i++) {
    ans.push((rows[i][1] || "").trim());
  }
  return scoreMCQ(ans);
}

dashLoad.addEventListener("click", async () => {
  if ((dashPw.value || "") !== "teacher123") {
    dashStatus.textContent = "비밀번호가 올바르지 않습니다.";
    return;
  }
  const files = Array.from(dashFiles.files || []);
  if (!files.length) {
    dashStatus.textContent = "CSV 파일을 선택해 주세요.";
    return;
  }

  dashStatus.textContent = "⏳ 분석 중...";
  const map = new Map(); // name -> { pre:score|"-", post:score|"-", postFile:"" }

  // 파일 이름 규칙: {name}_pre.csv / {name}_post_YYYYMMDD...csv
  for (const f of files) {
    const text = await f.text();
    const rows = parseCSV(text);
    if (!rows.length) continue;

    // 학생 이름 추출
    let student = f.name.split("_")[0];

    // 점수 계산
    const score = computeScoreFromCSV(rows);

    if (!map.has(student)) map.set(student, { pre: "-", post: "-", postFile: "" });
    const rec = map.get(student);

    if (isPreFile(f.name)) {
      rec.pre = score;
    } else if (isPostFile(f.name)) {
      rec.post = score;
      // 가장 최신 파일 고르기(문자열 비교로 충분)
      if (!rec.postFile || f.name > rec.postFile) rec.postFile = f.name;
    }
  }

  // 테이블 렌더
  dashTbody.innerHTML = "";
  const labels = [];
  const preData = [];
  const postData = [];
  for (const [student, rec] of Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0],'ko'))) {
    const imp = (Number.isInteger(rec.post) && Number.isInteger(rec.pre)) ? (rec.post - rec.pre) : "";
    const tr = el("tr", {},
      el("td", {}, student),
      el("td", {}, Number.isInteger(rec.pre) ? String(rec.pre) : "-"),
      el("td", {}, Number.isInteger(rec.post) ? String(rec.post) : "-"),
      el("td", {}, imp === "" ? "-" : String(imp)),
      el("td", {}, rec.postFile || "-")
    );
    dashTbody.append(tr);
    labels.push(student);
    preData.push(Number.isInteger(rec.pre) ? rec.pre : null);
    postData.push(Number.isInteger(rec.post) ? rec.post : null);
  }

  // 차트
  if (dashChart) dashChart.destroy();
  dashChart = new Chart(dashChartEl, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "수업 전(5점)", data: preData },
        { label: "수업 후(5점)", data: postData }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, max: 5, ticks: { stepSize: 1 } } }
    }
  });

  dashStatus.textContent = "완료";
  setTimeout(()=>dashStatus.textContent="",1500);
});
