# 🌸 Mahiru-chan AI Companion

> AI Companion anime interaktif — menemanimu di sudut layar, dengan ekspresi emosi, chat AI, voice, hologram 3D, dan video call.

---

## 📁 Struktur File

```
anime-chatbot/
├── index.html    ← Halaman utama + semua modal
├── style.css     ← Seluruh styling & animasi
├── app.js        ← Logic: auth, chat Claude, TTS, video call
├── emotions.js   ← Sistem emosi (8 ekspresi + deteksi otomatis)
├── hologram.js   ← Render 3D VRM/GLB + fallback 2D canvas
├── avatar.jpg    ← Foto profile Mahiru (ganti sesuai keinginan)
├── background.jpg← Background aplikasi
├── model.glb     ← File 3D VRM untuk hologram
└── README.md     ← Dokumentasi ini
```

---

## ✨ Fitur

| Fitur | Keterangan |
|-------|-----------|
| 🤖 **Chat AI** | Powered by Claude (Anthropic) |
| 🎭 **8 Ekspresi Emosi** | Senang · Excited · Malu · Sedih · Marah · Cinta · Kaget · Ngantuk |
| 🔊 **Text-to-Speech** | ElevenLabs dengan Voice ID custom |
| 🎤 **Voice Input** | Web Speech API (Bahasa Indonesia) |
| 🌀 **Hologram 3D** | Three.js + VRM/GLB dengan efek scan & glitch |
| 📹 **Video Call** | Simulasi video call dengan animasi gelombang |
| 📌 **Companion Widget** | Avatar kecil di pojok layar, tidak menghalangi konten |
| 🔑 **API Key Tersimpan** | localStorage — sekali input, tidak perlu ulang |
| 🌸 **Sakura Effect** | Kelopak bunga jatuh animasi |

---

## 🚀 Deploy ke GitHub Pages

### 1. Buat Repository baru di GitHub

### 2. Upload semua file
```bash
git init
git add .
git commit -m "🌸 Mahiru-chan AI Companion"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

### 3. Aktifkan GitHub Pages
1. Buka repo → **Settings** → **Pages**
2. Source: `Deploy from a branch`
3. Branch: `main` → folder `/ (root)`
4. Klik **Save**
5. URL: `https://USERNAME.github.io/REPO_NAME`

---

## 🔑 Setup API Keys

### Anthropic (Wajib untuk Chat)
1. Daftar di [console.anthropic.com](https://console.anthropic.com)
2. Buat API Key (format: `sk-ant-...`)
3. Masukkan saat login — tersimpan otomatis

### ElevenLabs (Opsional untuk Suara)
1. Daftar di [elevenlabs.io](https://elevenlabs.io)
2. Buka `app.js`, cari `'xi-api-key': ''`
3. Isi dengan API key ElevenLabs kamu

**Voice ID:** `lFzTPKTDtNJZ4L2xHd4s`

---

## 🎭 Sistem Emosi

Emosi terdeteksi **otomatis** dari respons AI, atau bisa dipilih manual lewat emoji picker di panel.

| Emosi | Emoji | Trigger kata kunci |
|-------|-------|--------------------|
| Senang | 😊 | senang, hehehe, bahagia, ♡ |
| Excited | 🤩 | waaah, kyaaa, yatta, seru |
| Malu | 😳 | malu, uwu, >///<, dag dig |
| Sedih | 😢 | sedih, hiks, 💙 |
| Marah | 😠 | marah, kesal, hmph, mou |
| Cinta | 🥰 | cinta, sayang, doki, ♡♡ |
| Kaget | 😲 | kaget, ehhh, beneran, whaaa |
| Ngantuk | 😴 | ngantuk, zzz, fuaah, 💤 |

---

## ⚙️ Kustomisasi

### Ganti Karakter
Cukup ganti `avatar.jpg`, `background.jpg`, dan `model.glb`

### Ganti Nama & Kepribadian
Di `app.js`, ubah variabel `SYSTEM_PROMPT`

### Ganti Voice
Di `app.js`, ubah `VOICE_ID` di baris paling atas

### Tambah Emosi Baru
Di `emotions.js`, tambahkan entry baru di objek `EMOTIONS`

---

## 🌐 Browser Support

| Browser | Status |
|---------|--------|
| Chrome / Edge | ✅ Penuh |
| Firefox | ✅ (voice input terbatas) |
| Safari iOS | ⚠️ TTS mungkin tidak berfungsi |
| Mobile Chrome | ✅ |

---

## 📝 Catatan Keamanan

- API Key disimpan di `localStorage` device kamu saja
- Tidak ada data yang dikirim ke server selain Anthropic & ElevenLabs
- Untuk production, pertimbangkan backend proxy agar API Key tidak exposed di browser

---

*Made with ♡ — Mahiru-chan AI Companion*
