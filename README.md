# vimpl - Visual Project Management Made Simple

![vimpl](https://img.shields.io/badge/vimpl-Visual%20Planning-6366f1)
![License](https://img.shields.io/badge/license-MIT-green)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Ready-blue)

**vimpl** is a visual planning board for teams. Manage projects, track risks, and collaborate with an intuitive drag-and-drop interface — all in your browser.

🌐 **Live Demo:** [https://kristiansteen.github.io/vimpl](https://kristiansteen.github.io/vimpl)

## ✨ Features

- **📝 Drag & Drop Post-its** - Add colorful sticky notes anywhere on your board
- **📅 Week Planner** - Plan sprints with a visual timeline and multiple tracks
- **📊 Risk Matrix** - 2x2 matrices with automatic risk score calculation
- **👥 Team Management** - Add team members and assign them as owners
- **📈 KPI Tracking** - Monitor KPIs with red/yellow/green status indicators
- **💾 Auto-Save** - Everything saves automatically to your browser
- **📤 Export** - Download your board as JSON anytime
- **🔒 Section Locking** - Lock sections to prevent accidental moves

## 🚀 Quick Start

### Option 1: Visit the Live Site
Go to [https://kristiansteen.github.io/vimpl](https://kristiansteen.github.io/vimpl) and click "Create Board"

### Option 2: Run Locally
1. Clone this repository:
   ```bash
   git clone https://github.com/kristiansteen/vimpl.git
   ```
2. Open `index.html` in your browser

### Option 3: Deploy Your Own
1. Fork this repository
2. Enable GitHub Pages in Settings → Pages
3. Select "Deploy from a branch" → `main` → `/ (root)`
4. Your site will be live at `https://yourusername.github.io/vimpl`

## 📁 Project Structure

```
vimpl/
├── index.html      # Landing page
├── board.html      # Main planning board application
└── README.md       # This file
```

## 🎯 How to Use

### Creating a Board
1. Click "Create Board" on the homepage
2. A new board with default sections will be created
3. Edit the project name in the header

### Adding Post-it Notes
1. Click a color in the left sidebar
2. Click anywhere in a section to place the note
3. Double-click a note to open the detail form

### Managing Sections
- **Lock/Unlock**: Click the 🔒 icon to prevent accidental moves
- **Add Section**: Click the ➕ button in the sidebar
- **Delete Section**: Click the 🗑️ icon in the section header
- **Resize**: Drag the section edges

### Team & Owners
1. Add team members in the "Team" section (Name + Email)
2. Team members appear in all Owner dropdowns across the board
3. Assign owners to post-its and action items

### Week Planner
1. Set the start date to define Week 1
2. Add tracks for different workstreams
3. Drag post-its into week cells

### Risk Matrix
1. Drag post-its onto the matrix
2. Double-click to set Probability/Consequence values (1-100)
3. Risk Score = Probability × Consequence
4. Add mitigation notes

## 💻 Technology

vimpl is built with vanilla JavaScript and these libraries:

- **[GridStack.js](https://gridstackjs.com/)** - Draggable, resizable grid layouts
- **[Font Awesome](https://fontawesome.com/)** - Icons
- **[Inter Font](https://rsms.me/inter/)** - Typography

No backend required! All data is stored in the browser's localStorage.

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Miro](https://miro.com) and traditional visual planning boards
- Built with ❤️ for teams who love visual planning

---

Made by [Kristian Steen](https://github.com/kristiansteen)
