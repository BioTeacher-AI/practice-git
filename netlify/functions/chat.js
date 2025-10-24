// netlify/functions/chat.js
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Netlify Functions (ESM 지원). package.json이 없다면 아래 export 방식 사용.
export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  if (!OPENAI_API_KEY) {
    return { statusCode: 500, body: "Missing OPENAI_API_KEY" };
  }

  try {
    const { mode = "free", topic = "광합성", message = "" } = JSON.parse(event.body || "{}");
    if (!message) return { statusCode: 400, body: "Missing 'message' in body" };

    // 시스템 프롬프트
    let system = "너는 친절한 중등 생물 교사 '세포쌤'이다. 답변은 한국어로 간결하고 정확하게, 중학생 눈높이에 맞게 설명한다.";
    if (mode === "feedback") {
      system += " 지금은 학생 답안을 채점/피드백하는 역할이다. 개념 오개념을 명확히 짚고 근거를 짧게 제시한다.";
    } else if (mode === "summary") {
      system += " 지금은 수업 전/후 성취 변화 요약과 다음 학습 권장활동(2~3개)을 제시하는 역할이다.";
    }

    const body = {
      model: "gpt-4o-mini",
      temperature: mode === "free" ? 0.5 : 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: message }
      ]
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return { statusCode: 502, body: `OpenAI error: ${errText}` };
    }

    const json = await resp.json();
    const reply = json?.choices?.[0]?.message?.content ?? "";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply })
    };
  } catch (e) {
    return { statusCode: 500, body: `Server error: ${e.message}` };
  }
}
