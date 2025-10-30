"""
Analyse af forskellen mellem Sagsbehandling API og Kloak Separering Dashboard API
Hvorfor giver de forskellige antal aktive separeringssager?
"""

# Læs nuværende dashboard API logik fra separering.py
print("=== ANALYSE AF FORSKELLE MELLEM APIS ===\n")

# Fra SepareringDashboard.tsx og API kald kan vi se:
print("Bruger rapporterer:")
print("- Sagsbehandling filtrering: 490 aktive separeringssager (korrekt)")
print("- Kloak Separering Dashboard: 1364 aktive separeringssager (forkert)")
print("- Forskel: 1364 - 490 = 874 for mange sager i dashboard\n")

# Nuværende dashboard logik (fra backend/api/separering.py linje 104-121):
dashboard_logik = """
aktive_separering_sager = (
    db.query(func.count(AMOSagsbehandling.Id))
    .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
    .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
    .filter(and_(
        AMOProjekttype.ProjektType == "Separering",
        # Aktiv = FærdigmeldtInt = 0 (eller NULL for aktive uden status)
        or_(
            AMOSagsbehandling.FærdigmeldtInt == 0,
            AMOSagsbehandling.FærdigmeldtInt.is_(None)
        ),
        # Ikke afsluttet
        AMOSagsbehandling.AfsluttetInt != 1
    ))
    .scalar() or 0
)
"""

print("NUVÆRENDE DASHBOARD LOGIK:")
print(dashboard_logik)

print("\nPROBLEMET:")
print("- Dashboard tæller alle med FærdigmeldtInt = 0 som aktive")
print("- Dashboard tæller alle med FærdigmeldtInt = NULL som aktive")
print("- Men nogle af disse er måske ikke reelt 'aktive' i forretningssammenhæng")

print("\nKORREKT LOGIK (baseret på 490 fra Sagsbehandling):")
korrekt_logik = """
# Korrekt beregning baseret på Sagsbehandling API logik:
# Total separering sager - færdigmeldte - afsluttede - afsluttet_færdigmeldt

active_separering = (
    db.query(func.count(AMOSagsbehandling.Id))
    .join(AMOProjekt, AMOSagsbehandling.ProjektID == AMOProjekt.Id)
    .join(AMOProjekttype, AMOProjekt.ProjekttypeID == AMOProjekttype.ID)
    .filter(and_(
        AMOProjekttype.ProjektType == "Separering",
        # IKKE færdigmeldt
        AMOSagsbehandling.FærdigmeldtInt != 1,
        # IKKE afsluttet
        AMOSagsbehandling.AfsluttetInt != 1,
        # IKKE afsluttet færdigmeldt
        AMOSagsbehandling.FærdigmeldtInt != -1
    ))
    .scalar() or 0
)
"""

print(korrekt_logik)

print("\nSTATUS SYSTEM OVERBLIK:")
print("FærdigmeldtInt værdier:")
print("  -1: Afsluttet færdigmeldt (tæller IKKE som aktiv)")
print("   0: I gang (tæller som aktiv)")
print("   1: Færdigmeldt (tæller IKKE som aktiv)")
print(" NULL: Ukendt (skal vurderes)")
print("  2+: Andre statusser (skal vurderes)")

print("\nAfsluttetInt værdier:")
print("   1: Afsluttet (tæller IKKE som aktiv)")
print(" NULL/0: Ikke afsluttet (kan være aktiv)")

print("\n=== LØSNING ===")
print("Dashboard API skal rettes til at bruge samme logik som Sagsbehandling:")
print("1. Find alle separering sager")
print("2. Træk dem der har FærdigmeldtInt = 1 (færdigmeldte)")
print("3. Træk dem der har AfsluttetInt = 1 (afsluttede)")
print("4. Træk dem der har FærdigmeldtInt = -1 (afsluttet færdigmeldt)")
print("5. Resultatet skulle være 490")

print("\nNæste skridt:")
print("1. Ret backend/api/separering.py linje 60-75")
print("2. Erstat nuværende logik med den korrekte beregning")
print("3. Test at dashboard nu viser 490 aktive sager")