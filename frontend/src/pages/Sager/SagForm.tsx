/**
 * Sag Form Component (Multi-step)
 *
 * Task 2.3: Create multi-step sag form component
 *
 * IMPLEMENTATION CHECKLIST:
 * -------------------------
 * [ ] Multi-step form with progress indicator:
 *     - Step 1: Basic Information (ProjektID, Bemærkning)
 *     - Step 2: Status & Dates (OprettetDato, Færdigmeldt, FærdigmeldingDato)
 *     - Step 3: Påbud Information (Påbud, Påbudsfrist)
 *     - Step 4: Review & Submit
 * [ ] Form validation with error messages
 * [ ] Projekt selection dropdown (fetch from projekter API)
 * [ ] Date pickers for all date fields
 * [ ] Radio/checkbox for status fields
 * [ ] Navigation between steps (Next, Previous, Cancel)
 * [ ] Submit button on final step
 * [ ] Loading state during submission
 * [ ] Success/error feedback after submission
 * [ ] Edit mode detection (route param :id)
 * [ ] Pre-populate form in edit mode
 * [ ] Breadcrumb navigation
 *
 * DEPENDENCIES:
 * - useCreateSag, useUpdateSag, useSag from @/hooks/sager/useSager
 * - useProjekter from @/hooks/projekter/useProjekter (TODO: create this hook)
 * - Button component from @/components/ui/Button
 * - Card component from @/components/ui/Card
 * - Form components (Input, Select, DatePicker, etc.)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCreateSag, useUpdateSag, useSag } from '@/hooks/sager/useSager';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { SagCreate, SagUpdate } from '@/types/sager';

// Form steps
const STEPS = [
  { id: 1, title: 'Grundlæggende Information', icon: '📋' },
  { id: 2, title: 'Status & Datoer', icon: '📅' },
  { id: 3, title: 'Påbud Information', icon: '⚠️' },
  { id: 4, title: 'Gennemse & Gem', icon: '✅' },
];

export const SagForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState<Partial<SagCreate | SagUpdate>>({
    ProjektID: undefined,
    Bemærkning: '',
    OprettetDato: new Date().toISOString().split('T')[0],
    Færdigmeldt: 'Nej',
    FærdigmeldtInt: 0,
    Påbud: '',
    Påbudsfrist: undefined,
  });

  // TODO: Add form validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch existing sag if in edit mode
  const { data: existingSag, isLoading: loadingExisting } = useSag(Number(id), {
    enabled: isEditMode,
  });

  // Mutations
  const createSag = useCreateSag();
  const updateSag = useUpdateSag();

  // Pre-populate form in edit mode
  useEffect(() => {
    if (isEditMode && existingSag?.data) {
      setFormData({
        ProjektID: existingSag.data.ProjektID,
        Bemærkning: existingSag.data.Bemærkning || '',
        OprettetDato: existingSag.data.OprettetDato?.split('T')[0],
        Færdigmeldt: existingSag.data.Færdigmeldt || 'Nej',
        FærdigmeldtInt: existingSag.data.FærdigmeldtInt || 0,
        Påbud: existingSag.data.Påbud || '',
        Påbudsfrist: existingSag.data.Påbudsfrist?.split('T')[0],
      });
    }
  }, [isEditMode, existingSag]);

  // TODO: Implement form validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.ProjektID) {
        newErrors.ProjektID = 'Projekt er påkrævet';
      }
      if (!formData.Bemærkning?.trim()) {
        newErrors.Bemærkning = 'Bemærkning er påkrævet';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // TODO: Implement step navigation
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCancel = () => {
    if (window.confirm('Er du sikker på at du vil annullere? Alle ændringer vil gå tabt.')) {
      navigate(isEditMode ? `/sager/${id}` : '/sager');
    }
  };

  // TODO: Implement form submission
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      if (isEditMode) {
        await updateSag.mutateAsync({
          id: Number(id),
          data: formData as SagUpdate,
        });
        navigate(`/sager/${id}`);
      } else {
        const result = await createSag.mutateAsync(formData as SagCreate);
        navigate(`/sager/${result.data.Id}`);
      }
    } catch (error) {
      console.error('Failed to save sag:', error);
      // TODO: Show error notification
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // TODO: Render loading state for edit mode
  if (isEditMode && loadingExisting) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500">Henter sag...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="text-sm text-gray-500">
        <button onClick={() => navigate('/sager')} className="hover:text-primary-600">
          Sagsbehandling
        </button>
        <span className="mx-2">/</span>
        <span>{isEditMode ? `Rediger Sag ${id}` : 'Ny Sag'}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? `Rediger Sag #${id}` : 'Opret Ny Sag'}
        </h1>
        <p className="mt-1 text-gray-500">
          Udfyld formularen trin for trin for at {isEditMode ? 'opdatere' : 'oprette'} en sag
        </p>
      </div>

      {/* Progress Indicator */}
      <Card>
        <div className="p-4">
          <div className="flex justify-between items-center">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep >= step.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.id ? '✓' : step.icon}
                  </div>
                  <p
                    className={`mt-2 text-xs text-center ${
                      currentStep >= step.id ? 'text-primary-600 font-medium' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      currentStep > step.id ? 'bg-primary-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Form Content */}
      <Card>
        <div className="p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">📋 Grundlæggende Information</h2>

              {/* TODO: Implement Projekt selection dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projekt <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.ProjektID || ''}
                  onChange={(e) => handleInputChange('ProjektID', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.ProjektID ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Vælg projekt...</option>
                  {/* TODO: Map projekter from API */}
                  <option value="1">Projekt 1 (Placeholder)</option>
                  <option value="2">Projekt 2 (Placeholder)</option>
                </select>
                {errors.ProjektID && (
                  <p className="mt-1 text-sm text-red-500">{errors.ProjektID}</p>
                )}
              </div>

              {/* TODO: Implement rich text editor for Bemærkning */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bemærkning <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.Bemærkning || ''}
                  onChange={(e) => handleInputChange('Bemærkning', e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.Bemærkning ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Indtast bemærkning for sagen..."
                />
                {errors.Bemærkning && (
                  <p className="mt-1 text-sm text-red-500">{errors.Bemærkning}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Status & Dates */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">📅 Status & Datoer</h2>

              {/* TODO: Implement date picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Oprettet Dato
                </label>
                <input
                  type="date"
                  value={formData.OprettetDato || ''}
                  onChange={(e) => handleInputChange('OprettetDato', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* TODO: Implement radio buttons for Færdigmeldt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Færdigmeldt Status
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.FærdigmeldtInt === 0}
                      onChange={() => {
                        handleInputChange('FærdigmeldtInt', 0);
                        handleInputChange('Færdigmeldt', 'Nej');
                      }}
                      className="mr-2"
                    />
                    <span>Nej - Sagen er aktiv</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.FærdigmeldtInt === 1}
                      onChange={() => {
                        handleInputChange('FærdigmeldtInt', 1);
                        handleInputChange('Færdigmeldt', 'Ja');
                      }}
                      className="mr-2"
                    />
                    <span>Ja - Sagen er færdigmeldt</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Påbud Information */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">⚠️ Påbud Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Påbud</label>
                <input
                  type="text"
                  value={formData.Påbud || ''}
                  onChange={(e) => handleInputChange('Påbud', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Indtast påbud (valgfrit)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Påbudsfrist
                </label>
                <input
                  type="date"
                  value={formData.Påbudsfrist || ''}
                  onChange={(e) => handleInputChange('Påbudsfrist', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">✅ Gennemse & Gem</h2>

              <div className="bg-gray-50 p-4 rounded-md space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Projekt ID</label>
                  <p className="mt-1">{formData.ProjektID || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Bemærkning</label>
                  <p className="mt-1 whitespace-pre-wrap">{formData.Bemærkning || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Oprettet Dato</label>
                  <p className="mt-1">
                    {formData.OprettetDato
                      ? new Date(formData.OprettetDato).toLocaleDateString('da-DK')
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Færdigmeldt</label>
                  <p className="mt-1">{formData.Færdigmeldt}</p>
                </div>
                {formData.Påbud && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Påbud</label>
                    <p className="mt-1">{formData.Påbud}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Navigation Buttons */}
      <Card>
        <div className="p-4 flex justify-between">
          <Button variant="ghost" onClick={handleCancel}>
            Annuller
          </Button>

          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button variant="ghost" onClick={handlePrevious}>
                ← Forrige
              </Button>
            )}

            {currentStep < STEPS.length ? (
              <Button variant="primary" onClick={handleNext}>
                Næste →
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={createSag.isPending || updateSag.isPending}
              >
                {createSag.isPending || updateSag.isPending
                  ? 'Gemmer...'
                  : isEditMode
                    ? '💾 Gem Ændringer'
                    : '✅ Opret Sag'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
