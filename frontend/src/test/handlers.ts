/**
 * MSW (Mock Service Worker) handlers for API mocking
 */
import { http, HttpResponse } from 'msw';
import {
  createMockSagListResponse,
  createMockSagDetailResponse,
  createMockSag,
} from './mockData';
import type { SagerFilterParams } from '@/types/sager';

const API_BASE_URL = 'http://localhost:8000/api';

export const handlers = [
  // GET /api/sager - List sager with pagination and filters
  http.get(`${API_BASE_URL}/sager`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const per_page = Number(url.searchParams.get('per_page')) || 50;
    const projekttype_navn = url.searchParams.get('projekttype_navn');
    const faerdigmeldt = url.searchParams.get('faerdigmeldt');
    const search = url.searchParams.get('search');

    // Create mock sager based on filters
    let sager = Array.from({ length: per_page }, (_, i) =>
      createMockSag({
        Id: (page - 1) * per_page + i + 1,
        projekttype_navn: projekttype_navn || 'Separering',
      })
    );

    // Apply filters
    if (projekttype_navn) {
      sager = sager.map((sag) => ({ ...sag, projekttype_navn }));
    }

    if (faerdigmeldt !== null) {
      const faerdigmeldtInt = Number(faerdigmeldt);
      sager = sager.map((sag) => ({ ...sag, FærdigmeldtInt: faerdigmeldtInt }));
    }

    if (search) {
      sager = sager.map((sag) => ({
        ...sag,
        Bemærkning: `${search} - ${sag.Bemærkning}`,
      }));
    }

    return HttpResponse.json(
      createMockSagListResponse(sager, {
        page,
        per_page,
        total: 100,
        total_pages: Math.ceil(100 / per_page),
      })
    );
  }),

  // GET /api/sager/:id - Get single sag
  http.get(`${API_BASE_URL}/sager/:id`, ({ params }) => {
    const { id } = params;
    const sag = createMockSag({ Id: Number(id) });
    return HttpResponse.json(createMockSagDetailResponse(sag));
  }),

  // POST /api/sager - Create new sag
  http.post(`${API_BASE_URL}/sager`, async ({ request }) => {
    const body = await request.json();
    const newSag = createMockSag({
      Id: Math.floor(Math.random() * 10000),
      ...(body as any),
    });
    return HttpResponse.json(createMockSagDetailResponse(newSag), { status: 201 });
  }),

  // PUT /api/sager/:id - Update sag
  http.put(`${API_BASE_URL}/sager/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    const updatedSag = createMockSag({
      Id: Number(id),
      ...(body as any),
    });
    return HttpResponse.json(createMockSagDetailResponse(updatedSag));
  }),

  // PATCH /api/sager/:id/status - Update sag status
  http.patch(`${API_BASE_URL}/sager/:id/status`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    const updatedSag = createMockSag({
      Id: Number(id),
      ...(body as any),
    });
    return HttpResponse.json(createMockSagDetailResponse(updatedSag));
  }),

  // DELETE /api/sager/:id - Delete sag
  http.delete(`${API_BASE_URL}/sager/:id`, () => {
    return HttpResponse.json({ success: true, message: 'Sag deleted' });
  }),

  // GET /api/sager/export/csv - Export to CSV
  http.get(`${API_BASE_URL}/sager/export/csv`, () => {
    const csvContent = 'Id,Projekt,Type\n1,Test Projekt,Separering\n';
    return HttpResponse.text(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="sager_export.csv"',
      },
    });
  }),

  // GET /api/sager/export/excel - Export to Excel
  http.get(`${API_BASE_URL}/sager/export/excel`, () => {
    // Mock binary Excel file
    const buffer = new ArrayBuffer(100);
    return HttpResponse.arrayBuffer(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="sager_export.xlsx"',
      },
    });
  }),

  // GET /api/sager/:id/export/pdf - Export single sag to PDF
  http.get(`${API_BASE_URL}/sager/:id/export/pdf`, () => {
    // Mock binary PDF file
    const buffer = new ArrayBuffer(100);
    return HttpResponse.arrayBuffer(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="sag_1_export.pdf"',
      },
    });
  }),

  // GET /api/sager/search - Search sager
  http.get(`${API_BASE_URL}/sager/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const limit = Number(url.searchParams.get('limit')) || 10;

    const results = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      id: i + 1,
      title: `Sag #${i + 1} - ${query}`,
      subtitle: `Projekt: Test Projekt ${i + 1}`,
      highlight: `Match for <mark>${query}</mark> i bemærkning`,
    }));

    return HttpResponse.json({
      success: true,
      data: results,
      total: results.length,
    });
  }),

  // GET /api/sager/suggestions - Get search suggestions
  http.get(`${API_BASE_URL}/sager/suggestions`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';

    const suggestions = [
      { type: 'projekt', entity_id: 1, text: `${query} Projekt`, description: 'Projekttype: Separering' },
      { type: 'adresse', entity_id: 2, text: `${query} Vej 123`, description: '2000 Frederiksberg' },
    ];

    return HttpResponse.json({
      success: true,
      data: suggestions,
    });
  }),
];
