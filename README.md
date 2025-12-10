<div align="center">
<img src="./main-logo.png" width="200" alt="Verum Omnis Logo" />
</div>

# Verum Omnis: AI Forensics for Truth

A forensic AI chat application built with React, TypeScript, Vite, and Capacitor. This app provides an intelligent interface for analyzing information with AI-powered forensic capabilities.

View the app in AI Studio: https://ai.studio/apps/drive/1D9oZN7r5CH1tKX46llfTB3G6hBrQ_K0q

## Features

- 🔍 AI-powered forensic analysis
- 📱 Native Android support via Capacitor
- 📷 Camera and geolocation integration
- 📄 Document generation and case management
- 🔐 SHA-512 integrity sealing for evidence
- 📊 Multi-brain AI architecture for corroborated analysis

## Prerequisites

- **Node.js** (v20 or higher)
- **Java** (JDK 17) - for Android builds
- **Android SDK** - for Android development

## Run Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set your Gemini API key:**
   Edit [.env.local](.env.local) and set `GEMINI_API_KEY` to your API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Build for Production

### Web Build

```bash
npm run build
```

This creates an optimized production build in the `dist` directory.

### Android Build

1. **Build web assets:**
   ```bash
   npm run build
   ```

2. **Sync Capacitor:**
   ```bash
   npx cap sync android
   ```

3. **Build the APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

   The APK will be available at `android/app/build/outputs/apk/release/`

## GitHub Actions CI/CD

The repository includes a GitHub Actions workflow that automatically builds and signs the Android APK on every push to the main branch.

### Setup for Signed APK

To enable signed APK builds, add the following secrets to your GitHub repository:

- `KEYSTORE_BASE64`: Base64-encoded Android keystore file
- `KEY_ALIAS`: Keystore alias
- `KEYSTORE_PASSWORD`: Keystore password
- `KEY_PASSWORD`: Key password
- `API_KEY`: Gemini API key (for build-time environment variable)

### Manual Workflow Trigger

You can also trigger the build manually using the "Actions" tab in GitHub and selecting "Build Android APK" workflow.

## Project Structure

```
.
├── components/          # React components
│   ├── Header.tsx       # App header with logo
│   ├── ChatInput.tsx    # Chat input with file upload
│   ├── ChatMessage.tsx  # Message display component
│   ├── CaseManager.tsx  # Case management interface
│   └── ...
├── services/            # AI and API services
│   ├── aiService.ts     # Main AI service
│   └── geminiService.ts # Gemini API integration
├── utils/               # Utility functions
│   └── forensics.ts     # Forensic utilities
├── android/             # Capacitor Android project
├── public/              # Static assets
│   └── assets/
│       └── main-logo.png # App logo
└── ...
```

## Testing Functions

The app includes the following key functions:

1. **Chat Interface**: Send messages and receive AI responses
2. **File Upload**: Attach files for forensic analysis
3. **Geolocation**: Automatic jurisdiction detection
4. **Case Management**: Save and archive forensic cases
5. **Document Generation**: Generate PDF reports and email drafts
6. **Evidence Sealing**: SHA-512 integrity verification

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Capacitor** - Native mobile integration
- **TailwindCSS** - Styling
- **Google Gemini AI** - AI engine
- **jsPDF** - PDF generation

## License

This project was created with AI Studio.

## Support

For issues or questions, please open an issue in the GitHub repository.
