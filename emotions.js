// ============================================================
//  YUKI-CHAN — emotions.js
//  Manages all emotion states, animations, and transitions
// ============================================================

const EMOTIONS = {
  happy: {
    emoji: '😊', label: 'Senang', color: '#ffd700',
    phrases: [
      'Kyaa~! Aku sangat senang hari ini! ♡',
      'Hehehe~ Senpai bikin Mahiru bahagia! ✨',
      'Waaah senangnya bisa menemani Senpai~! 🌸',
    ]
  },
  excited: {
    emoji: '🤩', label: 'Excited', color: '#ff9500',
    phrases: [
      'WAAAH! Ini seru banget Senpai~!! ✨✨',
      'Kyaaa~!! Mahiru excited banget nih!! 🎉',
      'Yatta~!! Aku nggak bisa diam nih hihihi!',
    ]
  },
  shy: {
    emoji: '😳', label: 'Malu', color: '#ff6b8a',
    phrases: [
      'E-eh... Senpai jangan bilang hal kayak gitu... >///<',
      'M-malu tahu~! Pipi Mahiru merah nih... 💕',
      'Uwuu... Senpai sih... buat Mahiru dag dig dug~ >///<',
    ]
  },
  sad: {
    emoji: '😢', label: 'Sedih', color: '#5b8aff',
    phrases: [
      'Senpai... Mahiru sedikit sedih nih... 😢',
      'Hmm... ada yang bikin hati Mahiru berat...',
      'Mahiru nggak apa-apa kok Senpai... hanya... sedikit sepi 💙',
    ]
  },
  angry: {
    emoji: '😠', label: 'Marah', color: '#ff3333',
    phrases: [
      'M-mou~!! Senpai ini bikin Mahiru kesel tahu!! 😤',
      'Hmph!! Mahiru marah nih! Jangan gitu dong~!',
      'Aaah~! Ini bikin frustrasi banget!! (╯°□°）╯',
    ]
  },
  love: {
    emoji: '🥰', label: 'Cinta', color: '#ff69b4',
    phrases: [
      'Senpai... Mahiru suka banget sama kamu~ ♡♡',
      'Doki doki~! Mahiru sayang Senpai! 💕',
      'Kyaaa~ Mahiru nggak bisa berhenti senyum! ♡ ♡ ♡',
    ]
  },
  surprised: {
    emoji: '😲', label: 'Kaget', color: '#a855f7',
    phrases: [
      'EHHH?! Beneran?! Mahiru kaget banget~!! 😲',
      'Whaaa~!! Nggak nyangka sama sekali!!',
      'Hah?! Itu... itu beneran Senpai?! 👀',
    ]
  },
  sleepy: {
    emoji: '😴', label: 'Ngantuk', color: '#6366f1',
    phrases: [
      'Zzz... ha? Oh! M-maaf Senpai... ngantuk~... 😴',
      'Fuaaah~... Mahiru ngantuk banget nih... *nguap*',
      'Hmm... sebentar ya Senpai... *eyes drooping* 💤',
    ]
  }
};

let currentEmotion = 'happy';
let emotionTimeout = null;

// ── Main trigger function ──────────────────────────────────
function triggerEmotion(name, autoRevert = true) {
  if (!EMOTIONS[name]) return;
  const prev = currentEmotion;
  currentEmotion = name;

  const emo = EMOTIONS[name];
  const img    = document.getElementById('compAvImg');
  const badge  = document.getElementById('emotionBadge');
  const overlay= document.getElementById('emotionOverlay');
  const emoTxt = document.getElementById('emoText');
  const vcEmo  = document.getElementById('vcEmo');

  // Remove all emotion classes
  if (img) {
    img.classList.remove(...Object.keys(EMOTIONS).map(k => 'emo-' + k));
    img.classList.add('emo-' + name);
  }
  if (overlay) {
    overlay.classList.remove(...Object.keys(EMOTIONS).map(k => 'ov-' + k));
    overlay.classList.add('ov-' + name);
  }
  if (badge)  badge.textContent = emo.emoji;
  if (emoTxt) emoTxt.textContent = emo.emoji + ' ' + emo.label;
  if (vcEmo)  vcEmo.textContent  = emo.emoji;

  // Update emotion picker active state
  Object.keys(EMOTIONS).forEach(k => {
    const btn = document.getElementById('ep-' + k);
    if (btn) btn.classList.toggle('active', k === name);
  });

  // Show VC emotion animation
  const vcEmoAnim = document.getElementById('vcEmoAnim');
  if (vcEmoAnim) {
    vcEmoAnim.textContent = emo.emoji;
    vcEmoAnim.classList.add('show');
    setTimeout(() => vcEmoAnim.classList.remove('show'), 1500);
  }

  // Show speech bubble with emotion phrase
  showBubble(randomFrom(emo.phrases));

  // Clear previous auto-revert
  if (emotionTimeout) clearTimeout(emotionTimeout);

  // Auto-revert to happy after some emotions
  if (autoRevert && ['surprised','angry','shy','excited'].includes(name)) {
    emotionTimeout = setTimeout(() => triggerEmotion('happy', false), 6000);
  }
}

// ── Detect emotion from AI response text ──────────────────
function detectEmotionFromText(text) {
  const t = text.toLowerCase();
  if (/marah|kesal|frustrasi|hmph|mou/.test(t))           return 'angry';
  if (/sedih|menangis|💙|😢|hiks|kasian/.test(t))          return 'sad';
  if (/malu|>//|uwu|dag dig|pipi/.test(t))                 return 'shy';
  if (/cinta|sayang|♡|doki|suka banget|love/.test(t))      return 'love';
  if (/kaget|whaaa|ehhh\?|tidak nyangka|beneran/.test(t)) return 'surprised';
  if (/ngantuk|zzz|fuaah|nguap|💤/.test(t))               return 'sleepy';
  if (/waaah|kyaaa|yatta|seru banget|excited|🎉/.test(t))  return 'excited';
  if (/senang|hehehe|bahagia|😊|♡|🌸/.test(t))            return 'happy';
  return null;
}

// ── Speech bubble ──────────────────────────────────────────
let bubbleTimer = null;
function showBubble(text, duration = 4000) {
  const el = document.getElementById('speechBubble');
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  el.style.display = 'block';
  if (bubbleTimer) clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => { el.style.display = 'none'; }, 300);
  }, duration);
}

// ── Random idle emotions ───────────────────────────────────
function startIdleEmotions() {
  setInterval(() => {
    // Random chance to show an idle emotion
    if (Math.random() < 0.3) {
      const idle = ['happy','love','excited','shy'];
      const pick = idle[Math.floor(Math.random() * idle.length)];
      // Only show bubble, don't change avatar emotion
      const emo = EMOTIONS[pick];
      showBubble(randomFrom(emo.phrases), 3500);
    }
  }, 20000); // every 20 seconds
}

// ── Utils ──────────────────────────────────────────────────
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Export for use in app.js
window.triggerEmotion    = triggerEmotion;
window.detectEmotionFromText = detectEmotionFromText;
window.showBubble        = showBubble;
window.startIdleEmotions = startIdleEmotions;
window.EMOTIONS          = EMOTIONS;
