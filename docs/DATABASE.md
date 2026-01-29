# Database Schema

Link uses Supabase (PostgreSQL) with Row Level Security enabled.

## Tables

### users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (from auth.users) |
| phone_number | TEXT | Unique phone number |
| display_name | TEXT | User's display name |
| avatar_url | TEXT | Profile photo URL |
| birthday | DATE | User's birthday |
| timezone | TEXT | Default 'UTC' |

### friendships
Bidirectional relationship between app users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| friend_id | UUID | FK to users |
| status | TEXT | pending, accepted, blocked |
| cadence | TEXT | weekly, biweekly, monthly, quarterly, semiannual, annual |
| last_contacted_at | TIMESTAMPTZ | Last contact timestamp |
| context_notes | TEXT | Conversation starters |

### local_contacts
Friends who don't use the app.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| phone_number | TEXT | Contact's phone |
| display_name | TEXT | Contact's name |
| avatar_url | TEXT | Photo URL |
| birthday | DATE | Birthday |
| notes | TEXT | General notes |
| context_notes | TEXT | Conversation starters |
| cadence | TEXT | Default 'monthly' |
| last_contacted_at | TIMESTAMPTZ | Last contact timestamp |

### events
Birthdays, anniversaries, milestones.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| friend_id | UUID | FK to friend |
| friend_type | TEXT | app_user, local_contact |
| title | TEXT | Event title |
| event_type | TEXT | birthday, anniversary, milestone, custom |
| event_date | DATE | Event date |
| is_recurring | BOOLEAN | Repeats annually |
| notes | TEXT | Event notes |

## RLS Policies

All tables have Row Level Security enabled. Users can only access their own data.

Example policy:
```sql
CREATE POLICY "Users can manage own local contacts"
  ON local_contacts FOR ALL
  USING (auth.uid() = user_id);
```

