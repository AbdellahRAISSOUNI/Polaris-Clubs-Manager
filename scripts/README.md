# Migration Scripts

## Supabase → MongoDB Migration

### Prerequisites

1. **MongoDB connection** configured in `.env.local`:
   ```bash
   MONGODB_URI=mongodb+srv://...
   MONGODB_DB=Atlas-Club-Manager
   ```

2. **Supabase credentials** (optional - for direct data import):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

### Usage

#### Dry Run (Preview without writing)
```bash
npm run migrate:dry-run
```

This will show you what data would be migrated without actually writing to MongoDB.

#### Run Migration
```bash
npm run migrate
```

This will:
1. Connect to MongoDB
2. Connect to Supabase (if credentials are available)
3. Migrate all tables in order:
   - Users
   - Clubs
   - Spaces
   - Reservations
   - Notifications
   - Messages
   - Online Status

### What Gets Migrated

The script migrates the following Supabase tables to MongoDB collections:

| Supabase Table | MongoDB Collection | Notes |
|---------------|-------------------|-------|
| `users` | `users` | UUIDs converted to strings |
| `clubs` | `clubs` | UUIDs converted to strings |
| `spaces` | `spaces` | Features JSONB → string array |
| `reservations` | `reservations` | All timestamps preserved |
| `notifications` | `notifications` | All relationships preserved |
| `messages` | `messages` | All relationships preserved |
| `online_status` | `online_status` | User tracking data |

### Data Transformations

- **UUIDs**: Converted from PostgreSQL UUIDs to strings
- **Timestamps**: Preserved as JavaScript Date objects
- **JSONB**: Parsed and converted to appropriate types (arrays, objects)
- **Relationships**: Foreign key references preserved as string IDs

### Error Handling

The script will:
- Continue migrating even if individual records fail
- Report all errors at the end
- Use upsert operations (won't duplicate data if run multiple times)

### Manual Data Import

If you don't have Supabase access, you can:
1. Export your Supabase data manually (via Supabase dashboard or SQL)
2. Transform it to match the MongoDB schema
3. Import using MongoDB Compass or `mongoimport`

### Verification

After migration, verify data:
1. Check MongoDB Atlas dashboard for document counts
2. Use the health endpoint: `http://localhost:3000/api/health/mongo`
3. Test API endpoints to ensure data is accessible
