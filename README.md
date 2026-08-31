# PosturePing Web · Versiune complet funcțională

Aplicație web 100% funcțională, fără backend, fără cont, fără reclame.
Rulează în orice browser modern, persistă datele în localStorage.

**Live:** https://garconai93.github.io/postureping-web/

## ✨ Ce face

- ⏲ **Timer 25 min** (configurabil: 20/25/30/45)
- 🧘 **Exerciții ghidate 60s** cu ilustrații SVG animate (6 exerciții: gât, umeri, ochi, spate, încheieturi, respirație 4-7-8)
- 🎯 **Program personalizat** generat pe baza unui diagnostic de 8 întrebări
- 📊 **Dashboard cu streak, heatmap 90 zile, statistici**
- 🔔 **Notificări browser** (Web Notifications API) + sunet + vibrație (mobil)
- 📄 **Export PDF lunar** pentru physiotherapist
- 📲 **PWA** — Add to Home Screen pe iOS/Android
- 🌐 **Share API** — trimite unui coleg
- 🔒 **Privacy-first** — toate datele în localStorage, zero servere
- 📴 **Offline** — service worker cache complet

## � Structură

```
postureping-web/
├── index.html       Landing page
├── onboarding.html  8 întrebări diagnostic
├── app.html         Dashboard principal
├── session.html     Exercițiu live cu timer
├── manifest.json    PWA manifest
├── sw.js            Service worker (offline)
├── css/app.css      Design system complet
├── js/
│   ├── store.js       localStorage wrapper
│   ├── exercises.js   6 exerciții + buildProgram()
│   ├── notifications.js  Web Notif + beep + vibrate
│   ├── timer.js       Pomodoro-style timer
│   ├── app.js         Toast + nav + SW register
│   ├── onboarding.js  Flow 8 pași
│   ├── dashboard.js   Stats + heatmap + export PDF
│   └── session.js     Live exercițiu
└── assets/
    ├── icons/      PWA icons (32, 180, 192, 512)
    └── exercises/  6 SVG-uri animate
```

## 🚀 Quick start

```
1. Deschide index.html → click "Setup 90 sec"
2. Răspunzi la 8 întrebări
3. Ajungi în dashboard → click "Pornește" timer
4. La pauză primești notificare → click → exercițiu ghidat
```

Sau direct: `index.html → Deschide dashboard` (vezi demo cu date goale).

## 💡 Design decisions

- **Fără framework**: Vanilla JS pentru zero dependencies și load instant
- **Single-file CSS**: Design tokens în `:root`, totul într-un fișier
- **localStorage > backend**: Privacy by default, zero hosting cost
- **SVG animat** în loc de video/gif: scalabil, lightweight, fără dependencies
- **Web Notifications + Service Worker**: experiență nativă fără Play/App Store
- **PDF prin `window.print()`**: zero libs externe, native browser

## 📊 Metrici vizate

- Setup complet în < 90 secunde (onboarding testat)
- 4 exerciții/zi × 60s = 4 min/zi active
- D7 retention target: > 40% (măsurat prin ultimul streak)

## 🔮 Roadmap

- [ ] Phase 2: Export JSON pentru backup cross-device
- [ ] Phase 2: Web Bluetooth API pt Apple Watch real
- [ ] Phase 3: TTS pentru exerciții (ElevenLabs / OpenAI)
- [ ] Phase 3: Break-buddy cu WebRTC peer-to-peer
- [ ] Phase 4: iOS/Android nativ (Swift + Kotlin)

## � Licență

MIT — design original, cod original, fără template-uri copiate.
