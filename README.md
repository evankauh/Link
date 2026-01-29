# Link (WORKING APP NAME)

Stay connected to the people who matter.

## Dev Setup

### Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- npm 9+
- Git
- [Expo Go](https://expo.dev/client) app installed on your phone

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/link.git
cd link
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 4: Start the Development Server

```bash
npm start
```

### Step 5: View the App

**On Physical Device:**

1. Open Expo Go app on your phone (download from app store)
2. Scan the QR code displayed in the terminal

**On Simulator:**

```bash
npm run ios      # iOS Simulator (requires Xcode)
npm run android  # Android Emulator (requires Android Studio)
```

## Scripts

| Command           | Description             |
| ----------------- | ----------------------- |
| `npm start`       | Start Expo dev server   |
| `npm run ios`     | Run on iOS simulator    |
| `npm run android` | Run on Android emulator |
| `npm test`        | Run tests               |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Features](docs/FEATURES.md)
- [Database Schema](docs/DATABASE.md)
- [Technical Spec](TECHNICAL_SPEC.md)

## Project Structure

```
src/
├── components/    # Reusable UI components
├── screens/       # Screen components
├── navigation/    # React Navigation config
├── store/         # Redux store and RTK Query
├── services/      # External service integrations
├── hooks/         # Custom React hooks
├── types/         # TypeScript definitions
└── utils/         # Helper functions
```

## What is Link?

Link is a mobile app that helps young professionals maintain friendships. It:

1. **Suggests who to contact** based on recency, upcoming events, and user-defined cadences
2. **Provides context** about each friend (last conversation, upcoming birthday)
3. **Tracks interactions** to show which friendships need attention
4. **Removes friction** with quick-action buttons to call, text, or snooze reminders

## Tech Stack

| Layer     | Technology                      |
| --------- | ------------------------------- |
| Framework | React Native 0.81 + Expo SDK 54 |
| Language  | TypeScript 5.9                  |
| State     | Redux Toolkit + RTK Query       |
| Backend   | Supabase                        |

## License

Proprietary and confidential.
