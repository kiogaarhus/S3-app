# GIDAS Explorer - Installationsvejledning (Dansk)

## Download og Installation på en ny PC

### Trin 1: Download projektet fra GitHub

**Metode A: Download som ZIP (Nemmest)**
1. Gå til https://github.com/kiogaarhus/S3-app
2. Klik på den grønne **"Code"** knap
3. Vælg **"Download ZIP"**
4. Pak ZIP-filen ud til en mappe på din computer (f.eks. `C:\Projects\gidas_explorer`)

**Metode B: Clone med Git**
```bash
git clone https://github.com/kiogaarhus/S3-app.git
cd S3-app
```

### Trin 2: Installer forudsætninger

Før du kan køre GIDAS Explorer skal følgende være installeret:

1. **Python 3.9 eller nyere**
   - Download fra: https://www.python.org/downloads/
   - ✅ VIGTIGT: Vælg "Add Python to PATH" under installation

2. **Node.js 18 eller nyere**
   - Download fra: https://nodejs.org/
   - Vælg LTS (Long Term Support) versionen

3. **Microsoft ODBC Driver 17 for SQL Server**
   - Download fra: https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
   - Nødvendig for database forbindelse

4. **Microsoft SQL Server adgang**
   - Du skal have adgang til en SQL Server database
   - Få database credentials (server, brugernavn, password, database navn)

### Trin 3: Kør installation

1. Åbn en kommandoprompt (cmd) som Administrator
2. Naviger til projektmappen:
   ```
   cd C:\Projects\gidas_explorer
   ```
3. Kør installationsscriptet:
   ```
   install.bat
   ```

Dette vil automatisk:
- ✅ Oprette et Python virtual environment
- ✅ Installere alle Python dependencies
- ✅ Installere alle Node.js dependencies

### Trin 4: Konfigurer miljø variabler (.env filer)

#### Backend konfiguration
Installationsscriptet opretter automatisk en `.env` fil i projektets rod-mappe baseret på `.env.example`.

**Rediger `.env` filen med dine database credentials:**

```env
# Database Configuration
GIDAS_DB_URL=mssql+pyodbc://server_navn/database_navn?driver=ODBC+Driver+18+for+SQL+Server&trusted_connection=yes&TrustServerCertificate=yes
```

**Eksempel med Windows Authentication:**
```env
GIDAS_DB_URL=mssql+pyodbc://srvsql29/Envidan_Gidas_SpvPlanDyn?driver=ODBC+Driver+18+for+SQL+Server&trusted_connection=yes&TrustServerCertificate=yes
```

**Eksempel med SQL Server Authentication:**
```env
GIDAS_DB_URL=mssql+pyodbc://brugernavn:password@server_navn/database_navn?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes
```

#### Frontend konfiguration
Installationsscriptet opretter automatisk en `frontend/.env` fil baseret på `frontend/.env.example`.

**Standard værdier (normalt ingen ændringer nødvendige):**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_CACHE_TTL=300000
VITE_ENV=development
```

### Trin 5: Start systemet

**Dobbeltklik på `start.bat`** eller kør i kommandoprompt:
```
start.bat
```

Dette vil:
- 🚀 Åbne to nye vinduer (et for backend, et for frontend)
- 🌐 Starte backend serveren på http://localhost:8000
- 🎨 Starte frontend serveren på http://localhost:5173

### Trin 6: Åbn applikationen

Åbn din browser og gå til:
- **Applikation:** http://localhost:5173
- **API Dokumentation:** http://localhost:8000/docs

---

## Batch filer til daglig brug

### `install.bat` - Kør én gang efter download
Dette script installerer alle nødvendige dependencies.

**Hvornår skal jeg bruge det?**
- Første gang du sætter projektet op
- Efter du har opdateret projektet fra GitHub
- Hvis der er nye dependencies tilføjet

### `start.bat` - Kør hver gang du vil starte systemet
Dette script starter både backend og frontend servere.

**Hvornår skal jeg bruge det?**
- Hver gang du vil arbejde med systemet
- Efter en genstart af computeren
- Når du vil teste applikationen

**Stop systemet:**
- Luk de to server vinduer
- Eller tryk `Ctrl+C` i hvert vindue

---

## Fejlfinding

### ❌ "Python ikke fundet"
- Sørg for at Python er installeret og tilføjet til PATH
- Genstart computeren efter Python installation
- Verificer med: `python --version`

### ❌ "Node.js ikke fundet"
- Sørg for at Node.js er installeret
- Genstart computeren efter Node.js installation
- Verificer med: `node --version`

### ❌ "Database forbindelsesfejl"
- Tjek at ODBC Driver 17 er installeret
- Verificer database credentials i `backend\.env` filen
- Tjek at SQL Server er tilgængelig fra din PC
- Test forbindelse med SQL Server Management Studio først

### ❌ "Port allerede i brug"
Hvis port 8000 eller 5173 allerede er i brug:
- Find og luk programmet der bruger porten
- Eller ændr porten i konfigurationen

### ❌ "Frontend kan ikke forbinde til backend"
- Sørg for at backend er startet først (vent 5-10 sekunder)
- Tjek at backend kører på http://localhost:8000
- Tjek firewall indstillinger

---

## Opdatering af systemet

Hvis der kommer nye versioner fra GitHub:

1. Download ny ZIP eller kør `git pull`
2. Kør `install.bat` igen for at opdatere dependencies
3. Start systemet med `start.bat`

---

## Support

Ved problemer:
- Opret et issue på GitHub: https://github.com/kiogaarhus/S3-app/issues
- Kontakt udviklingsteamet
- Tjek `INSTALLATION.md` for mere detaljeret information
