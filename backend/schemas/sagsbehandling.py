"""
Pydantic schemas for AMOSagsbehandling (Case Treatment).
Matches actual database schema with ProjektID, Færdigmeldt, Påbud, etc.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, computed_field


class SagBase(BaseModel):
    """Base schema for case treatment with common fields."""

    ProjektID: Optional[int] = Field(None, description="Project foreign key")
    Bemærkning: Optional[str] = Field(None, description="Case notes/description")
    OprettetDato: Optional[datetime] = Field(None, description="Creation date")
    AfsluttetDato: Optional[datetime] = Field(None, description="Completion date")

    # Status fields for KPIs
    Afsluttet: Optional[str] = Field(None, max_length=50, description="Completion status text")
    AfsluttetInt: Optional[int] = Field(None, description="Completion status integer")
    Færdigmeldt: Optional[str] = Field(None, max_length=50, description="Finished report status text")
    FærdigmeldtInt: Optional[int] = Field(None, description="Finished report status integer")
    FærdigmeldingDato: Optional[datetime] = Field(None, description="Finished report date")
    AfslutUdenFærdigmelding: Optional[int] = Field(None, description="Closed without finished report")
    Påbud: Optional[str] = Field(None, max_length=50, description="Order/påbud status text")
    Påbudsfrist: Optional[datetime] = Field(None, description="Order deadline date")


class SagCreate(SagBase):
    """Schema for creating a new case."""

    ProjektID: int = Field(..., description="Project ID (required)")
    Bemærkning: str = Field(..., min_length=1, description="Case description (required)")


class SagUpdate(BaseModel):
    """Schema for updating an existing case (all fields optional)."""

    ProjektID: Optional[int] = None
    Bemærkning: Optional[str] = Field(None, min_length=1)
    OprettetDato: Optional[datetime] = None
    AfsluttetDato: Optional[datetime] = None
    Afsluttet: Optional[str] = Field(None, max_length=50)
    AfsluttetInt: Optional[int] = None
    Færdigmeldt: Optional[str] = Field(None, max_length=50)
    FærdigmeldtInt: Optional[int] = None
    FærdigmeldingDato: Optional[datetime] = None
    AfslutUdenFærdigmelding: Optional[int] = None
    Påbud: Optional[str] = Field(None, max_length=50)
    Påbudsfrist: Optional[datetime] = None


class SagStatusUpdate(BaseModel):
    """Schema for updating case status via PATCH endpoint."""

    FærdigmeldtInt: Optional[int] = Field(None, description="Færdigmeldt status (0 or 1)")
    Påbud: Optional[str] = Field(None, max_length=50, description="Påbud status")
    Påbudsfrist: Optional[datetime] = Field(None, description="Påbud deadline")


class SagOut(SagBase):
    """Schema for case output (response) with computed fields."""

    Id: int = Field(..., description="Case ID")

    # Related data from joins (populated by API)
    projekt_navn: Optional[str] = Field(None, description="Project name from AMOProjekt")
    projekttype_navn: Optional[str] = Field(None, description="Project type name from AMOProjekttype")

    # Address and property data from AMOSagsbehandling table
    ejendomsnummer: Optional[str] = Field(None, description="Property number")
    beliggenhed: Optional[str] = Field(None, description="Location/Beliggenhed")
    vejnavn: Optional[str] = Field(None, description="Street name")
    husnummer: Optional[str] = Field(None, description="House number")
    husbogstav: Optional[str] = Field(None, description="House letter")
    postnummer: Optional[str] = Field(None, description="Postal code")
    by: Optional[str] = Field(None, description="City name")
    matrnr: Optional[str] = Field(None, description="Cadastral number (matrikelnummer)")
    ejer: Optional[str] = Field(None, description="Owner information")
    fuld_adresse: Optional[str] = Field(None, description="Full address string")
    anlaegs_info: Optional[str] = Field(None, description="Facility information (BEMARKNING_Rens from tblAdresseEjendom)")

    # Undersøgelse & Varsel
    SkalUndersøges: Optional[str] = Field(None, description="Should be investigated")
    SkalUndersøgesDato: Optional[datetime] = Field(None, description="Investigation date")
    SkalUndersøgesDatoFrist: Optional[datetime] = Field(None, description="Investigation deadline")
    VarselOmPåbud: Optional[str] = Field(None, description="Warning about order")
    VarselDato: Optional[datetime] = Field(None, description="Warning date")
    VarselDatoFrist: Optional[datetime] = Field(None, description="Warning deadline")

    # Påbud detaljer
    Påbudsdato: Optional[datetime] = Field(None, description="Order date")
    PåbudOm: Optional[int] = Field(None, description="Order about (reference to AMOPåbudOm)")
    TilladelsesDATO: Optional[datetime] = Field(None, description="Permission date")
    KontraktDATO: Optional[datetime] = Field(None, description="Contract date")
    PaabudUdloeb: Optional[datetime] = Field(None, description="Order expiration date")

    # Udsættelse & Indskærpelse
    Udsættelse: Optional[str] = Field(None, description="Postponement")
    UdsættelseDato: Optional[datetime] = Field(None, description="Postponement date")
    Udsættelsesfrist: Optional[datetime] = Field(None, description="Postponement deadline")
    Indskærpelse: Optional[str] = Field(None, description="Injunction")
    IndskærpelseDato: Optional[datetime] = Field(None, description="Injunction date")
    IndskærpelseFrist: Optional[datetime] = Field(None, description="Injunction deadline")

    # Politianmeldelse
    Politianmeldelse: Optional[str] = Field(None, description="Police report")
    PolitianmeldelseDato: Optional[datetime] = Field(None, description="Police report date")
    PolitianmeldelseDatoFrist: Optional[datetime] = Field(None, description="Police report deadline")
    PolitianmeldelseAfgjort: Optional[str] = Field(None, description="Police report resolved")

    # Disposition & Frister
    Disp: Optional[str] = Field(None, description="Disposition")
    DispType: Optional[int] = Field(None, description="Disposition type (reference to AMODispType)")
    DispDato: Optional[datetime] = Field(None, description="Disposition date")
    DispFrist: Optional[datetime] = Field(None, description="Disposition deadline")
    NæsteDispFrist: Optional[datetime] = Field(None, description="Next disposition deadline")
    NæsteFristDato: Optional[datetime] = Field(None, description="Next deadline date")
    NæsteFristType: Optional[int] = Field(None, description="Next deadline type")

    # Færdigmelding & Metadata
    RegnvandNedsives: Optional[str] = Field(None, description="Rainwater seepage")
    RegistreretFærdigmeldingDato: Optional[datetime] = Field(None, description="Registered completion date")
    Journalnummer: Optional[str] = Field(None, description="Journal number")
    SidsteRedigeretAF: Optional[str] = Field(None, description="Last edited by")
    SidstRettetDato: Optional[datetime] = Field(None, description="Last edited date")

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def case_age_days(self) -> Optional[int]:
        """Calculate case age in days since creation."""
        if self.OprettetDato:
            delta = datetime.now() - self.OprettetDato
            return delta.days
        return None


class SagListResponse(BaseModel):
    """Response schema for list of cases."""

    success: bool = True
    data: list[SagOut]
    pagination: Optional[dict] = None
    meta: Optional[dict] = None


class SagDetailResponse(BaseModel):
    """Response schema for single case."""

    success: bool = True
    data: SagOut
    meta: Optional[dict] = None


# Backwards compatibility aliases
SagsbehandlingBase = SagBase
SagsbehandlingCreate = SagCreate
SagsbehandlingUpdate = SagUpdate
SagsbehandlingOut = SagOut
SagsbehandlingListResponse = SagListResponse
SagsbehandlingDetailResponse = SagDetailResponse
