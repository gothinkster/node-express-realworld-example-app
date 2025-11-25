# RealWorld Conduit API

TypeScript/Express.js backend implementation of the RealWorld Conduit API specification.

## Application Overview

**Domain:** Blogging platform (Medium.com clone)
**Architecture:** Monolithic REST API with Clean Architecture patterns

## Technology Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.18
- **Language:** TypeScript 5.2
- **ORM:** Prisma 4.16
- **Database:** PostgreSQL 16
- **Testing:** Jest
- **Build Tool:** Nx 17

## Database Schema

**Main Entities:**
- **User** - Authentication, profiles, following relationships
- **Article** - Blog posts with tags and favorites
- **Comment** - Article comments
- **Tag** - Article categorization

**Key Relationships:**
- Users write Articles
- Users comment on Articles
- Users follow other Users
- Users favorite Articles
- Articles have Tags (many-to-many)

## Setup Instructions

### Prerequisites

1. Node.js v18+
2. PostgreSQL 16 running on localhost:5432

### Quick Start

**1. Install dependencies:**
```bash
npm install
```

**2. Configure environment:**

Create `.env` file:
```env
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/conduit
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

**3. Setup database:**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database with demo data
npx prisma db seed
```

**4. Start server:**
```bash
npx nx serve api
```

Server will be available at: **http://localhost:3000**

### Verify Installation

```bash
# Check API health
curl http://localhost:3000/api

# Get articles
curl http://localhost:3000/api/articles | jq '.articlesCount'

# Get tags
curl http://localhost:3000/api/tags
```

Expected: 144 articles, 12 users, 1,728 comments

## Development Commands

### Running the Application

```bash
# Development mode with hot reload
npx nx serve api

# Production build
npm run build

# Run production server
node dist/api/main.js
```

### Database Management

```bash
# Reset database (clean + migrate + seed)
npx prisma migrate reset --force

# Reset without seeding
npx prisma migrate reset --force --skip-seed

# View database in browser
npx prisma studio

# Check migration status
npx prisma migrate status
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- article.service.spec.ts

# Run with coverage
npm test -- --coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npx prettier --write "src/**/*.ts"
```

## API Endpoints

### Authentication
- `POST /api/users` - Register new user
- `POST /api/users/login` - Login
- `GET /api/user` - Get current user
- `PUT /api/user` - Update user

### Articles
- `GET /api/articles` - List articles (paginated)
- `GET /api/articles/feed` - Get user feed
- `GET /api/articles/:slug` - Get article
- `POST /api/articles` - Create article
- `PUT /api/articles/:slug` - Update article
- `DELETE /api/articles/:slug` - Delete article

### Comments
- `GET /api/articles/:slug/comments` - Get comments
- `POST /api/articles/:slug/comments` - Add comment
- `DELETE /api/articles/:slug/comments/:id` - Delete comment

### Favorites
- `POST /api/articles/:slug/favorite` - Favorite article
- `DELETE /api/articles/:slug/favorite` - Unfavorite article

### Tags
- `GET /api/tags` - Get all tags

### Profiles
- `GET /api/profiles/:username` - Get profile
- `POST /api/profiles/:username/follow` - Follow user
- `DELETE /api/profiles/:username/follow` - Unfollow user

## Architecture

```
src/
├── app/
│   ├── routes/           # API routes and controllers
│   │   ├── article/      # Article CRUD, favorites
│   │   ├── auth/         # Authentication, registration
│   │   ├── comment/      # Comment management
│   │   ├── profile/      # User profiles, follows
│   │   └── tag/          # Tag operations
│   ├── utils/            # Shared utilities
│   └── middleware/       # Express middleware
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # SQL migration files
│   └── seed.ts          # Demo data generator
└── tests/                # Unit and integration tests
```

## Security Notes

- JWT authentication for protected endpoints
- Passwords hashed with bcryptjs
- Demo data marked with `demo: true` flag
- Not production-ready (educational reference only)

## Troubleshooting

### Port Conflicts
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process using port
kill -9 <PID>
```

### Migration Issues
```bash
# Reset everything
npx prisma migrate reset --force
```

## Resources

**Official Documentation:**
- RealWorld Spec: https://realworld-docs.netlify.app/
- Prisma Docs: https://www.prisma.io/docs
- Express.js: https://expressjs.com/
- TypeScript: https://www.typescriptlang.org/

**Repository:**
- GitHub: https://github.com/VeryBigThings/workshop-demo-ts
