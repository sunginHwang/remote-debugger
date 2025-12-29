# Database Setup Guide

## Overview

This project uses **PostgreSQL** with **Prisma ORM** to store rrweb session replay events.

## Prerequisites

- PostgreSQL installed locally or accessible remotely
- Node.js v20.19+ (current: v20.16.0 - consider upgrading)

## Quick Start

### 1. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Docker:**
```bash
docker run --name rrweb-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=rrweb \
  -p 5432:5432 \
  -d postgres:15
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE rrweb;

# Exit
\q
```

### 3. Configure Environment Variables

Copy the example file and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

**Example:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rrweb?schema=public"
```

### 4. Run Database Migration

```bash
# Generate Prisma Client
npx prisma generate

# Create tables in database
npx prisma db push
```

**Or use migrations (recommended for production):**
```bash
npx prisma migrate dev --name init
```

### 5. Verify Setup

```bash
# Open Prisma Studio to view database
npx prisma studio
```

## Database Schema

### `session_events` Table

| Column       | Type         | Description                          |
|--------------|--------------|--------------------------------------|
| `id`         | SERIAL       | Auto-incrementing primary key        |
| `session_id` | VARCHAR(255) | Session identifier (indexed)         |
| `timestamp`  | BIGINT       | Event timestamp in milliseconds      |
| `event_data` | JSONB        | rrweb event data (compressed)        |
| `created_at` | TIMESTAMPTZ  | Record creation time                 |

**Indexes:**
- `session_id` - Fast session lookup
- `timestamp` - Time-range queries
- `created_at` - Sorting by creation time
- `event_data` (GIN) - JSON field searches

## API Endpoints

### Save Event
```bash
POST /rrweb/events
Content-Type: application/json

{
  "sessionId": "session_123",
  "eventData": { "type": 2, "data": {...} },
  "timestamp": 1640000000000
}
```

### Get Session Events
```bash
GET /rrweb/sessions/:sessionId/events
```

### Get Event by ID
```bash
GET /rrweb/events/:id
```

### Get Events by Time Range
```bash
GET /rrweb/events?startTime=1640000000000&endTime=1640086400000
```

### Delete Session Events
```bash
DELETE /rrweb/sessions/:sessionId/events
```

### Delete Event by ID
```bash
DELETE /rrweb/events/:id
```

## Useful Prisma Commands

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# View database in browser
npx prisma studio

# Format schema file
npx prisma format
```

## Performance Tips

### 1. Enable Query Logging (Development)

Add to `src/prisma/prisma.service.ts`:
```typescript
async onModuleInit() {
  this.$connect();

  // Enable query logging
  if (process.env.NODE_ENV === 'development') {
    this.$on('query', (e) => {
      console.log('Query: ' + e.query);
      console.log('Duration: ' + e.duration + 'ms');
    });
  }
}
```

### 2. Connection Pooling

For production, consider using **PgBouncer** or **Prisma Accelerate**.

Update `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/rrweb?schema=public&connection_limit=10"
```

### 3. Archiving Old Data

Create a cron job to archive/delete old sessions:

```typescript
// Delete events older than 90 days
const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);

await prisma.sessionEvent.deleteMany({
  where: {
    timestamp: {
      lt: ninetyDaysAgo
    }
  }
});
```

### 4. Consider TimescaleDB for Scale

If you need better compression and time-series features:

```bash
# Install TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

# Convert table to hypertable
SELECT create_hypertable('session_events', 'created_at');
```

## Troubleshooting

### Connection Issues

```bash
# Test PostgreSQL connection
psql -U postgres -h localhost -p 5432
```

### Schema Sync Issues

```bash
# Reset Prisma Client cache
rm -rf node_modules/.prisma
npx prisma generate
```

### Migration Conflicts

```bash
# View migration status
npx prisma migrate status

# Resolve baseline
npx prisma migrate resolve --applied "migration_name"
```

## Production Checklist

- [ ] Use strong database passwords
- [ ] Enable SSL connections (`?sslmode=require`)
- [ ] Set up automated backups
- [ ] Configure connection pooling
- [ ] Set up monitoring (pg_stat_statements)
- [ ] Create indexes for query patterns
- [ ] Plan data retention policy
- [ ] Test disaster recovery procedures

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [rrweb Documentation](https://www.rrweb.io/)
