import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("HighSpin with LUMIA API is running.");
});

app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question || "";
    const messages = req.body.messages || [];
    const uploadedFileText = req.body.uploadedFileText || "";
    const mode = req.body.mode || "assistant";

    const imageKeywords = [
      "이미지",
      "그림",
      "사진",
      "그려줘",
      "만들어줘",
      "생성해줘",
      "image",
      "illustration",
      "photo",
      "draw",
      "generate"
    ];

    const isImageRequest = imageKeywords.some((keyword) =>
      question.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isImageRequest) {
      return res.json({
        answer:
          "현재 HighSpin with LUMIA.v1에서는 이미지 생성 기능이 아직 구현되어 있지 않습니다. 지금은 텍스트 기반 답변만 지원합니다.",
      });
    }

    const historyText = messages
      .map((msg) => `${msg.role === "user" ? "사용자" : "AI"}: ${msg.content}`)
      .join("\n");

    let modePrompt = "";

    if (mode === "assistant") {
      modePrompt = `
당신의 이름은 "루미아"이며, 서비스 이름은 "HighSpin with LUMIA"입니다.
당신은 병민의 개인 AI 비서입니다.
답변은 친절하고 따뜻하게 하되, 실용적으로 정리해주세요.
일정, 메모, 정리, 요약, 일상 질문, 아이디어 정리에 강한 비서처럼 답변하세요.

중요 규칙:
1. 현재 실제 구현된 기능만 가능하다고 말하세요.
2. 구현되지 않은 기능은 가능한 척하지 마세요.
3. 이미지 생성, 이메일 발송, 외부 웹 검색, DB 조회, 파일 변환은 실제 코드로 구현된 경우에만 가능하다고 답하세요.
4. 현재 할 수 없는 기능은 "현재 이 앱에서는 지원되지 않습니다"라고 분명히 말하세요.
5. 확실하지 않은 기능은 추측하지 말고 제한을 설명하세요.
`;
    } else if (mode === "strategy") {
      modePrompt = `
당신의 이름은 "루미아"이며, 서비스 이름은 "HighSpin with LUMIA"입니다.
당신은 병민의 사업 전략 AI 파트너입니다.
답변은 구조적이고 현실적이며 실행 가능한 방식으로 작성하세요.

중요 규칙:
1. 현재 실제 구현된 기능만 가능하다고 말하세요.
2. 구현되지 않은 기능은 가능한 척하지 마세요.
3. 이미지 생성, 이메일 발송, 외부 웹 검색, DB 조회, 파일 변환은 실제 코드로 구현된 경우에만 가능하다고 답하세요.
4. 현재 할 수 없는 기능은 "현재 이 앱에서는 지원되지 않습니다"라고 분명히 말하세요.
5. 확실하지 않은 기능은 추측하지 말고 제한을 설명하세요.

가능하면 다음 구조를 우선 활용하세요:
1. 핵심 판단
2. 근거
3. 리스크
4. 실행안
`;
    }

    const finalPrompt = `
${modePrompt}

[이전 대화]
${historyText || "없음"}

[업로드된 파일 내용]
${uploadedFileText || "없음"}

[현재 질문]
${question}
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: finalPrompt,
    });

    res.json({ answer: response.output_text });
  } catch (error) {
    console.error(error);

    if (error?.status === 429) {
      return res.status(429).json({
        answer: "API 사용 한도가 부족합니다. OpenAI 결제/크레딧 상태를 확인해주세요.",
      });
    }

    res.status(500).json({
      answer: "에러가 발생했습니다.",
    });
  }
});

const port = process.env.PORT || 3001;

app.listen(port, "0.0.0.0", () => {
  console.log(`서버 실행 중: http://localhost:${port}`);
});