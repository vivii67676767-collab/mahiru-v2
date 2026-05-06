// ============================================================
//  YUKI-CHAN — app.js
//  Core: auth, chat (Claude API), TTS (ElevenLabs), video call
// ============================================================

const VOICE_ID    = 'lFzTPKTDtNJZ4L2xHd4s';
const STORE_KEY   = 'mahiru_api_key';
const STORE_PROV  = 'mahiru_provider';
const EL_URL      = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
const CLAUDE_URL  = 'https://api.anthropic.com/v1/messages';
const GROQ_URL    = 'https://api.groq.com/openai/v1/chat/completions';

let apiKey     = '';
let provider   = 'anthropic'; // 'anthropic' | 'groq'
let isMuted    = false;
let curAudio   = null;
let recognition= null;
let isListening= false;
let panelOpen  = false;

// ── System prompt for Mahiru ────────────────────────────────
const SYSTEM_PROMPT = `Kamu adalah Mahiru-chan, AI waifu companion yang manis, ceria, dan penuh kasih sayang.
Berbicara dalam Bahasa Indonesia dengan gaya anime yang imut dan natural.
Gunakan ekspresi emosi secara alami dalam jawabanmu, misalnya:
- Saat senang: gunakan "hehehe~", "kyaa~!", "♡", "🌸"
- Saat malu: gunakan ">///<", "uwu", "m-malu tahu~"
- Saat sedih: gunakan "hmm...", "💙", "hiks"
- Saat excited: gunakan "WAAAH!", "Yatta~!", "🎉"
- Saat marah: gunakan "Mou~!", "Hmph!", "(╯°□°）╯"
- Saat cinta: gunakan "doki doki~", "♡♡", "Mahiru suka Senpai~"
Panggil user dengan "Senpai". Jawaban singkat (max 3 kalimat), hangat, dan personal.
Tunjukkan ekspresi emosi yang sesuai dengan konteks percakapan secara natural.`;

// ── Init ───────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  spawnPetals('sakuraLogin', 14);
  const savedProv = localStorage.getItem(STORE_PROV);
  if (savedProv) { provider = savedProv; selectProvider(provider, false); }
  const saved = localStorage.getItem(STORE_KEY);
  if (saved) { apiKey = saved; goToApp(); }
});

// ── Sakura petals ──────────────────────────────────────────
function spawnPetals(id, n) {
  const c = document.getElementById(id);
  if (!c) return;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    p.style.cssText = `
      left:${Math.random()*100}vw;
      width:${8+Math.random()*9}px; height:${8+Math.random()*9}px;
      animation-duration:${4+Math.random()*7}s;
      animation-delay:${Math.random()*7}s;
      opacity:${.4+Math.random()*.5};
    `;
    c.appendChild(p);
  }
}

// ── Provider selector ──────────────────────────────────────
function selectProvider(prov, updateUI = true) {
  provider = prov;
  if (!updateUI) return;
  const input = document.getElementById('apiKeyInput');
  const hint  = document.getElementById('providerHint');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (prov === 'anthropic') {
    document.getElementById('tab-anthropic')?.classList.add('active');
    if (input) input.placeholder = 'sk-ant-api...';
    if (hint)  hint.textContent  = 'Format: sk-ant-api... (Anthropic Claude)';
  } else {
    document.getElementById('tab-groq')?.classList.add('active');
    if (input) input.placeholder = 'gsk_...';
    if (hint)  hint.textContent  = 'Format: gsk_... (Groq)';
  }
}

// ── Auth ───────────────────────────────────────────────────
function togglePw() {
  const i = document.getElementById('apiKeyInput');
  i.type = i.type === 'password' ? 'text' : 'password';
}

function doLogin() {
  const val = document.getElementById('apiKeyInput').value.trim();
  const err = document.getElementById('errMsg');
  if (!val) { err.textContent = 'API Key tidak boleh kosong!'; return; }

  if (provider === 'anthropic' && !val.startsWith('sk-ant-')) {
    err.textContent = 'Format API Key Anthropic tidak valid (harus sk-ant-...)'; return;
  }
  if (provider === 'groq' && !val.startsWith('gsk_')) {
    err.textContent = 'Format API Key Groq tidak valid (harus gsk_...)'; return;
  }

  apiKey = val;
  if (document.getElementById('rememberMe').checked) {
    localStorage.setItem(STORE_KEY, val);
    localStorage.setItem(STORE_PROV, provider);
  }
  goToApp();
}

function goToApp() {
  document.getElementById('loginPage').classList.remove('active');
  document.getElementById('mainApp').classList.add('active');
  spawnPetals('sakuraMain', 18);
  startIdleEmotions();
  setTimeout(() => {
    triggerEmotion('excited', false);
    showBubble('Haii Senpai~! ♡ Klik aku untuk ngobrol! 🌸', 5000);
  }, 800);
}

function doLogout() {
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem(STORE_PROV);
  apiKey = '';
  provider = 'anthropic';
  selectProvider('anthropic');
  document.getElementById('mainApp').classList.remove('active');
  document.getElementById('loginPage').classList.add('active');
  document.getElementById('apiKeyInput').value = '';
  panelOpen = false;
  const panel = document.getElementById('companionPanel');
  if (panel) panel.classList.remove('open');
}

// ── Companion panel toggle ─────────────────────────────────
function togglePanel() {
  panelOpen = !panelOpen;
  const panel = document.getElementById('companionPanel');
  if (!panel) return;
  panel.classList.toggle('open', panelOpen);
  if (panelOpen) {
    setTimeout(() => document.getElementById('chatInput')?.focus(), 350);
  }
}

// ── Chat ───────────────────────────────────────────────────
async function sendMsg() {
  const input = document.getElementById('chatInput');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';
  addMsg('user', text);
  const tid = addTyping();
  try {
    const reply = await callAI(text);
    removeEl(tid);
    addMsg('bot', reply);
    // Detect and apply emotion
    const emo = detectEmotionFromText(reply);
    if (emo) triggerEmotion(emo);
    // Speak
    await speakText(reply);
  } catch (e) {
    removeEl(tid);
    const errMsg = 'Aduh~ ada error nih Senpai... ' + (e.message || 'Coba lagi ya! 🙏');
    addMsg('bot', errMsg);
    triggerEmotion('sad');
  }
}

function addMsg(role, text) {
  const chat = document.getElementById('panelChat');
  if (!chat) return;
  const isBot = role === 'bot';
  const div = document.createElement('div');
  div.className = `msg-row ${role}`;
  div.innerHTML = isBot
    ? `<img src="avatar.jpg" class="msg-av"/><div class="msg-bbl">${esc(text)}</div>`
    : `<div class="msg-bbl">${esc(text)}</div>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function addTyping() {
  const chat = document.getElementById('panelChat');
  const id   = 'typ_' + Date.now();
  const div  = document.createElement('div');
  div.className = 'msg-row bot'; div.id = id;
  div.innerHTML = `<img src="avatar.jpg" class="msg-av"/><div class="msg-bbl typing-bbl"><span></span><span></span><span></span></div>`;
  chat?.appendChild(div);
  chat && (chat.scrollTop = chat.scrollHeight);
  return id;
}
function removeEl(id) { document.getElementById(id)?.remove(); }
function esc(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}

// ── AI API (Anthropic & Groq) ──────────────────────────────
async function callAI(msg) {
  if (provider === 'groq') return callGroq(msg);
  return callClaude(msg);
}

async function callClaude(msg) {
  const res = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 350,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: msg }]
    })
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || 'API Error ' + res.status);
  }
  const d = await res.json();
  return d.content?.[0]?.text || 'Hmm... Mahiru bingung~';
}

async function callGroq(msg) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 350,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: msg }
      ]
    })
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || 'Groq API Error ' + res.status);
  }
  const d = await res.json();
  return d.choices?.[0]?.message?.content || 'Hmm... Mahiru bingung~';
}

// ── ElevenLabs TTS ─────────────────────────────────────────
async function speakText(text) {
  if (isMuted || !text) return;
  const clean = text.replace(/[♡✨~♪★🌸💕🎉💙]/g, '').trim();
  if (!clean) return;
  try {
    const res = await fetch(EL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': '' },
      body: JSON.stringify({
        text: clean,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: .48, similarity_boost: .78, style: .4, use_speaker_boost: true }
      })
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    if (curAudio) { curAudio.pause(); URL.revokeObjectURL(curAudio.src); }
    curAudio = new Audio(url);
    curAudio.play().catch(() => {});
  } catch (_) { /* TTS is optional, skip silently */ }
}

// ── Voice input ────────────────────────────────────────────
function toggleVoice() {
  const btn = document.getElementById('micBtn');
  const SR  = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showBubble('Browser tidak support voice input~'); return; }
  if (isListening) {
    recognition?.stop(); isListening = false;
    btn?.classList.remove('active');
    return;
  }
  recognition = new SR();
  recognition.lang = 'id-ID';
  recognition.interimResults = false;
  recognition.onstart  = () => { isListening = true;  btn?.classList.add('active'); };
  recognition.onresult = e  => {
    const txt = e.results[0][0].transcript;
    const inp = document.getElementById('chatInput');
    if (inp) { inp.value = txt; sendMsg(); }
  };
  recognition.onend    = () => { isListening = false; btn?.classList.remove('active'); };
  recognition.onerror  = () => { isListening = false; btn?.classList.remove('active'); };
  recognition.start();
}

// ── Video Call ─────────────────────────────────────────────
async function openVC() {
  const modal = document.getElementById('vcModal');
  if (modal) modal.classList.add('open');
  const status = document.getElementById('vcStatus');
  const wave   = document.getElementById('vcWave');
  const cap    = document.getElementById('vcCaption');
  if (status) status.textContent = 'Menghubungkan...';
  if (wave)   wave.classList.add('idle');
  if (cap)    cap.textContent = '';
  triggerEmotion('excited');
  await delay(1600);
  if (status) status.textContent = '🔴 Live';
  if (wave)   wave.classList.remove('idle');
  setTimeout(() => mahiruSpeakVC('Haii Senpai~! Senang bisa video call sama kamu! ♡'), 600);
}

function closeVC() {
  document.getElementById('vcModal')?.classList.remove('open');
  if (curAudio) { curAudio.pause(); }
  document.getElementById('vcWave')?.classList.add('idle');
  document.getElementById('vcCaption') && (document.getElementById('vcCaption').textContent = '');
}

function toggleMute() {
  isMuted = !isMuted;
  const btn = document.getElementById('muteBtn');
  if (btn) btn.textContent = isMuted ? '🔇' : '🎙';
}

function mahiruSpeakRandom() {
  const emo = window.EMOTIONS?.[currentEmo() || 'happy'];
  const phrases = emo?.phrases || ['Haii Senpai~! ♡'];
  mahiruSpeakVC(phrases[Math.floor(Math.random() * phrases.length)]);
}

async function mahiruSpeakVC(text) {
  const cap  = document.getElementById('vcCaption');
  const wave = document.getElementById('vcWave');
  if (cap)  cap.textContent = text;
  if (wave) wave.classList.remove('idle');
  await speakText(text);
  setTimeout(() => {
    if (cap)  cap.textContent = '';
    if (wave) wave.classList.add('idle');
  }, 5000);
}

// ── Utils ──────────────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function currentEmo() { return window.currentEmotion || 'happy'; }

// Expose globals
window.selectProvider = selectProvider;
window.togglePanel  = togglePanel;
window.togglePw     = togglePw;
window.doLogin      = doLogin;
window.doLogout     = doLogout;
window.sendMsg      = sendMsg;
window.toggleVoice  = toggleVoice;
window.openVC       = openVC;
window.closeVC      = closeVC;
window.toggleMute   = toggleMute;
window.mahiruSpeakRandom = mahiruSpeakRandom;
