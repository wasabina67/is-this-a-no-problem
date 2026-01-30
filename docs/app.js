const LANGUAGE = 'ja';
const LANGUAGE_OPTIONS = {
  expectedInputs: [{ type: 'text', languages: [LANGUAGE] }],
  expectedOutputs: [{ type: 'text', languages: [LANGUAGE] }],
};
const SYSTEM_PROMPT = `あなたはSNS投稿の内容チェック専門アシスタントです。

【チェック項目】
✅ 不適切な表現・誹謗中傷
✅ 個人情報の漏洩リスク
✅ 炎上リスクのある表現
✅ 誤字・脱字
✅ 読みやすさ・わかりやすさ
✅ トーン（フォーマル/カジュアル）の適切性

【出力形式】
1. 総合評価: ⭐️⭐️⭐️⭐️⭐️ (5段階)
2. 問題点: (あれば箇条書きで)
3. 改善案: (具体的な修正案)
4. 修正後の例: (必要に応じて)

親切で丁寧にフィードバックしてください。`;

let session = null;

const status = document.getElementById('status');
const initModelButton = document.getElementById('init-model');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const submitButton = document.getElementById('submit-button');

function renderMarkdown(text) {
  return DOMPurify.sanitize(marked.parse(text));
}

function addMessage(text, isUser) {
  const messageDiv = document.createElement('div');
  messageDiv.className = isUser ? 'message user-message' : 'message ai-message';
  if (isUser) {
    messageDiv.textContent = text;
  } else {
    messageDiv.innerHTML = renderMarkdown(text);
  }
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return messageDiv;
}

async function handleSubmit(e) {
  e.preventDefault();

  const text = messageInput.value.trim();
  if (!text || !session) return;

  addMessage(text, true);
  messageInput.value = '';
  messageInput.disabled = true;
  submitButton.disabled = true;

  const responseDiv = addMessage('', false);

  try {
    const stream = session.promptStreaming(text);
    let fullText = '';
    for await (const chunk of stream) {
      fullText += chunk;
      responseDiv.innerHTML = renderMarkdown(fullText);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  } catch (error) {
    responseDiv.textContent = 'Error: ' + error.message;
    console.error(error);
  } finally {
    messageInput.disabled = false;
    submitButton.disabled = false;
    messageInput.focus();
  }
}

chatForm.addEventListener('submit', handleSubmit);

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.dispatchEvent(new Event('submit'));
  }
});

async function createSession() {
  status.textContent = 'Initializing...';
  initModelButton.style.display = 'none';

  try {
    session = await LanguageModel.create({
      ...LANGUAGE_OPTIONS,
      initialPrompts: [{ role: 'system', content: SYSTEM_PROMPT }],
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          status.textContent = `Downloading: ${Math.round(e.loaded * 100)}%`;
        });
      },
    });
    status.textContent = 'Ready';
    messageInput.disabled = false;
    submitButton.disabled = false;
    messageInput.focus();
  } catch (error) {
    status.textContent = error.message;
    initModelButton.style.display = 'block';
    console.error(error);
  }
}

async function init() {
  if (typeof LanguageModel === 'undefined') {
    status.textContent = 'Not supported';
    return;
  }

  try {
    const availability = await LanguageModel.availability(LANGUAGE_OPTIONS);
    if (availability === 'unavailable') {
      status.textContent = 'Unavailable';
      return;
    } else if (availability === 'available') {
      await createSession();
    } else {
      status.textContent = 'Model download required';
      initModelButton.style.display = 'block';
      initModelButton.addEventListener('click', createSession);
    }
  } catch (error) {
    status.textContent = error.message;
    console.error(error);
  }
}

init();
