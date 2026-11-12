# ✦ Nova Launcher

**A customizable Windows game and application launcher.**

Nova Launcher is a modern desktop application designed to bring all your games, programs, utilities, and tools into one organized library.

Customize your application icons, cover artwork, themes, layouts, and launch settings to create a launcher that feels entirely your own.

---

## ✨ Features

### Application Management
- Add games and applications from executable files.
- Automatically extract icons from `.exe` files.
- Import and export application entries.
- Edit application names, descriptions, and categories.
- Organize applications into custom folders.
- Create multiple libraries.
- Mark applications as favorites.
- Track launch counts and recently launched applications.

### Customization
- Custom application icons.
- Custom cover artwork.
- Custom background images.
- Dark and light themes.
- Custom accent colors.
- Adjustable application card sizes.
- Grid and list layouts.
- Customizable dashboard widgets.
- Adjustable UI scaling.
- Animation settings.

### Launch Options
- Custom executable paths.
- Custom launch arguments.
- Custom working directories.
- Administrator launch options.
- Minimize launcher after launching.
- Application running indicators.
- Quick-launch functionality.

### Dashboard
- Recently launched applications.
- Favorite applications.
- Recently added applications.
- Application statistics.
- Global application search.
- Customizable dashboard widgets.

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + K` | Global search |
| `Ctrl + N` | Add application |
| `Ctrl + F` | Search library |
| `Ctrl + 1` | Home |
| `Ctrl + 2` | Library |
| `Ctrl + ,` | Settings |

---

## 🖥️ Screenshots

*Screenshots coming soon.*

---

## 🛠️ Built With

- **Electron** – Desktop application framework.
- **React** – User interface.
- **TypeScript** – Application logic and type safety.
- **Vite** – Frontend development and build tooling.
- **Electron Builder** – Windows application packaging.

---

## 📥 Installation

### Download a Release

1. Visit the [Releases](../../releases) section.
2. Download the latest Nova Launcher installer or portable version.
3. Run the installer or portable executable.
4. Launch Nova Launcher.

### Run From Source

**Requirements:**
- Windows 10 or Windows 11.
- Node.js and npm.
- Git (optional).

Clone the repository:

```bash
git clone https://github.com/cyybbrrr/nova-launcher
```

Navigate into the project:

```bash
cd nova-launcher
```

Install dependencies:

```bash
npm install
```

Build and launch the application:

```bash
npm start
```

---

## 🔧 Development

To run Nova Launcher in development mode, open two terminals.

**Terminal 1 – Start Vite:**

```bash
npm run dev
```

**Terminal 2 – Start Electron:**

```bash
npm run dev:electron
```

---

## 📦 Building for Windows

Nova Launcher uses Electron Builder to package the application.

**Build both Windows distributions:**

```bash
npm run dist
```

**Build the installer:**

```bash
npm run dist:installer
```

**Build the portable executable:**

```bash
npm run dist:portable
```

All build outputs are generated inside the `release/` directory.

---

## 📁 Project Structure

```text
nova-launcher/
├── build/
├── dist/
├── release/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── index.html
├── main.cjs
├── preload.cjs
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📋 Roadmap

- [ ] Additional customization options.
- [ ] More dashboard widgets.
- [ ] Additional launcher themes.
- [ ] Improved application organization.
- [ ] More keyboard shortcut customization.
- [ ] Additional library management features.
- [ ] UI and performance improvements.

---

**Nova Launcher**  
*Your library. Your layout. Your experience.*
