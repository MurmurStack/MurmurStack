# MurmurStack Landing Page Layout

## Overview
The landing page is built using React and Tailwind CSS, featuring a modern, responsive design with smooth animations powered by Framer Motion.

## Component Structure

### 1. Navbar (`src/components/Navbar.jsx`)
- Responsive navigation bar with mobile menu
- Logo and navigation links
- Call-to-action button
- Smooth mobile menu transitions

### 2. Hero Section (`src/components/Hero.jsx`)
- Main headline and subheadline
- Feature highlights with icons
- Call-to-action buttons
- Animated background elements
- Responsive layout for all screen sizes

### 3. Features Section (`src/components/Features.jsx`)
- Grid layout of key features
- Animated feature cards
- Icons and descriptions
- Responsive grid system
- Hover effects and transitions

### 4. Demo Section (`src/components/Demo.tsx`)
- Real-time audio optimization demo
- Recording functionality with WebSocket integration
- Live transcription display
- Optimization metrics visualization
- Interactive recording controls
- Animated transitions and loading states

### 5. Waitlist Section (`src/components/Waitlist.jsx`)
- Email collection form
- Form validation
- Success/error states
- Animated transitions
- Responsive design

### 6. Footer (`src/components/Footer.jsx`)
- Company information
- Navigation links
- Social media links
- Copyright information
- Responsive layout

## Styling
- Tailwind CSS for utility-first styling
- Custom color scheme with primary colors
- Inter font family
- Responsive design breakpoints
- Custom animations and transitions

## Configuration Files
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS plugins
- `tsconfig.json` - TypeScript configuration
- `.env` and `.env.production` - Environment variables

## Dependencies
- React
- Tailwind CSS
- Framer Motion
- TypeScript
- PostCSS
- Autoprefixer

## Development
1. Install dependencies: `npm install`
2. Start development server: `npm start`
3. Build for production: `npm run build`

## Deployment
- Configured for Vercel deployment
- Environment variables set in `.env` files
- Production build optimization 