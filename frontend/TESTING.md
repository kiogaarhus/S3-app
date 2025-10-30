# Testing Guide - GIDAS Explorer Frontend

Denne guide beskriver test setup, hvordan man kører tests, og best practices for at skrive nye tests.

## 📋 Indholdsfortegnelse

- [Test Stack](#test-stack)
- [Kør Tests](#kør-tests)
- [Test Struktur](#test-struktur)
- [Test Utilities](#test-utilities)
- [Skriv Nye Tests](#skriv-nye-tests)
- [Mock Data](#mock-data)
- [API Mocking med MSW](#api-mocking-med-msw)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🛠️ Test Stack

Projektet bruger følgende test værktøjer:

- **[Vitest](https://vitest.dev/)** - Test framework (Jest-compatible, hurtigere)
- **[@testing-library/react](https://testing-library.com/react)** - Component testing
- **[@testing-library/user-event](https://testing-library.com/docs/user-event/intro)** - Bruger interaktion simulation
- **[@testing-library/jest-dom](https://github.com/testing-library/jest-dom)** - Custom matchers
- **[MSW (Mock Service Worker)](https://mswjs.io/)** - API mocking
- **[jsdom](https://github.com/jsdom/jsdom)** - DOM simulation

## ▶️ Kør Tests

### Basis Kommandoer

```bash
# Kør alle tests (watch mode)
npm run test

# Kør tests én gang (CI mode)
npm run test -- --run

# Kør tests med UI
npm run test:ui

# Kør tests med coverage report
npm run test:coverage
```

### Avancerede Kommandoer

```bash
# Kør specifik test fil
npm run test -- SagerList.test.tsx

# Kør tests der matcher et pattern
npm run test -- --grep="displays sager"

# Kør tests i watch mode med UI
npm run test:ui

# Se coverage i browser
npm run test:coverage
# Åbn derefter: coverage/index.html
```

## 📁 Test Struktur

```
frontend/
├── src/
│   ├── pages/
│   │   └── Sager/
│   │       ├── __tests__/              # Component tests
│   │       │   ├── SagerList.test.tsx
│   │       │   ├── SagDetail.test.tsx
│   │       │   └── SagForm.test.tsx
│   │       └── components/
│   │           └── __tests__/
│   │               └── SagerFilters.test.tsx
│   └── test/                           # Test utilities
│       ├── setup.ts                    # Test setup (MSW, cleanup)
│       ├── setupGlobals.ts             # Global mocks (localStorage, etc.)
│       ├── test-utils.tsx              # Custom render funktion
│       ├── mockData.ts                 # Mock data generators
│       ├── handlers.ts                 # MSW API handlers
│       └── server.ts                   # MSW server setup
└── vitest.config.ts                    # Vitest configuration
```

## 🧰 Test Utilities

### Custom Render Funktion

Brug altid den custom `render` funktion fra `@/test/test-utils` i stedet for RTL's standard render:

```tsx
import { render, screen } from '@/test/test-utils';
import { MyComponent } from '../MyComponent';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

**Hvorfor?** Custom render wrapper inkluderer alle nødvendige providers:
- React Query's `QueryClientProvider`
- React Router's `MemoryRouter`
- Fresh QueryClient for hver test (ingen cache pollution)

### User Events

Brug `@testing-library/user-event` for bruger interaktioner:

```tsx
import userEvent from '@testing-library/user-event';

test('handles button click', async () => {
  const user = userEvent.setup();
  render(<MyButton />);

  const button = screen.getByRole('button');
  await user.click(button);

  expect(screen.getByText('Clicked!')).toBeInTheDocument();
});
```

## 🎭 Mock Data

### Mock Data Generators

Brug de præ-definerede mock data generators fra `@/test/mockData`:

```tsx
import {
  createMockSag,
  createMockSepareringSag,
  createMockFærdigmeldtSag,
  createMockSagListResponse,
} from '@/test/mockData';

test('displays sag', () => {
  const mockSag = createMockSag({
    Id: 123,
    projekt_navn: 'Test Projekt',
  });

  // Use mockSag in your test...
});
```

### Tilgængelige Mock Generators

- `createMockSag(overrides?)` - Basis sag med defaults
- `createMockSager(count, overrides?)` - Flere sager
- `createMockSepareringSag(overrides?)` - Sag med Separering type
- `createMockAabentlandSag(overrides?)` - Sag med Åben Land type
- `createMockFærdigmeldtSag(overrides?)` - Færdigmeldt sag
- `createMockPåbudSag(overrides?)` - Sag med påbud
- `createMockDetailedSag(overrides?)` - Sag med alle felter udfyldt
- `createMockSagListResponse(sager?, pagination?)` - API response
- `createMockSagDetailResponse(sag?)` - Single sag response

## 🔌 API Mocking med MSW

### Standard API Handlers

MSW handlers er allerede sat op i `src/test/handlers.ts` for alle Sager endpoints:

- `GET /api/sager` - Liste med pagination og filtre
- `GET /api/sager/:id` - Enkelt sag
- `POST /api/sager` - Opret ny sag
- `PUT /api/sager/:id` - Opdater sag
- `PATCH /api/sager/:id/status` - Opdater status
- `DELETE /api/sager/:id` - Slet sag
- `GET /api/sager/export/csv` - CSV export
- `GET /api/sager/export/excel` - Excel export
- `GET /api/sager/:id/export/pdf` - PDF export

### Override API Response i Test

```tsx
import { server } from '@/test/server';
import { http, HttpResponse } from 'msw';

test('handles custom API response', async () => {
  // Override default handler for this test
  server.use(
    http.get('http://localhost:8000/api/sager', () => {
      return HttpResponse.json({
        success: true,
        data: [createMockSag({ Id: 999 })],
      });
    })
  );

  render(<SagerList />);

  await waitFor(() => {
    expect(screen.getByText('999')).toBeInTheDocument();
  });
});
```

### Simuler API Fejl

```tsx
test('handles API error', async () => {
  server.use(
    http.get('http://localhost:8000/api/sager/1', () => {
      return HttpResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    })
  );

  render(<SagDetail />);

  await waitFor(() => {
    expect(screen.getByText(/fejl ved hentning/i)).toBeInTheDocument();
  });
});
```

## ✍️ Skriv Nye Tests

### Test Template

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    // Reset mocks før hver test
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Clicked!')).toBeInTheDocument();
    });
  });
});
```

### Test Navngivning

Brug beskrivende test navne der følger mønsteret:

```tsx
// ✅ Godt - beskriver hvad der testes
it('displays loading state while fetching data', () => {});
it('shows error message when API fails', () => {});
it('navigates to detail page when clicking view button', () => {});

// ❌ Dårligt - vage beskrivelser
it('works', () => {});
it('test1', () => {});
it('renders', () => {});
```

## 📋 Best Practices

### 1. Test Bruger Oplevelse, Ikke Implementation

```tsx
// ✅ Godt - tester hvad brugeren ser
expect(screen.getByText('Sagsbehandling')).toBeInTheDocument();
expect(screen.getByRole('button', { name: /eksporter/i })).toBeInTheDocument();

// ❌ Dårligt - tester implementation detaljer
expect(wrapper.state().isLoading).toBe(true);
expect(component.props.onClick).toHaveBeenCalled();
```

### 2. Brug `waitFor` for Async Operationer

```tsx
// ✅ Godt - venter på async rendering
await waitFor(() => {
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});

// ❌ Dårligt - antager synkron rendering
expect(screen.getByText('Data loaded')).toBeInTheDocument();
```

### 3. Query Priority

Følg denne prioritering for at finde elementer:

1. **getByRole** - Mest accessible (foretrukket)
2. **getByLabelText** - God til form felter
3. **getByPlaceholderText** - Til inputs
4. **getByText** - Til synlig tekst
5. **getByTestId** - Kun som sidste udvej

```tsx
// 1. Foretrukket - accessible
const button = screen.getByRole('button', { name: /submit/i });

// 2. God til forms
const input = screen.getByLabelText(/email/i);

// 3. Undgå - ikke accessible
const element = screen.getByTestId('custom-element');
```

### 4. Mock Eksterne Dependencies

```tsx
// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});
```

### 5. Cleanup Mellem Tests

MSW og RTL cleanup sker automatisk via `src/test/setup.ts`, men du kan gøre ekstra cleanup hvis nødvendigt:

```tsx
afterEach(() => {
  vi.clearAllMocks();
  // Custom cleanup...
});
```

## 🐛 Troubleshooting

### "Unable to find element"

**Problem:** Element findes ikke i DOM når test kører.

**Løsning:** Brug `waitFor` eller `findBy*` queries:

```tsx
// ❌ Fejler hvis element ikke er der med det samme
expect(screen.getByText('Loading...')).toBeInTheDocument();

// ✅ Venter på at element dukker op
await waitFor(() => {
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});

// ✅ Eller brug findBy (indbygget waiting)
expect(await screen.findByText('Loading...')).toBeInTheDocument();
```

### "act() warning"

**Problem:** State updates sker uden for act().

**Løsning:** Sørg for at alle async operationer er afsluttet:

```tsx
// Brug await på user interactions
await user.click(button);

// Vent på state updates
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

### MSW Handler Matches Ikke

**Problem:** API requests bliver ikke interceptet af MSW.

**Løsning:** Check at URL matcher præcis:

```tsx
// Sørg for at URL er identisk med den i koden
http.get('http://localhost:8000/api/sager', () => {
  // Handler...
});
```

### Tests Timeout

**Problem:** Test venter i evigheder og timeout'er.

**Løsning:** Øg timeout eller check async operations:

```tsx
// Øg timeout for specifik waitFor
await waitFor(() => {
  expect(screen.getByText('Data')).toBeInTheDocument();
}, { timeout: 3000 }); // Default er 1000ms
```

### Import Errors

**Problem:** Kan ikke importere fra `@/...`

**Løsning:** Check at path alias er sat op i `vitest.config.ts`:

```ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

## 📊 Coverage Goals

Mål for test coverage:

- **Statements:** > 80%
- **Branches:** > 75%
- **Functions:** > 80%
- **Lines:** > 80%

Kør coverage report for at se aktuel coverage:

```bash
npm run test:coverage
```

## 🔗 Nyttige Links

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries Cheatsheet](https://testing-library.com/docs/queries/about)
- [MSW Documentation](https://mswjs.io/)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 📝 Eksempler

Se test filerne for konkrete eksempler:

- **Liste view:** `src/pages/Sager/__tests__/SagerList.test.tsx`
- **Detail view:** `src/pages/Sager/__tests__/SagDetail.test.tsx`
- **Multi-step form:** `src/pages/Sager/__tests__/SagForm.test.tsx`
- **Complex filters:** `src/pages/Sager/components/__tests__/SagerFilters.test.tsx`

---

**Spørgsmål eller problemer?** Check [Troubleshooting](#troubleshooting) sektionen eller kontakt teamet.
