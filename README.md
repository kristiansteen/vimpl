# Vimpl SaaS

Vimpl SaaS is a visual planning and board management application designed for distinct SaaS use cases. It features a responsive frontend and a robust backend to handle user authentication, board management, and more.

## Project Structure

- **frontend/**: Contains the HTML, CSS, and JavaScript for the user interface.
- **backend/**: Contains the Node.js/Express server, database configuration (Prisma/Supabase), and API logic.
- **docs/**: Detailed documentation, guides, and plans for the project.

## Quick Start

### Prerequisites

- Node.js (v14+ recommended)
- npm
- A generic Supabase project (or PostgreSQL database)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd vimpl-saas
    ```

2.  **Setup Backend:**
    ```bash
    cd backend
    npm install
    cp .env.example .env
    # Update .env with your database credentials
    npx prisma generate
    cd ..
    ```

3.  **Setup Frontend:**
    ```bash
    cd frontend
    npm install # if there are dependencies
    cd ..
    ```

### Running the Application

You can use the provided batch scripts in the root directory:

- **Start All**: Double-click `START-ALL.bat` to launch both backend and frontend.
- **Start Backend**: `start-backend.bat`
- **Start Frontend**: `start-frontend.bat`

Alternatively, run from the command line:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
Serve the `frontend` folder using a static file server (e.g., Live Server in VS Code) or simply open `index.html` in your browser (though API calls require a server context).

## Documentation

Comprehensive documentation can be found in the `docs/` directory:

- [Authentication Guide](docs/AUTHENTICATION_GUIDE.md)
- [Implementation Guide](docs/IMPLEMENTATION_GUIDE.md)
- [Local Server Guide](docs/LOCAL_SERVER_GUIDE.md)
- [Integration Tasks](docs/INTEGRATION_TASKS.md)

## License

[License Information]
