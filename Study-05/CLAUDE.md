# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Study-05 is the 공감 AI 다이어리 (Empathy Diary) web application. It uses AI to analyze emotions from diary entries and provide empathetic responses. The app features a clean, responsive interface with local storage for diary entries.

## Architecture

### Frontend Components

**index.html**
- Main application interface with Korean language support
- Responsive design with accessibility features (ARIA labels)
- Modal dialogs for API key settings and confirmations
- Diary list with expand/collapse functionality

**app.js**
- Main application logic handling UI interactions
- Diary entry management (save, load, delete)
- Local storage integration for persistence
- Date formatting and display

**backend.js**
- OpenRouter API integration for emotion analysis
- Vercel serverless function support (production)
- Fallback to direct API calls (development)
- Local keyword-based analysis as final fallback
- Emotion mapping and response parsing

**styles.css**
- Modern gradient design with purple/gold theme
- Responsive layout for mobile and desktop
- Animated transitions and effects
- Accessibility-friendly styling

### Backend Components

**api/analyze.js** (Vercel Serverless Function)
- Node.js serverless endpoint for emotion analysis
- Secure API key handling via environment variables
- CORS support for cross-origin requests
- Uses Google Gemma 3 27B model via OpenRouter
- Returns structured emotion analysis results

### Deployment Configuration

**vercel.json**
- Vercel deployment configuration
- Environment variable references
- Serverless function routing

## Development Setup

### Local Development

1. Open `index.html` in a web browser
2. Click settings (⚙️) to enter OpenRouter API key
3. Write diary entries and analyze emotions
4. Entries are saved to browser localStorage

### Environment Variables (Production)

Required for Vercel deployment:
- `OPENROUTER_API_KEY`: Your OpenRouter API key

Set in Vercel dashboard:
```bash
vercel env add OPENROUTER_API_KEY
```

## Common Commands

### Deploy to Vercel
```bash
cd Study-05
vercel deploy
```

### Test Serverless Function Locally
```bash
vercel dev
```

## API Integration

### OpenRouter Configuration
- Model: `google/gemma-3-27b-it:free`
- Temperature: 0.7
- Max tokens: 500

### Emotion Analysis Flow

1. User writes diary entry
2. Frontend calls `/api/analyze` endpoint (production) or direct API (development)
3. Backend processes text with structured prompt
4. AI responds with emotion classification, intensity (1-10), and empathy message
5. Response is parsed and displayed with appropriate emoji and visual indicators

### Supported Emotions
- 기쁨 (joy) - Happy face emoji
- 슬픔 (sadness) - Sad face emoji
- 분노 (anger) - Angry face emoji
- 두려움 (fear) - Fearful face emoji
- 놀람 (surprise) - Surprised face emoji
- 평온 (calm) - Calm face emoji
- 혼재 (mixed) - Mixed emotions emoji

## Features

- Real-time emotion analysis using AI
- Local storage for diary persistence
- Responsive design for mobile and desktop
- API key configuration in-app
- Fallback analysis when API unavailable
- Empathetic Korean-language responses
- Visual emotion intensity indicators
- Toast notifications for user feedback

## Security Considerations

- API keys stored in environment variables (production)
- Optional localStorage for user-provided keys (development)
- CORS configured for security
- Input validation and text length limits
- No server-side data storage (privacy-focused)

## File Structure

```
Study-05/
├── index.html              # Main application page
├── app.js                  # Frontend application logic
├── backend.js              # API integration layer
├── styles.css              # Application styling
├── vercel.json             # Vercel configuration
├── api/
│   └── analyze.js          # Serverless emotion analysis endpoint
└── CLAUDE.md               # This file
```

## Deployment Notes

- Frontend is static HTML/JS/CSS (no build step required)
- Backend uses Vercel serverless functions
- Environment variables must be set in Vercel dashboard
- Auto-deployment from GitHub repository
- No database required (localStorage only)

## Notes

This repository is located at: C:\Users\taehj\OneDrive\Desktop\Book\한빛-혼공AI\혼공바이브코딩\깃허브\vibecoding-master\Study-05