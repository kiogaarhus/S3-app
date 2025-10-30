/**
 * Sag Detail View Component
 *
 * Task 2.2: Create Sag detail view component
 *
 * IMPLEMENTATION STATUS: ✅ COMPLETE
 * - ✅ Fetch sag by ID from route params
 * - ✅ Display sag metadata in header with badges
 * - ✅ Display all sag fields in organized sections
 * - ✅ Read-only view (no editing, status changes, or deletion)
 * - ✅ Loading states with spinner
 * - ✅ Error handling with navigation
 * - ✅ Navigate back to list
 * - ✅ Breadcrumb navigation
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useSag } from '@/hooks/sager/useSager';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getProjekttypeVariant } from '@/types/sager';
import { HaendelserTimeline } from './components/HaendelserTimeline';
import { FileDown, FileText } from 'lucide-react';
import { useRegistreringer } from '@/hooks';

export const SagDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Fetch sag data
  const { data, isLoading, error } = useSag(Number(id));

  // Fetch registrations (BBR status, etc.) - Task 14.2
  const { data: registreringerData } = useRegistreringer(Number(id));

  // Download PDF function
  const handleDownloadPdf = async () => {
    if (!id) return;

    setIsDownloadingPdf(true);
    try {
      const response = await fetch(`/api/sager/${id}/export/pdf`);

      if (!response.ok) {
        throw new Error('PDF download failed');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `sag_${id}.pdf`;

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Fejl ved download af PDF. Prøv igen.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-secondary">Henter sag...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Render error state
  if (error || !data?.data) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-red-600">
            <h2 className="text-xl font-semibold mb-2">Fejl ved hentning af sag</h2>
            <p className="mb-4 text-secondary">Sagen kunne ikke hentes. Kontroller at ID'et er korrekt.</p>
            {error && <pre className="mt-2 text-sm text-left p-4 rounded text-primary" style={{ backgroundColor: 'var(--bg-tertiary)' }}>{JSON.stringify(error, null, 2)}</pre>}
            <div className="mt-6 flex gap-2 justify-center">
              <Button variant="primary" onClick={() => navigate('/sager')}>
                ← Tilbage til liste
              </Button>
              <Button variant="ghost" onClick={() => window.location.reload()}>
                🔄 Prøv igen
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const sag = data.data;

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="text-sm text-secondary">
        <button onClick={() => navigate('/sager')} className="hover:text-primary-600">
          Sagsbehandling
        </button>
        <span className="mx-2">/</span>
        <span>Sag {sag.Id}</span>
      </div>

      {/* Header with Quick Actions */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-primary">Sag #{sag.Id}</h1>
              {sag.projekt_navn && (
                <p className="mt-1 text-lg text-secondary">Projekt: {sag.projekt_navn}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {sag.projekttype_navn && (
                  <Badge variant={getProjekttypeVariant(sag.projekttype_navn) as any}>
                    📁 {sag.projekttype_navn}
                  </Badge>
                )}
                <Badge
                  variant={
                    sag.FærdigmeldtInt === 1 ? 'success' :
                    (sag.AfsluttetInt === 1 || sag.AfsluttetInt === -1) ? 'neutral' :
                    'default'
                  }
                >
                  {sag.FærdigmeldtInt === 1 ? '✅ Færdigmeldt' :
                   (sag.AfsluttetInt === 1 || sag.AfsluttetInt === -1) ? '🔒 Afsluttet' :
                   '🔵 Aktiv'}
                </Badge>
                {sag.Påbud && <Badge variant="warning">⚠️ Påbud: {sag.Påbud}</Badge>}
                {sag.case_age_days !== undefined && (
                  <Badge variant="info">📅 {sag.case_age_days} dage gammel</Badge>
                )}
              </div>
            </div>

            {/* PDF Download Button */}
            <div>
              <Button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                variant="primary"
                className="flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                {isDownloadingPdf ? 'Henter PDF...' : 'Download PDF'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Address and Property Information - Only show if data exists */}
      {(sag.fuld_adresse || sag.beliggenhed || sag.ejendomsnummer || sag.vejnavn || sag.matrnr || sag.ejer) && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-primary">
              🏠 Adresse & Ejendom
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(sag.fuld_adresse || sag.beliggenhed) && (
                <div className="col-span-1 md:col-span-2">
                  <label className="text-sm font-medium uppercase text-secondary">Adresse</label>
                  <p className="mt-1 text-lg font-medium text-primary">
                    {sag.fuld_adresse || sag.beliggenhed}
                  </p>
                </div>
              )}
              {sag.ejendomsnummer && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Ejendomsnummer</label>
                  <p className="mt-1 text-primary">{sag.ejendomsnummer}</p>
                </div>
              )}
              {sag.postnummer && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Postnummer</label>
                  <p className="mt-1 text-primary">{sag.postnummer}</p>
                </div>
              )}
              {sag.matrnr && (
                <div className="col-span-1 md:col-span-2">
                  <label className="text-sm font-medium uppercase text-secondary">Matrikelnummer</label>
                  <p className="mt-1 text-primary">{sag.matrnr}</p>
                </div>
              )}
              {sag.ejer && (
                <div className="col-span-1 md:col-span-2">
                  <label className="text-sm font-medium uppercase text-secondary">Ejer</label>
                  <p className="mt-1 text-primary">{sag.ejer}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Case Information */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-primary">
            📋 Sag Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium uppercase text-secondary">Projekt</label>
                <p className="mt-1 font-medium text-primary">{sag.projekt_navn || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium uppercase text-secondary">Projekt ID</label>
                <p className="mt-1 text-primary">#{sag.ProjektID}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium uppercase text-secondary">Oprettet Dato</label>
                <p className="mt-1 text-primary">
                  {sag.OprettetDato
                    ? new Date(sag.OprettetDato).toLocaleDateString('da-DK', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium uppercase text-secondary">Sagens Alder</label>
                <p className="mt-1 font-medium text-primary">
                  {sag.case_age_days !== undefined
                    ? `${sag.case_age_days} dage${sag.case_age_days > 30 ? ' ⚠️' : ''}`
                    : '-'}
                </p>
              </div>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="text-sm font-medium uppercase text-secondary">Bemærkning</label>
              <div className="mt-2 p-4 rounded-md border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-light)' }}>
                <p className="whitespace-pre-wrap text-primary">
                  {sag.Bemærkning || 'Ingen bemærkninger'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Undersøgelse & Varsel */}
      {(sag.SkalUndersøges || sag.VarselOmPåbud) && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
              🔍 Undersøgelse & Varsel
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sag.SkalUndersøges && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Skal Undersøges</label>
                  <div className="mt-1">
                    <Badge variant={sag.SkalUndersøges === 'Ja' ? 'warning' : 'default'}>
                      {sag.SkalUndersøges}
                    </Badge>
                  </div>
                </div>
              )}
              {sag.SkalUndersøgesDato && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Undersøgelsesdato</label>
                  <p className="mt-1 text-primary">
                    {new Date(sag.SkalUndersøgesDato).toLocaleDateString('da-DK')}
                  </p>
                </div>
              )}
              {sag.SkalUndersøgesDatoFrist && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Undersøgelsesfrist</label>
                  <p className="mt-1 text-primary">
                    {new Date(sag.SkalUndersøgesDatoFrist).toLocaleDateString('da-DK')}
                  </p>
                </div>
              )}
              {sag.VarselOmPåbud && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Varsel Om Påbud</label>
                  <div className="mt-1">
                    <Badge variant="warning">{sag.VarselOmPåbud}</Badge>
                  </div>
                </div>
              )}
              {sag.VarselDato && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Varsel Dato</label>
                  <p className="mt-1 text-primary">
                    {new Date(sag.VarselDato).toLocaleDateString('da-DK')}
                  </p>
                </div>
              )}
              {sag.VarselDatoFrist && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Varsel Frist</label>
                  <p className="mt-1 text-primary">
                    {new Date(sag.VarselDatoFrist).toLocaleDateString('da-DK')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Påbud & Tilladelser */}
      {(sag.Påbud || sag.Påbudsfrist || sag.Påbudsdato || sag.TilladelsesDATO || sag.KontraktDATO) && (
        <Card>
          <div className="p-6 bg-warning-50 border-l-4 border-warning-500">
            <h3 className="text-lg font-semibold mb-4 text-warning-800 flex items-center gap-2">
              ⚠️ Påbud & Tilladelser
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sag.Påbud && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Påbud</label>
                  <div className="mt-1">
                    <Badge variant="warning">{sag.Påbud}</Badge>
                  </div>
                </div>
              )}
              {sag.Påbudsdato && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Påbudsdato</label>
                  <p className="mt-1 text-primary">
                    {new Date(sag.Påbudsdato).toLocaleDateString('da-DK')}
                  </p>
                </div>
              )}
              {sag.Påbudsfrist && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Påbudsfrist</label>
                  <p className="mt-1 font-medium text-primary">
                    {new Date(sag.Påbudsfrist).toLocaleDateString('da-DK')}
                  </p>
                </div>
              )}
              {sag.PaabudUdloeb && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Påbud Udløb</label>
                  <p className="mt-1 text-primary">
                    {new Date(sag.PaabudUdloeb).toLocaleDateString('da-DK')}
                  </p>
                </div>
              )}
              {sag.TilladelsesDATO && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Tilladelsesdato</label>
                  <p className="mt-1 text-primary">
                    {new Date(sag.TilladelsesDATO).toLocaleDateString('da-DK')}
                  </p>
                </div>
              )}
              {sag.KontraktDATO && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Kontraktdato</label>
                  <p className="mt-1 text-primary">
                    {new Date(sag.KontraktDATO).toLocaleDateString('da-DK')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Udsættelse & Indskærpelse */}
      {(sag.Udsættelse || sag.Indskærpelse) && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
              ⏱️ Udsættelse & Indskærpelse
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sag.Udsættelse && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Udsættelse</label>
                  <div className="mt-1">
                    <Badge variant="info">{sag.Udsættelse}</Badge>
                  </div>
                </div>
              )}
              {sag.UdsættelseDato && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Udsættelsesdato</label>
                  <p className="mt-1 text-primary">
                    {new Date(sag.UdsættelseDato).toLocaleDateString('da-DK')}
                  </p>
                </div>
              )}
              {sag.Udsættelsesfrist && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Udsættelsesfrist</label>
                  <p className="mt-1 text-primary">
                    {new Date(sag.Udsættelsesfrist).toLocaleDateString('da-DK')}
                  </p>
                </div>
              )}
              {sag.Indskærpelse && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Indskærpelse</label>
                  <div className="mt-1">
                    <Badge variant="warning">{sag.Indskærpelse}</Badge>
                  </div>
                </div>
              )}
              {sag.IndskærpelseDato && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Indskærpelsesdato</label>
                  <p className="mt-1 text-primary">
                    {new Date(sag.IndskærpelseDato).toLocaleDateString('da-DK')}
                  </p>
                </div>
              )}
              {sag.IndskærpelseFrist && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Indskærpelsesfrist</label>
                  <p className="mt-1 text-primary">
                    {new Date(sag.IndskærpelseFrist).toLocaleDateString('da-DK')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Politianmeldelse */}
      {(sag.Politianmeldelse || sag.PolitianmeldelseDato) && (
        <Card>
          <div className="p-6 bg-red-50 border-l-4 border-red-500">
            <h3 className="text-lg font-semibold mb-4 text-red-800 flex items-center gap-2">
              👮 Politianmeldelse
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sag.Politianmeldelse && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Politianmeldelse</label>
                  <div className="mt-1">
                    <Badge variant="danger">{sag.Politianmeldelse}</Badge>
                  </div>
                </div>
              )}
              {sag.PolitianmeldelseDato && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Anmeldelsesdato</label>
                  <p className="mt-1 text-primary">
                    {new Date(sag.PolitianmeldelseDato).toLocaleDateString('da-DK')}
                  </p>
                </div>
              )}
              {sag.PolitianmeldelseDatoFrist && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Anmeldelsesfrist</label>
                  <p className="mt-1 text-primary">
                    {new Date(sag.PolitianmeldelseDatoFrist).toLocaleDateString('da-DK')}
                  </p>
                </div>
              )}
              {sag.PolitianmeldelseAfgjort && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Afgjort</label>
                  <div className="mt-1">
                    <Badge variant={sag.PolitianmeldelseAfgjort === 'Ja' ? 'success' : 'default'}>
                      {sag.PolitianmeldelseAfgjort}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Disposition & Frister */}
      {(sag.Disp || sag.NæsteFristDato) && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
              📋 Disposition & Frister
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sag.Disp && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Disposition</label>
                  <p className="mt-1 text-primary">{sag.Disp}</p>
                </div>
              )}
              {sag.DispDato && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Dispositionsdato</label>
                  <p className="mt-1 text-primary">
                    {new Date(sag.DispDato).toLocaleDateString('da-DK')}
                  </p>
                </div>
              )}
              {sag.DispFrist && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Dispositionsfrist</label>
                  <p className="mt-1 text-primary">
                    {new Date(sag.DispFrist).toLocaleDateString('da-DK')}
                  </p>
                </div>
              )}
              {sag.NæsteDispFrist && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Næste Disp. Frist</label>
                  <p className="mt-1 text-primary">
                    {new Date(sag.NæsteDispFrist).toLocaleDateString('da-DK')}
                  </p>
                </div>
              )}
              {sag.NæsteFristDato && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Næste Frist</label>
                  <p className="mt-1 font-medium text-primary">
                    {new Date(sag.NæsteFristDato).toLocaleDateString('da-DK')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Færdigmelding & Status */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
            ✅ Færdigmelding & Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium uppercase text-secondary">Færdigmeldt</label>
              <div className="mt-1">
                <Badge variant={sag.FærdigmeldtInt === 1 ? 'success' : 'default'}>
                  {sag.Færdigmeldt || '-'}
                </Badge>
              </div>
            </div>
            {sag.FærdigmeldingDato && (
              <div>
                <label className="text-sm font-medium uppercase text-secondary">Færdigmeldingsdato</label>
                <p className="mt-1 text-primary">
                  {new Date(sag.FærdigmeldingDato).toLocaleDateString('da-DK')}
                </p>
              </div>
            )}
            {sag.RegistreretFærdigmeldingDato && (
              <div>
                <label className="text-sm font-medium uppercase text-secondary">Registreret Færdigmelding</label>
                <p className="mt-1 text-primary">
                  {new Date(sag.RegistreretFærdigmeldingDato).toLocaleDateString('da-DK')}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium uppercase text-secondary">Afsluttet</label>
              <div className="mt-1">
                <Badge variant={sag.AfsluttetInt === 1 ? 'success' : 'neutral'}>
                  {sag.Afsluttet || '-'}
                </Badge>
              </div>
            </div>
            {sag.AfsluttetDato && (
              <div>
                <label className="text-sm font-medium uppercase text-secondary">Afslutningsdato</label>
                <p className="mt-1 text-primary">
                  {new Date(sag.AfsluttetDato).toLocaleDateString('da-DK')}
                </p>
              </div>
            )}
            {sag.RegnvandNedsives && (
              <div>
                <label className="text-sm font-medium uppercase text-secondary">Regnvand Nedsives</label>
                <div className="mt-1">
                  <Badge variant="info">{sag.RegnvandNedsives}</Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Metadata */}
      {(sag.Journalnummer || sag.SidsteRedigeretAF) && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
              📝 Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sag.Journalnummer && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Journalnummer</label>
                  <p className="mt-1 text-primary">{sag.Journalnummer}</p>
                </div>
              )}
              {sag.SidsteRedigeretAF && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Sidst Redigeret Af</label>
                  <p className="mt-1 text-primary">{sag.SidsteRedigeretAF}</p>
                </div>
              )}
              {sag.SidstRettetDato && (
                <div>
                  <label className="text-sm font-medium uppercase text-secondary">Sidst Rettet</label>
                  <p className="mt-1 text-primary">
                    {new Date(sag.SidstRettetDato).toLocaleDateString('da-DK', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Hændelser Timeline - Task 13.5 */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-6 text-primary flex items-center gap-2">
            📅 Hændelser
          </h3>
          <HaendelserTimeline sagId={sag.Id} />
        </div>
      </Card>

      {/* Dynamiske Registreringer (BBR status, etc.) - Task 14.2 */}
      {registreringerData && registreringerData.count > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Registreringer
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {registreringerData.data.map((reg) => (
                <div
                  key={reg.id}
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                  }}
                >
                  <div className="flex flex-col gap-2">
                    {/* Felt navn */}
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                        {reg.felt_navn}
                      </label>
                      <div className="mt-1">
                      {(() => {
                        // Check if this is BBR data (should show actual values)
                        const isBBRData = reg.felt_navn.includes('BBR');

                        // Check if there's actual activity data for non-BBR fields
                        const hasActivity = reg.dato || reg.init || reg.værdi === 1;

                        if (isBBRData) {
                          // Show actual BBR values as text
                          return (
                            <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {reg.værdi || '-'}
                            </span>
                          );
                        } else if (hasActivity) {
                          // Show Ja/Nej badges for regular registrations
                          return (
                            <Badge variant="success" className="text-sm font-semibold px-3 py-1">
                              ✓ Ja
                            </Badge>
                          );
                        } else {
                          return (
                            <Badge variant="warning" className="text-sm font-semibold px-3 py-1">
                              ✗ Nej
                            </Badge>
                          );
                        }
                      })()}
                    </div>
                    </div>

                    {/* Metadata */}
                    {(reg.dato || reg.init) && (
                      <div className="flex items-center justify-between text-xs pt-2 border-t" style={{ borderColor: 'var(--border-light)', color: 'var(--text-tertiary)' }}>
                        {reg.dato && (
                          <span>
                            {new Date(reg.dato).toLocaleDateString('da-DK', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                        {reg.init && (
                          <span className="font-medium">{reg.init}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Back Button */}
      <div className="flex justify-start">
        <Button variant="ghost" onClick={() => navigate('/sager')}>
          ← Tilbage til liste
        </Button>
      </div>
    </div>
  );
};
