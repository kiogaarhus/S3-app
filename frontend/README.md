# GIDAS Explorer - React Frontend

React + TypeScript + Vite frontend for GIDAS Explorer, migrated from Reflex Python framework.

## Features

- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Custom API Hooks** - Converted from Reflex BaseState pattern
- **Built-in Caching** - 5-minute TTL cache matching Python implementation
- **Error Handling** - Comprehensive error states
- **Loading States** - Automatic loading indicators

## Architecture

### Converted from Reflex (Python)

This frontend was converted from the original Reflex Python implementation. Key conversions:

- **`base.py` → `useApi.ts`** - API client with caching
- **`dashboard.py` → `useDashboard.ts`** - Dashboard-specific hooks
- **Reflex components → React components** - UI layer rebuilt

### Directory Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts          # Axios client with caching (from base.py)
│   ├── hooks/
│   │   ├── useApi.ts          # Generic API hooks (from base.py)
│   │   ├── useDashboard.ts    # Dashboard hooks (from dashboard.py)
│   │   └── index.ts
│   ├── types/
│   │   ├── api.ts             # TypeScript types for API
│   │   └── index.ts
│   ├── pages/
│   │   └── Dashboard.tsx      # Dashboard page component
│   ├── components/            # Reusable React components
│   ├── contexts/              # React contexts (if needed)
│   ├── utils/                 # Utility functions
│   ├── App.tsx                # Main app component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn or pnpm

### Installation

```bash
cd frontend
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_CACHE_TTL=300000  # 5 minutes in milliseconds
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

The Vite dev server proxies API requests to the FastAPI backend at `http://localhost:8000`

### Build

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## API Client

The API client (`src/api/client.ts`) is a direct conversion of the Python `BaseState` class:

### Features (from Python base.py)

- **Caching** - GET requests cached for 5 minutes (configurable)
- **Timeout handling** - 30 second default timeout
- **Error handling** - HTTP, network, and timeout errors
- **Type safety** - Full TypeScript support

### Usage Example

```typescript
import { apiClient } from '@/api/client';

// GET request with caching
const response = await apiClient.get<DashboardStats>('/api/dashboard/stats');

// POST request
const result = await apiClient.post('/api/projects', {
  name: 'New Project',
  type: 'Byggetilladelse',
});

// Clear cache
apiClient.clearCache();
```

## React Hooks

### useApi Hook

Generic hook for API calls (converted from Python `api_call()`):

```typescript
import { useApi } from '@/hooks';

function MyComponent() {
  const { data, loading, error, refetch } = useApi<MyData>('/api/endpoint');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>{data?.name}</div>;
}
```

### Dashboard Hooks

Specialized hooks converted from Python `dashboard.py`:

```typescript
import { useDashboardStats, usePaginatedActivity } from '@/hooks';

function DashboardPage() {
  // Load dashboard statistics
  const { data: stats, loading, error } = useDashboardStats();

  // Load paginated recent activity
  const {
    data: activities,
    page,
    totalPages,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedActivity(1, 20);

  // ... render component
}
```

## TypeScript Types

All API types are defined in `src/types/api.ts`:

```typescript
import type {
  DashboardStats,
  RecentActivity,
  ProjektType,
  Haendelse,
  Sag,
} from '@/types';
```

## Migration from Reflex

### What was preserved?

✅ **API client logic** (base.py → client.ts + useApi.ts)
- Caching with TTL
- Error handling
- Loading states
- HTTP methods

✅ **Business logic** (dashboard.py → useDashboard.ts)
- Dashboard stats loading
- Pagination
- Data fetching patterns

✅ **API endpoints structure**
- `/api/dashboard/stats`
- `/api/dashboard/recent-activity?page={page}&per_page={per_page}`

### What changed?

- UI framework: Reflex components → React components
- State management: Reflex State → React hooks
- Styling: Reflex styles → CSS
- Routing: Reflex router → React Router

## API Endpoints

Expected backend endpoints:

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/recent-activity?page=1&per_page=20` - Recent activity with pagination

### Projekttyper
- `GET /api/projekttyper` - List all project types
- `POST /api/projekttyper` - Create new project type
- `GET /api/projekttyper/{id}` - Get project type details

### Hændelser
- `GET /api/haendelser` - List events
- `POST /api/haendelser` - Create new event

### Sagsbehandling
- `GET /api/sager` - List cases
- `POST /api/sager` - Create new case

## Development Notes

- Vite HMR (Hot Module Replacement) is enabled for fast development
- TypeScript strict mode is enabled
- ESLint is configured for code quality
- Path alias `@/` points to `src/` directory

## Testing

```bash
# Run tests (when implemented)
npm run test

# Run linter
npm run lint
```

## Deployment

Build and deploy the `dist/` folder to your static hosting service.

The frontend needs the backend API available at the configured `VITE_API_BASE_URL`.

## Reference

Original Python implementation: `backend/reference/reflex_state/`
- `base.py` - API client pattern
- `dashboard.py` - Dashboard business logic

Migration guide: `docs/REFLEX_TO_REACT_MIGRATION.md`
