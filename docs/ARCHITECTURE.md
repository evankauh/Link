# Architecture

## Overview

Link is a React Native app built with Expo SDK 54. It helps users maintain friendships through intelligent contact suggestions.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript 5.9 |
| State | Redux Toolkit + RTK Query |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Storage | AsyncStorage (local), Secure Store (credentials) |

## Architecture Layers

```
┌─────────────────────────────────────┐
│     Screens (UI)                    │
├─────────────────────────────────────┤
│     Components (Reusable UI)        │
├─────────────────────────────────────┤
│     Hooks (Business Logic)          │
├─────────────────────────────────────┤
│     Store (Redux + RTK Query)       │
├─────────────────────────────────────┤
│     Services (External APIs)        │
├─────────────────────────────────────┤
│     Supabase / Device APIs          │
└─────────────────────────────────────┘
```

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/screens/` | Screen components organized by feature |
| `src/components/` | Reusable UI components |
| `src/hooks/` | Custom React hooks |
| `src/store/` | Redux store, slices, and RTK Query APIs |
| `src/services/` | External service integrations |
| `src/types/` | TypeScript type definitions |
| `src/utils/` | Helper functions |
| `src/navigation/` | React Navigation configuration |

## Data Flow

1. **Screens** call **hooks** for business logic
2. **Hooks** dispatch actions to **Redux store** or call **RTK Query** endpoints
3. **RTK Query** communicates with **Supabase** backend
4. **Services** handle device APIs (contacts, calendar, notifications)

## Navigation Structure

```
RootNavigator
├── Auth Stack (unauthenticated)
│   ├── Login
│   ├── SignUp
│   └── Onboarding
└── Main Tabs (authenticated)
    ├── Home
    ├── Calendar
    ├── Friends Stack
    │   ├── FriendsList
    │   ├── FriendProfile
    │   └── AddFriend
    └── Settings
```

