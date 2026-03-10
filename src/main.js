const button = document.getElementById("ask");
const input = document.getElementById("question");
const chat = document.getElementById("chat");
const clearBtn = document.getElementById("clearBtn");
const fileInput = document.getElementById("fileInput");
const plusBtn = document.getElementById("plusBtn");
const modeSelect = document.getElementById("modeSelect");
const fileName = document.getElementById("fileName");

const featureContent = document.getElementById("featureContent");
const toggleFeatureBtn = document.getElementById("toggleFeatureBtn");

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

let messages = JSON.parse(localStorage.getItem("lumia_messages")) || [];
let uploadedFileText = localStorage.getItem("lumia_file_text") || "";
let uploadedFileName = localStorage.getItem("lumia_file_name") || "";
let currentMode = localStorage.getItem("lumia_mode") || "assistant";

modeSelect.value = currentMode;

function saveState() {
  localStorage.setItem("lumia_messages", JSON.stringify(messages));
  localStorage.setItem("lumia_file_text", uploadedFileText);
  localStorage.setItem("lumia_file_name", uploadedFileName);
  localStorage.setItem("lumia_mode", currentMode);
}

function addMessage(text, type) {
  const div = document.createElement("div");
  div.classList.add("message", type);
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

function typeText(text, element, speed = 16) {
  return new Promise((resolve) => {
    let i = 0;
    element.innerText = "";

    const timer = setInterval(() => {
      element.innerText += text.charAt(i);
      i++;
      chat.scrollTop = chat.scrollHeight;

      if (i >= text.length) {
        clearInterval(timer);
        resolve();
      }
    }, speed);
  });
}

function addSystemMessage(text) {
  addMessage(text, "system");
}

function updateFileName() {
  if (uploadedFileName) {
    fileName.innerText = `첨부된 파일: ${uploadedFileName}`;
  } else {
    fileName.innerText = "";
  }
}

function renderSavedMessages() {
  chat.innerHTML = "";

  if (messages.length === 0) {
    addSystemMessage("루미아가 준비되었습니다. 질문을 시작하세요.");
    return;
  }

  messages.forEach((msg) => {
    if (msg.role === "user") {
      addMessage(msg.content, "user");
    } else if (msg.role === "assistant") {
      addMessage(msg.content, "ai");
    }
  });
}

async function askAI() {
  const question = input.value.trim();
  if (!question) return;

  addMessage(question, "user");
  messages.push({ role: "user", content: question });
  saveState();
  input.value = "";

  const loadingBubble = addMessage("루미아가 생각중입니다...", "ai");

  try {
    const res = await fetch(`${API_URL}/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        messages,
        uploadedFileText,
        mode: currentMode,
      }),
    });

    const data = await res.json();

    loadingBubble.remove();

    const aiBubble = addMessage("", "ai");
    await typeText(data.answer, aiBubble);

    messages.push({ role: "assistant", content: data.answer });
    saveState();
  } catch (error) {
    loadingBubble.remove();
    addMessage("서버 연결 실패 또는 응답 오류입니다.", "ai");
  }
}

button.addEventListener("click", askAI);

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    button.click();
  }
});

clearBtn.addEventListener("click", () => {
  messages = [];
  uploadedFileText = "";
  uploadedFileName = "";
  chat.innerHTML = "";
  fileInput.value = "";

  localStorage.removeItem("lumia_messages");
  localStorage.removeItem("lumia_file_text");
  localStorage.removeItem("lumia_file_name");

  updateFileName();
  addSystemMessage("대화와 업로드된 파일 정보가 초기화되었습니다.");
});

plusBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];

  if (!file) {
    return;
  }

  uploadedFileName = file.name;
  updateFileName();

  try {
    const text = await file.text();
    uploadedFileText = text;
    saveState();
    addSystemMessage(`파일 업로드 완료: ${file.name}`);
  } catch (error) {
    uploadedFileText = "";
    saveState();
    addSystemMessage("파일을 읽는 중 오류가 발생했습니다.");
  }
});

modeSelect.addEventListener("change", () => {
  currentMode = modeSelect.value;
  saveState();

  if (currentMode === "assistant") {
    addSystemMessage("현재 모드: Personal Assistant");
  } else if (currentMode === "strategy") {
    addSystemMessage("현재 모드: Business Strategy");
  }
});

toggleFeatureBtn.addEventListener("click", () => {
  const isHidden = featureContent.classList.contains("hidden");

  if (isHidden) {
    featureContent.classList.remove("hidden");
    toggleFeatureBtn.innerText = "닫기";
  } else {
    featureContent.classList.add("hidden");
    toggleFeatureBtn.innerText = "기능 보기";
  }
});

renderSavedMessages();
updateFileName();

if (uploadedFileText && uploadedFileName) {
  addSystemMessage(`이전 업로드 파일이 유지되고 있습니다: ${uploadedFileName}`);
}

if (currentMode === "assistant") {
  addSystemMessage("현재 모드: Personal Assistant");
} else {
  addSystemMessage("현재 모드: Business Strategy");
}

toggleFeatureBtn.innerText = featureContent.classList.contains("hidden")
  ? "기능 보기"
  : "닫기";