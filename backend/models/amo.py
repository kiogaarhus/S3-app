"""
SQLAlchemy models for AMO database tables.
Maps to existing database schema in Envidan_Gidas_SpvPlanDyn_Test.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class AMOProjekttype(Base):
    """AMO Project Type model."""
    __tablename__ = "AMOProjekttype"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True)  # ✅ Korrekt
    ProjektType = Column(String(255), nullable=True)  # RETTET: var "Navn"
    Bemærkning = Column(String(255), nullable=True)  # RETTET: var "Beskrivelse"
    VisFraGIDAS_Delopland_ID = Column(Integer, nullable=True)  # TILFØJET
    VisFraGIDAS_Kloaksystem_Sta = Column(Integer, nullable=True)  # TILFØJET
    VisFraGIDAS_Kloaksystem_Pla = Column(Integer, nullable=True)  # TILFØJET
    VisFraGIDAS_Afløbstype_Sta = Column(Integer, nullable=True)  # TILFØJET
    VisFraGIDAS_Afløbstype_Pla = Column(Integer, nullable=True)  # TILFØJET
    VisFraGIDAS_TilmeldtKloakforsyningen = Column(Integer, nullable=True)  # TILFØJET
    VisFraGIDAS_tilmeldingstype = Column(Integer, nullable=True)  # TILFØJET
    VisDynamiskTal = Column(Integer, nullable=True)  # TILFØJET
    VisDynamiskTekst = Column(Integer, nullable=True)  # TILFØJET
    VisDymamiskListe = Column(Integer, nullable=True)  # TILFØJET
    DtalLabel = Column(String(255), nullable=True)  # TILFØJET
    DtekstLabel = Column(String(255), nullable=True)  # TILFØJET
    DlisteLabel = Column(String(255), nullable=True)  # TILFØJET
    VisJournalnummer = Column(Integer, nullable=True)  # TILFØJET
    VisFærdigmelding = Column(Integer, nullable=True)  # TILFØJET
    VisSagsEmne = Column(Integer, nullable=True)  # TILFØJET
    VisAfslutUFær = Column(Integer, nullable=True)  # TILFØJET
    VisPaabudUdloeb = Column(Integer, nullable=True)  # TILFØJET
    Aktiv = Column(Integer, nullable=True)  # RETTET: var Boolean, nu Integer
    Placering = Column(Integer, nullable=True)  # TILFØJET

    # Relationships
    projekter = relationship("AMOProjekt", back_populates="projekttype")
    dynamiske_lister = relationship("AMOProjekttypeDynamiskListe", backref="projekttype")
    registreringer = relationship("AMOProjekttypeReg", backref="projekttype")
    påbud = relationship("AMOPåbudOm", backref="projekttype")


class AMOProjekt(Base):
    """AMO Project model."""
    __tablename__ = "AMOProjekt"
    __table_args__ = {"schema": "dbo"}

    Id = Column(Integer, primary_key=True)  # RETTET: var "ID"
    Projektnavn = Column(String(255), nullable=True)  # RETTET: var "Navn"
    Projektmappe = Column(String(255), nullable=True)  # TILFØJET: ny kolonne
    ProjekttypeID = Column(Integer, ForeignKey("dbo.AMOProjekttype.ID"), nullable=True)  # ✅ Korrekt
    placering = Column(Integer, nullable=True)  # TILFØJET: ny kolonne
    afsluttet = Column(Integer, nullable=True)  # RETTET: var "Status" (nu int)

    # Relationships
    projekttype = relationship("AMOProjekttype", back_populates="projekter")
    # Note: AMOPåbudOm references ProjektTypeID, not projekt ID
    # sag_registreringer = relationship("AMOSagReg", backref="projekt")  # Disabled - no direct FK


class AMOHændelsestyper(Base):
    """AMO Event Types model."""
    __tablename__ = "AMOHændelsestyper"
    __table_args__ = {"schema": "dbo"}

    Id = Column(Integer, primary_key=True)  # ✅ Korrekt
    HændelsesType = Column(String(255), nullable=True)  # RETTET: var "Navn"
    Rækkefølge = Column(Integer, nullable=True)  # RETTET: var "Beskrivelse"
    MåIkkeSlettes = Column(Boolean, nullable=True)  # TILFØJET: ny kolonne
    NæsteFrist = Column(String(255), nullable=True)  # TILFØJET: ny kolonne
    Systempost = Column(Integer, nullable=True)  # TILFØJET: ny kolonne

    # Relationships
    haendelser = relationship("AMOHændelser", back_populates="type")


class AMOHændelser(Base):
    """AMO Events model."""
    __tablename__ = "AMOHændelser"
    __table_args__ = {"schema": "dbo"}

    Id = Column(Integer, primary_key=True)  # Korrekt fra dbt
    SagsID = Column(Integer, nullable=True)  # RETTET: var "SagID"
    TypeID = Column(Integer, ForeignKey("dbo.AMOHændelsestyper.Id"), nullable=True)  # Korrekt fra dbt
    Dato = Column(DateTime, nullable=True)  # Korrekt fra dbt
    Bemærkning = Column(Text, nullable=True)  # RETTET: var "Beskrivelse"
    Init = Column(String(100), nullable=True)  # RETTET: var "OprettetAf"
    Skjul = Column(Boolean, nullable=True)  # TILFØJET: manglede
    Link = Column(String(255), nullable=True)  # TILFØJET: manglede

    # Relationships
    type = relationship("AMOHændelsestyper", back_populates="haendelser")


class AMOSagsbehandling(Base):
    """AMO Case Treatment model."""
    __tablename__ = "AMOSagsbehandling"
    __table_args__ = {"schema": "dbo"}

    Id = Column(Integer, primary_key=True)  # RETTET: var "ID"
    ProjektID = Column(Integer, nullable=True)  # RETTET: var "SagID"
    Bemærkning = Column(Text, nullable=True)  # RETTET: var "Beskrivelse"
    OprettetDato = Column(DateTime, nullable=True)  # ✅ Korrekt
    AfsluttetDato = Column(DateTime, nullable=True)  # ✅ Korrekt

    # Status kolonner til KPI'er
    Afsluttet = Column(String(50), nullable=True)  # TILFØJET: til KPI'er
    AfsluttetInt = Column(Integer, nullable=True)  # TILFØJET: til KPI'er
    Færdigmeldt = Column(String(50), nullable=True)  # TILFØJET: til KPI'er
    FærdigmeldtInt = Column(Integer, nullable=True)  # TILFØJET: til KPI'er
    FærdigmeldingDato = Column(DateTime, nullable=True)  # TILFØJET: til udvidet KPI
    AfslutUdenFærdigmelding = Column(Integer, nullable=True)  # TILFØJET: til udvidet KPI
    Påbud = Column(String(50), nullable=True)  # TILFØJET: til KPI'er
    Påbudsfrist = Column(DateTime, nullable=True)  # TILFØJET: til KPI'er

    # Adresse og ejendom kolonner (direkte i tabellen!)
    Ejendomsnummer = Column(Integer, nullable=True)  # Ejendomsnummer
    Adresse = Column(String(255), nullable=True)  # Fuld adresse
    Adresse2 = Column(String(255), nullable=True)  # Alternativ adresse
    Postnummer = Column(Integer, nullable=True)  # Postnummer
    Matrnr = Column(String(255), nullable=True)  # Matrikelnummer
    EjerEtFelt = Column(Text, nullable=True)  # Ejer information
    EjerID = Column(Integer, nullable=True)  # Ejer ID
    AdresseID = Column(String(255), nullable=True)  # Adresse ID
    AdgangsadresseID = Column(Integer, nullable=True)  # Adgangsadresse ID

    # Undersøgelse & Varsel kolonner
    SkalUndersøges = Column(String(128), nullable=True)
    SkalUndersøgesDato = Column(DateTime, nullable=True)
    SkalUndersøgesDatoFrist = Column(DateTime, nullable=True)
    VarselOmPåbud = Column(String(128), nullable=True)
    VarselDato = Column(DateTime, nullable=True)
    VarselDatoFrist = Column(DateTime, nullable=True)

    # Påbud detaljer kolonner
    Påbudsdato = Column(DateTime, nullable=True)
    PåbudOm = Column(Integer, ForeignKey("dbo.AMOPåbudOm.Id"), nullable=True)
    TilladelsesDATO = Column(DateTime, nullable=True)
    KontraktDATO = Column(DateTime, nullable=True)
    PaabudUdloeb = Column(DateTime, nullable=True)

    # Udsættelse & Indskærpelse kolonner
    Udsættelse = Column(String(128), nullable=True)
    UdsættelseDato = Column(DateTime, nullable=True)
    Udsættelsesfrist = Column(DateTime, nullable=True)
    Indskærpelse = Column(String(128), nullable=True)
    IndskærpelseDato = Column(DateTime, nullable=True)
    IndskærpelseFrist = Column(DateTime, nullable=True)

    # Politianmeldelse kolonner
    Politianmeldelse = Column(String(128), nullable=True)
    PolitianmeldelseDato = Column(DateTime, nullable=True)
    PolitianmeldelseDatoFrist = Column(DateTime, nullable=True)
    PolitianmeldelseAfgjort = Column(String(128), nullable=True)

    # Disposition & Frister kolonner
    Disp = Column(String(128), nullable=True)
    DispType = Column(Integer, ForeignKey("dbo.AMODispType.ID"), nullable=True)
    DispDato = Column(DateTime, nullable=True)
    DispFrist = Column(DateTime, nullable=True)
    NæsteDispFrist = Column(DateTime, nullable=True)
    NæsteFristDato = Column(DateTime, nullable=True)
    NæsteFristType = Column(Integer, nullable=True)

    # Færdigmelding & Metadata kolonner
    RegnvandNedsives = Column(String(128), nullable=True)
    RegistreretFærdigmeldingDato = Column(DateTime, nullable=True)
    Journalnummer = Column(String(255), nullable=True)
    SidsteRedigeretAF = Column(String(100), nullable=True)
    SidstRettetDato = Column(DateTime, nullable=True)


class AMOimport(Base):
    """AMO Import history model."""
    __tablename__ = "AMOimport"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, autoincrement=True)  # ✅ Korrekt
    Ejendomsnummer = Column(String(255), nullable=True)  # Fra dbt
    Beliggenhed = Column(String(255), nullable=True)  # Fra dbt
    Vejkode = Column(String(255), nullable=True)  # Fra dbt
    Vejnavn = Column(String(255), nullable=True)  # Fra dbt
    Husnummer = Column(String(255), nullable=True)  # Fra dbt
    Husbogstav = Column(String(255), nullable=True)  # Fra dbt

    # Relationships
    temp_data = relationship("AMOimportTemp", backref="import_record")
    temp_data2 = relationship("AMOimportTemp2", backref="import_record")


class AMOImportJob(Base):
    """
    Import job tracking model for async file uploads and processing.
    Extends AMOimport with job-specific fields for status tracking.
    """
    __tablename__ = "AMOImportJob"
    __table_args__ = {"schema": "dbo"}

    job_id = Column(String(36), primary_key=True)  # UUID
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=True)
    file_size = Column(Integer, nullable=True)
    status = Column(String(50), nullable=False, default="pending")  # pending, processing, completed, failed
    progress = Column(Integer, default=0)  # 0-100
    total_rows = Column(Integer, nullable=True)
    processed_rows = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_by = Column(String(100), nullable=True)


class AMODispType(Base):
    """AMO Disposition Type model."""
    __tablename__ = "AMODispType"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True)
    Navn = Column(String(255), nullable=True)
    Beskrivelse = Column(Text, nullable=True)
    Aktiv = Column(Boolean, nullable=True, default=True)


class AMOimportTemp(Base):
    """AMO Import Temporary staging table."""
    __tablename__ = "AMOimportTemp"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, autoincrement=True)
    ImportID = Column(Integer, ForeignKey("dbo.AMOimport.ID"), nullable=True)
    RawData = Column(Text, nullable=True)
    OprettetDato = Column(DateTime, nullable=True)
    Status = Column(String(50), nullable=True)


class AMOimportTemp2(Base):
    """AMO Import Temporary 2 staging table."""
    __tablename__ = "AMOimportTemp2"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True, autoincrement=True)
    ImportID = Column(Integer, ForeignKey("dbo.AMOimport.ID"), nullable=True)
    RawData = Column(Text, nullable=True)
    OprettetDato = Column(DateTime, nullable=True)
    Status = Column(String(50), nullable=True)


class AMOProjekttypeDynamiskListe(Base):
    """AMO Project Type Dynamic List model."""
    __tablename__ = "AMOProjekttypeDynamiskListe"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True)  # ✅ Korrekt
    ProjektTypeID = Column(Integer, ForeignKey("dbo.AMOProjekttype.ID"), nullable=True)  # RETTET: var "ProjekttypeID"
    Navn = Column(String(255), nullable=True)  # RETTET: var "ListeNavn"
    Placering = Column(Integer, nullable=True)  # RETTET: var "Rækkefølge"


class AMOPåbudOm(Base):
    """AMO Påbud Om (Order About) model."""
    __tablename__ = "AMOPåbudOm"
    __table_args__ = {"schema": "dbo"}

    Id = Column(Integer, primary_key=True)  # RETTET: var "ID"
    PåbudBud = Column(String(255), nullable=True)  # RETTET: var "Navn"
    ProjektTypeID = Column(Integer, ForeignKey("dbo.AMOProjekttype.ID"), nullable=True)  # RETTET: var "ProjektID"
    Placering = Column(Integer, nullable=True)  # TILFØJET: ny kolonne


# Alias for easier importing (without special characters)
AMOPaabudOm = AMOPåbudOm


class AMOSagReg(Base):
    """AMO Case Registration model."""
    __tablename__ = "AMOSagReg"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True)  # ✅ Korrekt
    SagID = Column(Integer, nullable=True)  # ✅ Korrekt
    PTregID = Column(Integer, nullable=True)  # TILFØJET: ny kolonne
    JaNej = Column(Integer, nullable=True)  # TILFØJET: ny kolonne
    Dato = Column(DateTime, nullable=True)  # RETTET: var "OprettetDato"
    Frist = Column(DateTime, nullable=True)  # TILFØJET: ny kolonne
    Init = Column(String(255), nullable=True)  # RETTET: var "Beskrivelse"


class AMOProjekttypeReg(Base):
    """AMO Project Type Registration model."""
    __tablename__ = "AMOProjekttypeReg"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True)  # ✅ Korrekt
    ProjektTypeID = Column(Integer, ForeignKey("dbo.AMOProjekttype.ID"), nullable=True)  # ✅ Korrekt
    Navn = Column(String(255), nullable=True)  # RETTET: var "Beskrivelse"
    Placering = Column(Integer, nullable=True)  # TILFØJET: ny kolonne
    Hiraki = Column(Integer, nullable=True)  # TILFØJET: ny kolonne
    HændelseID = Column(Integer, nullable=True)  # TILFØJET: ny kolonne
    Frist = Column(Integer, nullable=True)  # TILFØJET: ny kolonne
    PåkrævetHvis = Column(Integer, nullable=True)  # TILFØJET: ny kolonne
    KunHvisMindre = Column(Integer, nullable=True)  # TILFØJET: ny kolonne
    Afslut = Column(Integer, nullable=True)  # TILFØJET: ny kolonne


# Task 14: BBR Tables
class BBRGrundAfloeb(Base):
    """BBR Grund Afloeb lookup table (code table for drainage conditions)."""
    __tablename__ = "BBRGrundAfloeb"
    __table_args__ = {"schema": "dbo"}

    Kode = Column(String(50), primary_key=True)
    Beskrivelse = Column(String(255), nullable=True)
    BurdeHaveTank = Column(Integer, nullable=True)


class BBRGrund(Base):
    """BBR Grund (Building and Housing Register - Property info)."""
    __tablename__ = "BBRGrund"
    __table_args__ = {"schema": "dbo"}

    ID = Column(Integer, primary_key=True)
    KundeID = Column(Integer, nullable=True)
    EjendomID = Column(Integer, nullable=True)
    AdgangsAdresseID = Column(Integer, nullable=True)
    Vandforsyning = Column(String(50), nullable=True)
    Afloebsforhold = Column(String(50), nullable=True)
    AfloebsforholdTilladelse = Column(String(50), nullable=True)
    EnviTrixAfmeldt = Column(Integer, nullable=True)
    EnviTrixKundeEntreprenorID = Column(Integer, nullable=True)
    ErManueltOprettet = Column(Integer, nullable=True)
    ErPermanent = Column(Integer, nullable=True)
    Levid = Column(String(50), nullable=True)
    Slettet = Column(Integer, nullable=True)
    ObjStatus = Column(String(50), nullable=True)


# Aliases for easier importing (without special characters)
AMOHaendelsestyper = AMOHændelsestyper
AMOHaendelser = AMOHændelser
