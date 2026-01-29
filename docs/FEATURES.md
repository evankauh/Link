# Features

## Core Concept

Link suggests who to contact based on an algorithm weighing:
- **Urgency** (40%): Days overdue vs. user-set cadence
- **Events** (30%): Upcoming birthdays/milestones
- **Recency** (20%): Days since last contact
- **Random** (10%): Prevents staleness

## Home Screen

The main screen shows one friend suggestion at a time with:
- Friend photo and name
- Context card (last conversation, upcoming events)
- Upcoming events list

**Actions (on tap):**
- **Call**: Initiates phone call
- **Snooze**: Skip this friend, show next suggestion
- **Recently Called**: Mark as contacted, show next suggestion

## Friends

Two types of friends:
1. **App Users**: Friends who also use Link (synced via Supabase)
2. **Local Contacts**: Friends stored locally only

Each friend has:
- Contact cadence (weekly → annual)
- Last contacted date
- Context notes (conversation starters)
- Birthday and events

## Calendar

- View upcoming events (birthdays, anniversaries, milestones)
- Add custom events for friends
- Post-call prompt to add events after calls

## Contact Cadences

| Cadence | Days |
|---------|------|
| Weekly | 7 |
| Biweekly | 14 |
| Monthly | 30 |
| Quarterly | 90 |
| Semiannual | 180 |
| Annual | 365 |

