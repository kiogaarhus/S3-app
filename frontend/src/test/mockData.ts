/**
 * Mock data generators for tests
 */
import type { Sag, SagListResponse, SagDetailResponse } from '@/types/sager';
import type { PaginationInfo } from '@/types/api';

/**
 * Create a mock Sag with default values
 */
export const createMockSag = (overrides?: Partial<Sag>): Sag => {
  const id = overrides?.Id || Math.floor(Math.random() * 10000);
  return {
    Id: id,
    ProjektID: overrides?.ProjektID || 1,
    Bemærkning: overrides?.Bemærkning || 'Test bemærkning',
    OprettetDato: overrides?.OprettetDato || '2024-01-15T10:00:00',
    AfsluttetDato: overrides?.AfsluttetDato || null,
    Afsluttet: overrides?.Afsluttet || null,
    AfsluttetInt: overrides?.AfsluttetInt || 0,
    Færdigmeldt: overrides?.Færdigmeldt || null,
    FærdigmeldtInt: overrides?.FærdigmeldtInt || 0,
    FærdigmeldingDato: overrides?.FærdigmeldingDato || null,
    AfslutUdenFærdigmelding: overrides?.AfslutUdenFærdigmelding || null,
    Påbud: overrides?.Påbud || null,
    Påbudsfrist: overrides?.Påbudsfrist || null,
    projekt_navn: overrides?.projekt_navn || 'Test Projekt',
    projekttype_navn: overrides?.projekttype_navn || 'Separering',
    ejendomsnummer: overrides?.ejendomsnummer || '12345',
    beliggenhed: overrides?.beliggenhed || 'Test Vej 123',
    fuld_adresse: overrides?.fuld_adresse || 'Test Vej 123, 2000 Frederiksberg',
    case_age_days: overrides?.case_age_days || 10,
    ...overrides,
  };
};

/**
 * Create multiple mock sager
 */
export const createMockSager = (count: number, overrides?: Partial<Sag>): Sag[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockSag({
      Id: i + 1,
      ...overrides,
    })
  );
};

/**
 * Create a mock sag with Separering projekttype
 */
export const createMockSepareringSag = (overrides?: Partial<Sag>): Sag => {
  return createMockSag({
    projekttype_navn: 'Separering',
    projekt_navn: 'Separering Projekt',
    ...overrides,
  });
};

/**
 * Create a mock sag with Åben Land projekttype
 */
export const createMockAabentlandSag = (overrides?: Partial<Sag>): Sag => {
  return createMockSag({
    projekttype_navn: 'Åben Land',
    projekt_navn: 'Åben Land Projekt',
    ...overrides,
  });
};

/**
 * Create a færdigmeldt sag
 */
export const createMockFærdigmeldtSag = (overrides?: Partial<Sag>): Sag => {
  return createMockSag({
    FærdigmeldtInt: 1,
    Færdigmeldt: 'Ja',
    FærdigmeldingDato: '2024-02-01T12:00:00',
    ...overrides,
  });
};

/**
 * Create a sag with påbud
 */
export const createMockPåbudSag = (overrides?: Partial<Sag>): Sag => {
  return createMockSag({
    Påbud: 'Ja',
    Påbudsdato: '2024-01-20T09:00:00',
    Påbudsfrist: '2024-03-01T23:59:59',
    ...overrides,
  });
};

/**
 * Create mock pagination info
 */
export const createMockPagination = (overrides?: Partial<PaginationInfo>): PaginationInfo => {
  return {
    total: overrides?.total || 100,
    page: overrides?.page || 1,
    per_page: overrides?.per_page || 50,
    total_pages: overrides?.total_pages || 2,
  };
};

/**
 * Create a mock sag list response
 */
export const createMockSagListResponse = (
  sager?: Sag[],
  pagination?: PaginationInfo
): SagListResponse => {
  return {
    success: true,
    data: sager || createMockSager(10),
    pagination: pagination || createMockPagination(),
    meta: {},
  };
};

/**
 * Create a mock sag detail response
 */
export const createMockSagDetailResponse = (sag?: Sag): SagDetailResponse => {
  return {
    success: true,
    data: sag || createMockSag(),
    meta: {},
  };
};

/**
 * Create a sag with all optional fields populated (for detail view testing)
 */
export const createMockDetailedSag = (overrides?: Partial<Sag>): Sag => {
  return createMockSag({
    // Address & property
    ejendomsnummer: '12345',
    beliggenhed: 'Testvej 123',
    vejnavn: 'Testvej',
    husnummer: '123',
    husbogstav: 'A',
    postnummer: '2000',
    by: 'Frederiksberg',
    matrnr: '1a',
    ejer: 'Test Ejer A/S',
    fuld_adresse: 'Testvej 123A, 2000 Frederiksberg',

    // Undersøgelse & Varsel
    SkalUndersøges: 'Ja',
    SkalUndersøgesDato: '2024-01-20T10:00:00',
    SkalUndersøgesDatoFrist: '2024-02-20T23:59:59',
    VarselOmPåbud: 'Ja',
    VarselDato: '2024-01-25T14:00:00',
    VarselDatoFrist: '2024-03-01T23:59:59',

    // Påbud
    Påbud: 'Ja',
    Påbudsdato: '2024-02-01T09:00:00',
    Påbudsfrist: '2024-04-01T23:59:59',
    TilladelsesDATO: '2024-01-15T10:00:00',
    KontraktDATO: '2024-01-18T12:00:00',
    PaabudUdloeb: '2024-06-01T23:59:59',

    // Udsættelse & Indskærpelse
    Udsættelse: 'Ja',
    UdsættelseDato: '2024-03-15T11:00:00',
    Udsættelsesfrist: '2024-05-15T23:59:59',
    Indskærpelse: 'Ja',
    IndskærpelseDato: '2024-04-01T10:00:00',
    IndskærpelseFrist: '2024-05-01T23:59:59',

    // Politianmeldelse
    Politianmeldelse: 'Ja',
    PolitianmeldelseDato: '2024-04-15T13:00:00',
    PolitianmeldelseDatoFrist: '2024-06-15T23:59:59',
    PolitianmeldelseAfgjort: 'Nej',

    // Disposition & Frister
    Disp: 'Test disposition',
    DispDato: '2024-02-10T09:00:00',
    DispFrist: '2024-03-10T23:59:59',
    NæsteDispFrist: '2024-04-10T23:59:59',
    NæsteFristDato: '2024-04-05T23:59:59',

    // Færdigmelding & Metadata
    RegnvandNedsives: 'Ja',
    RegistreretFærdigmeldingDato: '2024-05-01T10:00:00',
    Journalnummer: 'J-2024-001',
    SidsteRedigeretAF: 'Test Bruger',
    SidstRettetDato: '2024-05-02T14:30:00',

    case_age_days: 45,
    ...overrides,
  });
};
