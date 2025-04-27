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

## Environment Configuration

The application supports different environments:

### Development Environment
- Uses local development API endpoints
- Configuration file: `.env`
- Default environment when running `npm start`

### Production Environment
- Uses production API endpoints
- Configuration file: `.env.production`
- Used when building with `npm run build:prod`

## Build Commands

1. Build for development:
```
npm run build:dev
```

2. Build for production:
```
npm run build:prod
```

## Deployment to Vercel

This application is configured for deployment to Vercel. Before deploying:

1. Ensure your Vercel project is configured to use the production environment:
   - Set the build command to `npm run build:prod`
   - The environment variables will be loaded from `.env.production`

2. Deploy to Vercel using the Vercel CLI or GitHub integration.

## Features

- Real-time audio transcription
- Optimization metrics
- WebSocket communication with backend
- Responsive design
- Environment-specific configuration


