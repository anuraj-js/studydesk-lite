<p align="center">
  <img src="images/studydesk_lite_logo.svg" alt="StudyDesk Lite Logo" width="300">
</p>

# StudyDesk Lite

A lightweight, fully frontend personal study dashboard built with vanilla HTML, CSS, and JavaScript. No frameworks, no build step, no backend — just open and use.

Live at: https://anuraj-js.github.io/studydesk-lite

---

## Features

- **Dashboard** — Live clock with 12/24-hour toggle, daily stats summary, quick view of pending tasks and upcoming exams
- **Task Manager** — Add tasks with priority and due date, filter by All / Active / Completed / Overdue, edit and delete, overdue highlighting
- **Exam Planner** — Per-exam topic tracking with progress bar, live countdown timer, full CRUD
- **Notes** — Clean Master-Detail interface (list view -> full editor) with real-time search and auto-save
- **Pomodoro Timer** — Configurable focus/break intervals, session counter, browser notifications
- **Themes** — Dark and light mode, persisted across pages
- **PWA** — Installable on phone via home screen, works offline

## Tech Stack

- HTML, CSS, JavaScript — no frameworks
- `localStorage` for all data persistence
- Font Awesome 6 for icons
- Service Worker for offline support

## Data

All data lives in `localStorage` under `sdl-*` keys. An import/export system is included to back up and restore data as JSON, and to move data between devices.

## Project Structure

```
studydesk-lite/
├── index.html          # Dashboard
├── html/
│   ├── tasks.html
│   ├── exams.html
│   ├── notes.html
│   └── pomodoro.html
├── css/
│   └── style.css
├── js/
│   ├── theme.js        # Theme toggle, reset, nav active state
│   ├── storage.js      # All localStorage read/write
│   ├── dashboard.js
│   ├── tasks.js
│   ├── exams.js
│   ├── notes.js
│   └── pomodoro.js
├── images/
│   ├── icon-192.png              
│   ├── icon-512.png              
│   └── studydesk_lite_logo.svg 
├── manifest.json
└──  sw.js   
```

## Deployment

Hosted via GitHub Pages. To deploy your own copy:

1. Clone the repository
   ```bash
   git clone https://github.com/anuraj-js/studydesk-lite.git
   cd studydesk-lite
   ```

2. Create a new repository on your GitHub account, then point the remote to it
   ```bash
   git remote set-url origin https://github.com/<your-username>/studydesk-lite.git
   git push -u origin main
   ```

3. Go to your repo on GitHub → **Settings → Pages**
4. Set source to `main` branch, root folder, click **Save**
5. Your site will be live at `https://<your-username>.github.io/studydesk-lite` in a minute or two

## Local Development

No build tools or dependencies required. Just clone and open:

```bash
git clone https://github.com/anuraj-js/studydesk-lite.git
cd studydesk-lite
```

Then open `index.html` in your browser by double-clicking it. This works fine for the dashboard — but because the other pages live inside the `html/` subfolder, some browsers may block them when opened as a local file (`file:///`) due to a security rule called CORS. If that happens, run a tiny local server instead:

```bash
# Python (pre-installed on most Macs and Linux)
python3 -m http.server 3000

# Node (if you have Node.js installed)
npx serve .
```

Then visit `http://localhost:3000` — the whole project will work exactly like the live GitHub Pages version.

> If double-clicking `index.html` works fine and all pages load, you don't need any of this.