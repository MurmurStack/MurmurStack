# Sestream Frontend

This is the React frontend for SeeStream, an optimized audio transcription application.

## Setup

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm start
```

3. Build for production:
```
npm run build
```

## Deployment to Vercel

This application is configured for deployment to Vercel. Before deploying:

1. Update the environment variables in your Vercel project to point to your production backend:
   - `REACT_APP_API_WS_URL`: WebSocket URL for your backend (e.g., `wss://your-api.com/ws/`)
   - `REACT_APP_API_BASE_URL`: Base URL for your backend (e.g., `https://your-api.com/`)

2. Deploy to Vercel using the Vercel CLI or GitHub integration.

## Features

- Real-time audio transcription
- Optimization metrics
- WebSocket communication with backend
- Responsive design


