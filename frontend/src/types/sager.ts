/**
 * Types for Sagsbehandling (Case Management)
 * Matches backend schemas from backend/schemas/sagsbehandling.py
 */

import { PaginationInfo } from './api';

// Sag entity matching AMOSagsbehandling database model
export interface Sag {
  Id: number;
  ProjektID: number;
  Bemærkning: string | null;
  OprettetDato: string; // ISO datetime string
  AfsluttetDato: string | null;

  // Status fields for KPIs
  Afsluttet: string | null;
  AfsluttetInt: number | null;
  Færdigmeldt: string | null;
  FærdigmeldtInt: number | null;
  FærdigmeldingDato: string | null;
  AfslutUdenFærdigmelding: number | null;
  Påbud: string | null;
  Påbudsfrist: string | null;

  // Related data from joins (populated by API)
  projekt_navn?: string;
  projekttype_navn?: string;

  // Address and property data from AMOSagsbehandling table
  ejendomsnummer?: string | null;
  beliggenhed?: string | null;
  vejnavn?: string | null;
  husnummer?: string | null;
  husbogstav?: string | null;
  postnummer?: string | null;
  by?: string | null;
  matrnr?: string | null;
  ejer?: string | null;
  fuld_adresse?: string | null;

  // Undersøgelse & Varsel
  SkalUndersøges?: string | null;
  SkalUndersøgesDato?: string | null;
  SkalUndersøgesDatoFrist?: string | null;
  VarselOmPåbud?: string | null;
  VarselDato?: string | null;
  VarselDatoFrist?: string | null;

  // Påbud detaljer
  Påbudsdato?: string | null;
  PåbudOm?: number | null;
  TilladelsesDATO?: string | null;
  KontraktDATO?: string | null;
  PaabudUdloeb?: string | null;

  // Udsættelse & Indskærpelse
  Udsættelse?: string | null;
  UdsættelseDato?: string | null;
  Udsættelsesfrist?: string | null;
  Indskærpelse?: string | null;
  IndskærpelseDato?: string | null;
  IndskærpelseFrist?: string | null;

  // Politianmeldelse
  Politianmeldelse?: string | null;
  PolitianmeldelseDato?: string | null;
  PolitianmeldelseDatoFrist?: string | null;
  PolitianmeldelseAfgjort?: string | null;

  // Disposition & Frister
  Disp?: string | null;
  DispType?: number | null;
  DispDato?: string | null;
  DispFrist?: string | null;
  NæsteDispFrist?: string | null;
  NæsteFristDato?: string | null;
  NæsteFristType?: number | null;

  // Færdigmelding & Metadata
  RegnvandNedsives?: string | null;
  RegistreretFærdigmeldingDato?: string | null;
  Journalnummer?: string | null;
  SidsteRedigeretAF?: string | null;
  SidstRettetDato?: string | null;

  // Computed field
  case_age_days?: number;
}

// Create Sag payload (for POST)
export interface SagCreate {
  ProjektID: number;
  Bemærkning: string;
  OprettetDato?: string;
  Færdigmeldt?: string;
  FærdigmeldtInt?: number;
  Påbud?: string;
  Påbudsfrist?: string;
}

// Update Sag payload (for PUT)
export interface SagUpdate {
  ProjektID?: number;
  Bemærkning?: string;
  OprettetDato?: string;
  AfsluttetDato?: string;
  Afsluttet?: string;
  AfsluttetInt?: number;
  Færdigmeldt?: string;
  FærdigmeldtInt?: number;
  FærdigmeldingDato?: string;
  AfslutUdenFærdigmelding?: number;
  Påbud?: string;
  Påbudsfrist?: string;
}

// Status update payload (for PATCH /sager/{id}/status)
export interface SagStatusUpdate {
  FærdigmeldtInt?: number;
  Påbud?: string;
  Påbudsfrist?: string;
}

// Filter parameters for GET /api/sager
export interface SagerFilterParams {
  page?: number;
  per_page?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  projekt_id?: number;
  projekttype_id?: number;
  projekttype_navn?: string;
  projekt_navn?: string; // Filter by project name
  faerdigmeldt?: number;
  paabud?: string;
  oprettet_fra?: string; // ISO date
  oprettet_til?: string; // ISO date
  search?: string;
}

// API Response types
export interface SagListResponse {
  success: boolean;
  data: Sag[];
  pagination?: PaginationInfo;
  meta?: Record<string, unknown>;
}

export interface SagDetailResponse {
  success: boolean;
  data: Sag;
  meta?: Record<string, unknown>;
}

// Projekttype badge colors
export type ProjekttypeVariant = 'separering' | 'aabentland' | 'other';

export const getProjekttypeVariant = (navn: string): ProjekttypeVariant => {
  const lowerName = navn.toLowerCase();
  if (lowerName.includes('separering')) return 'separering';
  if (lowerName.includes('åben land') || lowerName.includes('aabentland') || lowerName.includes('åbentland')) return 'aabentland';
  return 'other';
};
