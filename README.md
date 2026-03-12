

## 📁 Project Structure

```
├── client/           # React frontend application
│   └── src/         # Source code for UI components
├── server/          # Express backend server
│   ├── routes.ts    # API endpoints
│   ├── db.ts        # Database configuration
│   └── index.ts     # Server entry point
├── shared/          # Shared code between client and server
│   └── schema.ts    # Database schema
├── docs/            # Documentation files
├── data/            # Data files (corrected and enhanced)
└── attached_assets/ # Images and static assets
```

## 🚀 How to Run (VS Code or Any IDE)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Database (First Time Only)
```bash
npm run db:push
```

### Step 3: Run the Application
```bash
npm run dev
```

The application will start on **http://localhost:5000**

## 📝 Available Commands

- `npm run dev` - Start development server (client + backend)
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run db:push` - Update database schema
- `npm run check` - Type check with TypeScript


## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Express, Node.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSockets
- **AI**: Google Gemini

---

**Note**: Some features require API keys (Fyers, Google Cloud). The app will work without them but with limited functionality.
