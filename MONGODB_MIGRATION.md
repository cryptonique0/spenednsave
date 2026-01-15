# SQLite to MongoDB Migration

## Overview

The application has been successfully converted from SQLite to MongoDB. This migration improves scalability, supports distributed deployments, and provides better cloud integration.

## Changes Made

### 1. **Database Service** (`lib/services/guardian-signature-db.ts`)
   - Replaced `better-sqlite3` with MongoDB driver (`mongodb`)
   - Converted all SQL queries to MongoDB operations
   - Maintained the same class interface to minimize changes in other files
   - All methods now handle async/await patterns

### 2. **Key Features Preserved**
   - ✅ Data encryption (AES-256-GCM) - data is encrypted before storage
   - ✅ Collections auto-creation with proper indexes
   - ✅ Same data models and interfaces
   - ✅ Error handling and logging
   - ✅ Graceful degradation when encryption key is not set

### 3. **API Routes Updated**
   - `/api/guardian-signatures` (GET, POST)
   - `/api/guardian-signatures/[id]` (GET, PUT, DELETE)
   - `/api/guardian-signatures/import` (POST)
   - `/api/activities` (GET, POST)
   - `/api/activities/[id]` (GET, DELETE)
   - `/api/activities/import` (POST)
   - `/api/guardians` (GET, POST)
   - `/api/guardians/import` (POST)
   - `/api/badges/eligible` (GET)
   - `/api/guardian-reputation` (GET)

   All routes now properly await async database operations.

### 4. **Database Collections**
   - `pending_requests` - Stores withdrawal requests with signatures
   - `account_activities` - Logs user activities
   - `guardians` - Stores guardian information

   All collections have appropriate indexes for performance.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
# MongoDB driver is already in package.json
```

### 2. Configure Environment Variables
Create or update your `.env.local` file:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

# Encryption Key (generate a strong random string)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
DB_ENCRYPTION_KEY=your-encryption-key-here-minimum-32-chars
```

### 3. MongoDB Setup Options

#### Option A: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Create database credentials
4. Get the connection string
5. Add to `.env.local`

#### Option B: Local MongoDB
```bash
# Install MongoDB locally
# macOS with Homebrew:
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB:
brew services start mongodb-community

# Connection string:
MONGODB_URI=mongodb://localhost:27017
```

#### Option C: Docker
```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest

# Connection string:
MONGODB_URI=mongodb://admin:password@localhost:27017/?authSource=admin
```

### 4. Start the Application
```bash
npm run dev
```

The database collections will be automatically created on first connection.

## Migration from SQLite (if you have existing data)

### Step 1: Export SQLite Data
```bash
# Use sqlite3 CLI to export as JSON
sqlite3 guardian_signatures.sqlite ".mode json" ".output data.json" "SELECT * FROM pending_requests;"
```

### Step 2: Import to MongoDB
Use the import API endpoints:

```bash
# Import pending requests
curl -X POST http://localhost:3000/api/guardian-signatures/import \
  -H "Content-Type: application/json" \
  -d '{"data": [...]}'

# Import activities
curl -X POST http://localhost:3000/api/activities/import \
  -H "Content-Type: application/json" \
  -d '{"data": [...]}'

# Import guardians
curl -X POST http://localhost:3000/api/guardians/import \
  -H "Content-Type: application/json" \
  -d '{"data": [...]}'
```

## Database Methods

All methods in `GuardianSignatureDB` class are now async:

```typescript
// Pending Requests
await GuardianSignatureDB.savePendingRequest(request)
await GuardianSignatureDB.getPendingRequests()
await GuardianSignatureDB.getPendingRequest(id)
await GuardianSignatureDB.deletePendingRequest(id)

// Activities
await GuardianSignatureDB.saveActivity(activity)
await GuardianSignatureDB.getActivitiesByAccount(account)
await GuardianSignatureDB.getAllActivities()
await GuardianSignatureDB.getActivity(id)
await GuardianSignatureDB.deleteActivity(id)

// Guardians
await GuardianSignatureDB.saveGuardian(guardian)
await GuardianSignatureDB.getGuardiansByTokenAddress(tokenAddress)
await GuardianSignatureDB.deleteGuardiansByTokenAddress(tokenAddress)

// Connection Management
await GuardianSignatureDB.closeConnection()
```

## Connection Management

The MongoDB connection is automatically established on first database access and reused across requests for optimal performance.

For graceful shutdown:
```typescript
// In your application shutdown handler
await GuardianSignatureDB.closeConnection();
```

## Performance Considerations

### Indexes
MongoDB automatically creates indexes on:
- `pending_requests.id` (unique)
- `pending_requests.vaultAddress`
- `pending_requests.status`
- `pending_requests.createdAt`
- `account_activities.account`
- `account_activities.timestamp` (descending)
- `account_activities.relatedRequestId`
- `guardians.id` (unique)
- `guardians.tokenAddress`
- `guardians.address`

### Best Practices
1. Always use connection pooling (automatic in MongoDB driver)
2. Use appropriate query filters to leverage indexes
3. Monitor connection pool usage
4. Consider TTL indexes for auto-expiring data if needed

## Encryption

All sensitive data is encrypted before storage using AES-256-GCM:
- `request` field in pending_requests
- `signatures` field in pending_requests
- `guardians` field in pending_requests
- `details` field in account_activities

If `DB_ENCRYPTION_KEY` is not set, data is stored as plaintext. This is useful for development but should always be set in production.

## Troubleshooting

### Connection Error
```
MONGODB_URI not set
```
**Solution**: Add `MONGODB_URI` to your `.env.local`

### Authentication Error
```
MongoServerError: Authentication failed
```
**Solution**: Verify your MongoDB credentials and connection string

### Collections Not Created
The collections are automatically created on first access. If this fails, check MongoDB permissions.

### Performance Issues
- Ensure indexes are created (check MongoDB dashboard)
- Consider increasing connection pool size for high-traffic scenarios
- Monitor slow queries using MongoDB query profiler

## Rollback to SQLite

If you need to revert to SQLite:
1. Keep the old code in a separate branch
2. Restore `better-sqlite3` to package.json
3. Revert the database service file
4. Export MongoDB data to JSON
5. Import into SQLite using the export API

## Support

For issues or questions:
1. Check MongoDB Atlas documentation: https://docs.mongodb.com/
2. Review MongoDB driver docs: https://www.mongodb.com/docs/drivers/node/
3. Check application logs for detailed error messages
