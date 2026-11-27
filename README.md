<p align="center">
  <img src="images/studydesk_lite_logo.svg" alt="StudyDesk Lite Logo" width="300">
</p>

<h1 align="center">StudyDesk Lite</h1>

<p align="center">
  A lightweight, offline-first personal study dashboard designed to help you manage tasks, track exam preparation, take notes, and maintain focus.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=flat-square&logo=pwa&logoColor=white" alt="PWA">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License: MIT">
</p>

---

## ✨ Features

### 👨‍🎓 Study Dashboard

| Feature | Description |
|---|---|
| 🏠 **Home Dashboard** | Real-time stats, interactive calendar, upcoming exams, and pending tasks |
| ✅ **Task Manager** | Create, update, delete, and toggle tasks. Filter by active, completed, or overdue. **Drag-and-drop** to reorder tasks. |
| 📅 **Exam Planner** | Schedule exams with live countdown timers. Add, edit, delete, and **drag-and-drop** study topics. |
| ⏱️ **Pomodoro Timer** | Focus timer with custom settings, audio alarms, and automatic session tracking (skipped sessions are not counted) |
| 📝 **Notes** | Auto-saving master-detail editor with pinned notes, search with highlighted matches, word count, and manual save (Ctrl+S) |
| 👤 **Settings** | Update your display name with keyboard support (Enter to save, Escape to cancel) |
| ❓ **Help Center** | Detailed, easy-to-understand built-in guides for every feature |
| 🎨 **Themes** | Dark and light mode, persisted across page reloads |

### 🛡️ Core Capabilities

| Feature | Description |
|---|---|
| 📱 **PWA & Offline** | Installable on your phone's home screen. Works 100% offline. |
| 💾 **Local Storage** | No backend required. All data is saved securely in your browser. |
| 📤 **Data Backup** | Export and import your data as a JSON file to move between devices. Backups are validated before import, and invalid files are rejected. |
| 🔒 **Smart Buttons** | Save buttons automatically disable when no changes are made, and turn amber when you make an edit. |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| **Storage** | Browser `localStorage` |
| **Architecture** | Static Multi-Page App (no build step, no frameworks) |
| **Offline Support** | Service Worker (Cache API) |

---

## 🔒 Privacy & Security Highlights

- 🔐 **No Backend:** Your data never leaves your device. There are no servers, trackers, or databases.
- 🛡️ **XSS Protection:** User-entered text is escaped with a custom helper (`esc()`) before it is rendered, and imported backups are validated before they are saved.
- 💾 **Data Ownership:** You own your data. You can export it to JSON or permanently wipe it at any time via the Settings page.

---

## 🚀 How to Run Locally

### Prerequisites

- Any modern web browser (Chrome, Safari, Firefox, Edge)
- *Optional:* Python or Node.js installed on your computer (only needed if the double-click method doesn't work)

### Step 1 — Download the Project

Open your terminal (Command Prompt / PowerShell on Windows, or Terminal on Mac/Linux) and run these commands one by one:

```bash
git clone https://github.com/anuraj-js/studydesk-lite.git
cd studydesk-lite
```

> If you don't have Git installed, you can also click the green **Code** button on the GitHub page, choose **Download ZIP**, and extract the folder.

### Step 2 — Run Locally

Because this app is built entirely with plain HTML, CSS, and JavaScript, there is no installation or build step required.

**The easiest way (no tools needed):**

1. Open the `studydesk-lite` folder you just downloaded.
2. Double-click the `index.html` file.
3. It will open in your web browser and the dashboard will load.

**If pages won't load (using a local server):**

Sometimes web browsers block websites from loading other files when you open them directly from your hard drive (a security rule called CORS). If you click a link to the Tasks or Notes page and it shows a blank screen or an error, use one of these simple commands to start a local server.

- **If you have Python installed:**

  ```bash
  # Open your terminal inside the studydesk-lite folder and run:
  python3 -m http.server 3000
  ```

  *(On Windows, you might need to type `python` instead of `python3`.)*

- **If you have Node.js installed:**

  ```bash
  # Open your terminal inside the studydesk-lite folder and run:
  npx serve .
  ```

Once the server is running, open your browser and go to `http://localhost:3000`. Everything will work perfectly.

### Step 3 — Deploy to GitHub Pages (Free Hosting)

If you want to put your own version of this app on the internet for free:

1. Make sure your code is pushed to a repository on your GitHub account.
2. Go to your repository page on GitHub and click the **Settings** tab at the top.
3. On the left sidebar, scroll down and click **Pages**.
4. Under **Build and deployment**, set the **Source** dropdown to **Deploy from a branch**.
5. Under **Branch**, select `main` (or `master`) and leave the folder as `/ (root)`.
6. Click **Save**.
7. Wait 1–2 minutes, then refresh the page. GitHub will give you a live link (usually `https://<your-username>.github.io/studydesk-lite/`) that you can share with anyone.

---

## 📁 Project Structure

```text
studydesk-lite/
│
├── css/
│   ├── components.css
│   ├── features.css
│   ├── layout.css
│   ├── responsive.css
│   └── variables.css
│
├── html/
│   ├── exams.html
│   ├── help.html
│   ├── notes.html
│   ├── pomodoro.html
│   ├── settings.html
│   └── tasks.html
│
├── images/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── studydesk_lite_logo.svg
│
├── js/
│   ├── calendar.js
│   ├── dashboard.js
│   ├── dialog.js
│   ├── exams.js
│   ├── nav.js
│   ├── notes.js
│   ├── pomodoro.js
│   ├── settings.js
│   ├── storage.js
│   ├── tasks.js
│   ├── theme.js
│   ├── toast.js
│   └── utils.js
│
├── index.html
├── LICENSE
├── manifest.json
├── README.md
├── sound.mp3
└── sw.js
```

---

## 📄 License

This project is licensed under the MIT License — you are free to use, modify, and distribute this project for personal or commercial purposes, as long as the original license and copyright notice are included.

See the [LICENSE](LICENSE) file for full details.

---

## 📬 Contact

**Anuraj Singh**

- 🐙 GitHub: [@anuraj-js](https://github.com/anuraj-js)
- 📧 Email: [anuraj1q@gmail.com](mailto:anuraj1q@gmail.com)