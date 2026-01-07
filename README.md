# vimpl - Visual Project Management Made Simple

A modern, intuitive visual planning board for teams. Create projects, track risks, manage tasks, and collaborate - all in your browser with no backend required.

![vimpl Logo](https://img.shields.io/badge/vimpl-visual%20planning-6366f1)
![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-active-success)

## 🌟 Features

### Core Functionality
- **🎨 Drag & Drop Post-its**: Add colourful sticky notes anywhere on your board with five colour options
- **📋 Multiple Section Types**: Text areas, team sections, KPI trackers, and more
- **📅 Week Planner**: Visual sprint planning with multiple tracks
- **📊 2x2 Risk Matrix**: Automatically calculate risk scores based on probability and impact
- **👥 Team Management**: Add team members and assign ownership to tasks
- **💾 Auto-Save**: All changes save automatically to browser localStorage
- **📤 Export/Import**: Export your board as JSON for backup or sharing

### Advanced Features
- **🔒 Section Locking**: Prevent accidental changes to completed sections
- **📈 KPI Tracking**: Visual red/yellow/green status indicators
- **🎯 Actions Table**: Track action items with owners and status
- **📊 Impact Matrix**: Eisenhower-style priority matrices
- **🔍 Event Logging**: Comprehensive event log for debugging and analytics
- **🎨 Grid System**: Optional grid view for precise alignment

## 🚀 Quick Start

### Option 1: Use Online (Recommended)
Visit [vimpl.com](https://vimpl.com) and start creating boards immediately - no sign-up required!

### Option 2: Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vimpl.git
   cd vimpl
   ```

2. **Serve the files**
   
   Using Python 3:
   ```bash
   python3 -m http.server 8000
   ```
   
   Using Node.js (http-server):
   ```bash
   npx http-server -p 8000
   ```
   
   Using PHP:
   ```bash
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

## 📁 Project Structure

```
vimpl/
├── index.html           # Landing page
├── board.html          # Main board interface
├── callback.html       # OAuth callback handler (future use)
├── assets/
│   ├── css/
│   │   ├── board.css   # Board page styles
│   │   └── index.css   # Landing page styles
│   └── js/
│       ├── board.js    # Core board functionality
│       └── auth.js     # Authentication (future use)
├── README.md           # This file
├── LICENSE             # MIT License
└── .gitignore         # Git ignore rules
```

## 🎯 How to Use

### Creating Your First Board

1. Click **"Create Board"** on the landing page
2. Enter a board name
3. Start adding sections using the **+ button** in the sidebar

### Adding Post-it Notes

1. Click a colour from the sidebar palette
2. Click anywhere on a section to place the note
3. Double-click the note to add content, owner, and status

### Section Types

| Section Type | Description | Use Case |
|-------------|-------------|----------|
| **Text Section** | Simple text area | Notes, descriptions, goals |
| **Team Section** | Team member list | Track team composition |
| **KPI Section** | Key performance indicators | Monitor metrics with RAG status |
| **2x2 Matrix** | Risk/Impact analysis | Risk assessment, prioritisation |
| **Week Planner** | Weekly schedule | Sprint planning, timeline tracking |
| **Actions Table** | Action item list | Task management, follow-ups |
| **Post-it Area** | Free-form notes area | Brainstorming, categorisation |

### Keyboard Shortcuts

- **Double-click**: Edit post-it note
- **Drag**: Move notes and sections
- **Delete**: Remove note (when in edit mode)

## 🔧 Technical Details

### Technologies Used

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Layout Engine**: [GridStack.js](https://gridstackjs.com/) v10.0.0
- **Icons**: [Font Awesome](https://fontawesome.com/) v6.4.0
- **Fonts**: [Google Fonts](https://fonts.google.com/) (Inter, Birthstone)
- **Storage**: Browser localStorage API
- **Authentication**: OIDC Client (prepared for future SSO integration)

### Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |

### Data Storage

All data is stored locally in your browser's localStorage:
- **Key**: `vimplBoardState` (or board-specific key)
- **Size Limit**: ~5-10MB (browser dependent)
- **Persistence**: Data persists until manually cleared or browser data is deleted

### Security Considerations

- ✅ No server-side processing
- ✅ All data stored locally in browser
- ✅ No external API calls (except CDN resources)
- ⚠️ Authentication currently disabled (SSO prepared but not active)
- ⚠️ No encryption for localStorage data
- ⚠️ Export files contain plain JSON (handle sensitive data carefully)

## 📊 Features in Detail

### Risk Matrix

The 2x2 risk matrix calculates risk scores automatically:

```
Risk Score = Probability (1-100) × Impact (1-100)
```

**Risk Levels:**
- **Low** (0-2500): Green zone
- **Medium** (2501-5000): Yellow zone
- **High** (5001-7500): Orange zone
- **Critical** (7501-10000): Red zone

### Event Logging

The application maintains three types of logs:

1. **Event Log**: All user actions (create, edit, delete, move)
2. **Post-it Data**: Current state of all post-it notes
3. **Matrix Positions**: Historical positions in risk matrices

Access logs via the **Events** button in the header.

### Auto-Save

- Changes are automatically saved after 1 second of inactivity
- Visual indicator shows save status (Saving... / All changes saved)
- No manual save button required

## 🎨 Customisation

### Colour Palette

Edit CSS custom properties in `assets/css/board.css`:

```css
:root {
    --primary: #6366f1;
    --secondary: #0ea5e9;
    --accent: #f59e0b;
    --postit-yellow: #fef08a;
    --postit-pink: #fda4af;
    /* ... */
}
```

### Grid Size

Adjust grid snapping in `assets/js/board.js`:

```javascript
const AppState = {
    gridSize: 20, // Change to 10, 15, 25, etc.
    // ...
};
```

## 🔮 Roadmap

### Planned Features
- [ ] Real-time collaboration (Socket.IO integration)
- [ ] User authentication (Google/Microsoft SSO)
- [ ] Cloud storage option
- [ ] Mobile-optimised interface
- [ ] Board templates library
- [ ] PDF export functionality
- [ ] Dark mode
- [ ] Undo/Redo functionality
- [ ] Comments and mentions
- [ ] File attachments

### Under Consideration
- [ ] Gantt chart view
- [ ] Calendar integration
- [ ] Email notifications
- [ ] API for integrations
- [ ] Desktop application (Electron)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly in multiple browsers
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a pull request

### Coding Standards

- Use ES6+ JavaScript features
- Follow existing code style (2-space indentation)
- Comment complex logic
- Test in Chrome, Firefox, and Safari
- Keep functions focused and modular

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [GridStack.js](https://gridstackjs.com/) - Responsive grid layout
- [Font Awesome](https://fontawesome.com/) - Icons
- [Google Fonts](https://fonts.google.com/) - Typography
- Inspired by [Miro](https://miro.com/) and [Siemens Project Management Templates](https://www.siemens.com/)

## 📧 Contact

For questions, suggestions, or issues:
- Open an issue on GitHub
- Visit [vimpl.com](https://vimpl.com)
- Email: support@vimpl.com (if available)

## 🌐 Links

- **Website**: [vimpl.com](https://vimpl.com)
- **Repository**: [github.com/yourusername/vimpl](https://github.com/yourusername/vimpl)
- **Issues**: [github.com/yourusername/vimpl/issues](https://github.com/yourusername/vimpl/issues)

---

**Made with ❤️ for visual thinkers and agile teams**
