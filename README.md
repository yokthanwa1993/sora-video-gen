# Sora Video Generator

AI-powered video generator using OpenAI Sora 2 through MUAPI.ai integration. Built with React, Node.js, and Supabase.

## Features

- 🎬 Generate videos from text prompts using Sora 2
- 🖼️ Image-to-video conversion support
- 👤 Google OAuth authentication via Supabase
- �� Video history and management
- 🔄 Real-time video generation status updates
- 🎨 Modern, responsive UI

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth)
- **Video Generation**: MUAPI.ai (Sora 2 API)

## Prerequisites

- Node.js 18+ 
- Supabase account ([supabase.com](https://supabase.com))
- MUAPI.ai account ([muapi.ai](https://muapi.ai))
- Google Cloud project (for OAuth)

## Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

\`\`\`bash
cp .env.example .env
\`\`\`

Required variables:
- \`MUAPIAPP_API_KEY\` - Your MUAPI.ai API key
- \`VITE_SUPABASE_URL\` - Your Supabase project URL
- \`VITE_SUPABASE_ANON_KEY\` - Your Supabase anon key
- \`SUPABASE_SERVICE_ROLE_KEY\` - Supabase service role key (for background updates)
- \`PORT\` - Server port (default: 8787)

## Local Development

1. **Install dependencies**
\`\`\`bash
npm install
\`\`\`

2. **Set up database**
   
   Run the migration files in \`supabase/migrations/\` on your Supabase project.

3. **Configure Google OAuth**
   
   See [SETUP_GOOGLE_AUTH.md](./SETUP_GOOGLE_AUTH.md) for detailed instructions.

4. **Start development server**
\`\`\`bash
npm run dev:all
\`\`\`

This will start:
- Frontend dev server on \`http://localhost:5173\`
- Backend server on \`http://localhost:8787\`

## Production Deployment

### Deploy to CapRover

1. **Build and push to repository**
\`\`\`bash
git add .
git commit -m "Ready for deployment"
git push
\`\`\`

2. **Deploy to CapRover**

   The project includes:
   - \`captain-definition\` - CapRover deployment config
   - \`Dockerfile\` - Multi-stage Docker build
   - \`.dockerignore\` - Excludes unnecessary files

   In CapRover dashboard:
   - Create a new app
   - Set environment variables
   - Deploy from GitHub or upload tar file

3. **Set environment variables in CapRover**
   - Add all required environment variables from \`.env.example\`
   - Enable HTTPS
   - Configure your domain

### Build for Production

\`\`\`bash
npm run build
\`\`\`

Builds frontend to \`dist/\` folder. Backend serves static files from this folder.

## Project Structure

\`\`\`
sora-video-gen/
├── src/                  # Frontend source
│   ├── App.jsx          # Main app component
│   ├── AuthProvider.jsx # Auth context
│   ├── LoginPage.jsx    # Login UI
│   └── lib/supabase.js  # Supabase client
├── server/              # Backend server
│   └── index.js         # Express API + static file serving
├── supabase/            # Database migrations
│   └── migrations/      # SQL migration files
├── public/              # Static assets
├── captain-definition   # CapRover deployment config
├── Dockerfile           # Production Docker image
└── .env.example         # Environment template
\`\`\`

## API Endpoints

- \`POST /api/generate\` - Create new video generation request
- \`GET /api/check-status/:requestId\` - Check video generation status
- \`POST /api/update-video\` - Manually update video status (admin)
- \`GET /api/health\` - Health check

## How It Works

1. **User submits prompt** → Frontend sends to \`/api/generate\`
2. **Backend forwards to MUAPI** → Gets \`request_id\`, returns immediately
3. **Background polling** → Server polls MUAPI every 3 seconds
4. **Database update** → When complete, updates video URL in Supabase
5. **Frontend refresh** → Automatically loads completed videos from database

## License

MIT

## Support

For issues and questions:
- MUAPI Documentation: [muapi.ai/docs](https://muapi.ai/docs)
- Supabase Documentation: [supabase.com/docs](https://supabase.com/docs)
