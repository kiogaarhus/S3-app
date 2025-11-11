# Installation Guide for GIDAS Explorer

This guide provides step-by-step instructions for installing and configuring GIDAS Explorer on a local machine.

## 📋 System Requirements

### Hardware Requirements
- **RAM**: Minimum 8GB, Recommended 16GB
- **Storage**: Minimum 5GB free space
- **Processor**: Modern CPU with 4+ cores recommended

### Software Requirements

#### Operating System
- **Windows**: Windows 10 or later (Primary target)
- **macOS**: macOS 10.15 or later
- **Linux**: Ubuntu 18.04+ / CentOS 7+ / Debian 10+

#### Required Software
- **Python**: 3.9 or higher
- **Node.js**: 18.0 or higher
- **npm**: 8.0 or higher (comes with Node.js)
- **Git**: Latest version
- **Microsoft SQL Server**: 2017 or later (or access to remote SQL Server)
- **Microsoft ODBC Driver 17**: Required for SQL Server connections

#### Optional Software
- **SQL Server Management Studio (SSMS)**: For database management
- **Visual Studio Code**: Recommended code editor
- **Postman**: API testing (optional)

## 🚀 Installation Steps

### Step 1: Prerequisites Installation

#### Install Python 3.9+
1. Download Python from [python.org](https://www.python.org/downloads/)
2. Run installer with **"Add Python to PATH"** checked
3. Verify installation:
   ```bash
   python --version
   # Should show Python 3.9.x or higher
   ```

#### Install Node.js 18+
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Run installer (includes npm)
3. Verify installation:
   ```bash
   node --version
   npm --version
   # Should show Node.js 18.x and npm 8.x or higher
   ```

#### Install Git
1. Download Git from [git-scm.com](https://git-scm.com/)
2. Run installer with default settings
3. Verify installation:
   ```bash
   git --version
   ```

#### Install Microsoft ODBC Driver for SQL Server
1. Download ODBC Driver 17 from [Microsoft](https://learn.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server)
2. Choose the appropriate version for your system (x64 for most modern systems)
3. Run the installer with default settings
4. Verify installation:
   ```bash
   # Test ODBC driver
   python -c "import pyodbc; print([x for x in pyodbc.drivers() if 'SQL Server' in x])"
   # Should show: ['ODBC Driver 17 for SQL Server']
   ```

### Step 2: Database Setup

#### Option A: Use Existing SQL Server
1. Ensure you have access to a SQL Server instance
2. Get connection details:
   - Server name
   - Database name
   - Username and password
   - Authentication method

#### Option B: Install Local SQL Server Express
1. Download SQL Server Express from [Microsoft](https://www.microsoft.com/sql-server/sql-server-downloads)
2. Install with "SQL Server and Management Tools"
3. Configure during installation:
   - Choose "Mixed Mode" authentication
   - Set a strong SA password
   - Enable TCP/IP protocol
4. Install SQL Server Management Studio (SSMS)

#### Create Database (if needed)
1. Connect to SQL Server using SSMS
2. Execute the following SQL:
   ```sql
   CREATE DATABASE GIDAS_Explorer;
   GO
   ```

### Step 3: Get the Application

#### Clone Repository
```bash
# Clone from your repository
git clone <repository-url>
cd gidas_explorer

# Or download and extract ZIP file if Git is not available
```

### Step 4: Backend Configuration

#### Create Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Activate on macOS/Linux
source venv/bin/activate

# Verify activation (command prompt should show (venv))
```

#### Install Python Dependencies
```bash
# Upgrade pip
pip install --upgrade pip

# Install required packages
pip install -r requirements.txt

# If installation fails, try installing individual packages:
pip install fastapi uvicorn sqlalchemy pyodbc pydantic python-multipart python-jose passlib bcrypt openpyxl reportlab
```

#### Configure Environment Variables

**Backend Configuration (.env in project root)**

The installation script automatically creates a `.env` file from `.env.example`. Edit this file with your database credentials:

```env
# Database Configuration - UPDATE WITH YOUR VALUES
GIDAS_DB_URL=mssql+pyodbc://YOUR_SERVER/YOUR_DATABASE?driver=ODBC+Driver+18+for+SQL+Server&trusted_connection=yes&TrustServerCertificate=yes
```

**Frontend Configuration (frontend/.env)**

The installation script automatically creates `frontend/.env` from `frontend/.env.example`. Default values usually don't need changes:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_CACHE_TTL=300000
VITE_ENV=development
```

#### Test Database Connection
```bash
# Test connection by running a simple Python script
python -c "
import sqlalchemy
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv('DATABASE_URL')
try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        result = conn.execute('SELECT 1 as test')
        print('✅ Database connection successful!')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    print('Please check your DATABASE_URL in .env file')
"
```

### Step 5: Frontend Configuration

#### Install Node Dependencies
```bash
cd frontend
npm install
cd ..
```

**Note:** The `install.bat` script automatically handles all configuration including creating `frontend/.env` from `frontend/.env.example`. Manual configuration is only needed if you didn't use the install script.

### Step 6: Start the Application

#### Automated Start (Recommended on Windows)
Simply double-click `start.bat` or run:
```bash
start.bat
```

This will automatically:
- Start the backend server on http://localhost:8000
- Start the frontend server on http://localhost:5173
- Open both in separate windows

#### Manual Start (Alternative)

**Backend Server:**
1. Open a new terminal/command prompt
2. Navigate to project root
3. Activate virtual environment and start backend:
   ```bash
   venv\Scripts\activate  # Windows
   uvicorn backend.main:app --reload --port 8000
   ```

**Frontend Development Server:**
1. Open another terminal/command prompt
2. Navigate to project root
3. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

#### Verify Installation
1. **Backend**: Open http://localhost:8000 in browser
   - Should show `{"message": "GIDAS Explorer API"}`
2. **Frontend**: Open http://localhost:5173 (or URL shown in terminal)
   - Should show the GIDAS Explorer interface

### Step 7: Initial Data Setup

#### Test API Endpoints
```bash
# Test health endpoint
curl http://localhost:8000/

# Test sager endpoint
curl http://localhost:8000/api/sager?page=1&per_page=5
```

#### Verify Database Models
```bash
# Test database models
python -c "
from backend.database.session import get_db
from backend.models.amo import AMOSagsbehandling
import os
from dotenv import load_dotenv

load_dotenv()
try:
    db = next(get_db())
    case_count = db.query(AMOSagsbehandling).count()
    print(f'✅ Database models loaded successfully!')
    print(f'Found {case_count} cases in database')
except Exception as e:
    print(f'❌ Error loading database models: {e}')
"
```

## 🔧 Configuration Details

### Database Connection String Format

**Important:** Use `mssql+pyodbc://` prefix (NOT `sqlalchemy+pyodbc://`)

#### Windows Authentication (Recommended)
```env
GIDAS_DB_URL=mssql+pyodbc://YOUR_SERVER_NAME/DATABASE_NAME?driver=ODBC+Driver+18+for+SQL+Server&trusted_connection=yes&TrustServerCertificate=yes
```

#### SQL Server Authentication
```env
GIDAS_DB_URL=mssql+pyodbc://USERNAME:PASSWORD@YOUR_SERVER_NAME/DATABASE_NAME?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes
```

#### Connection String Examples
```env
# Local SQL Server Express with Windows Authentication
GIDAS_DB_URL=mssql+pyodbc://localhost\SQLEXPRESS/GIDAS_Explorer?driver=ODBC+Driver+18+for+SQL+Server&trusted_connection=yes&TrustServerCertificate=yes

# Remote SQL Server with SQL Authentication
GIDAS_DB_URL=mssql+pyodbc://sa:YourPassword@server.company.com/GIDAS_Explorer?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes

# Production example (from .env.example)
GIDAS_DB_URL=mssql+pyodbc://srvsql29/Envidan_Gidas_SpvPlanDyn?driver=ODBC+Driver+18+for+SQL+Server&trusted_connection=yes&TrustServerCertificate=yes
```

### Environment Variables Reference

#### Backend (.env in project root)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GIDAS_DB_URL` | ✅ | Full database connection string | See formats above |

#### Frontend (frontend/.env)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_BASE_URL` | ✅ | Backend API URL | `http://localhost:8000` |
| `VITE_API_CACHE_TTL` | ❌ | Cache duration in ms | `300000` (5 minutes) |
| `VITE_ENV` | ❌ | Environment type | `development` or `production` |

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
**Problem**: `sqlalchemy.exc.DBAPIError: (pyodbc.InterfaceError) ('IM002', '[IM002]...')`

**Solutions**:
- Install Microsoft ODBC Driver 17 for SQL Server (see Step 1)
- Verify ODBC driver installation: `python -c "import pyodbc; print(pyodbc.drivers())"`
- Verify SQL Server is running and accepting connections
- Check firewall settings (port 1433)
- Ensure SQL Server allows TCP/IP connections

**Commands to check**:
```bash
# Test ODBC driver
python -c "import pyodbc; print([x for x in pyodbc.drivers() if 'SQL Server' in x])"
# Should show: ['ODBC Driver 17 for SQL Server']

# Test telnet connection
telnet your-server-name 1433
```

#### 2. Module Import Errors
**Problem**: `ModuleNotFoundError: No module named 'fastapi'`

**Solutions**:
- Ensure virtual environment is activated
- Install requirements again: `pip install -r requirements.txt`
- Check Python version compatibility

#### 3. Port Already in Use
**Problem**: `Address already in use: ('0.0.0.0', 8000)`

**Solutions**:
- Find process using port 8000: `netstat -ano | findstr :8000`
- Kill the process: `taskkill /PID <process_id> /F`
- Or change port: `uvicorn main:app --port 8001`

#### 4. Frontend Build Errors
**Problem**: `npm ERR!` during `npm install`

**Solutions**:
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and package-lock.json
- Run: `npm install` again

#### 5. CORS Errors
**Problem**: `Access to fetch at 'http://localhost:8000/api/sager' from origin 'http://localhost:5173'`

**Solutions**:
- Check `.env` file for `ALLOWED_ORIGINS`
- Verify backend server is running
- Ensure frontend URL is included in allowed origins

### Getting Help

#### Debug Information Collection
If you encounter issues, please provide:

1. **System Information**:
   ```bash
   python --version
   node --version
   npm --version
   git --version
   ```

2. **Error Messages**: Full error output from terminal

3. **Configuration**:
   - Database connection string (with credentials masked)
   - Operating system and version

4. **Steps Taken**: What you did and where it failed

#### Support Channels
- **Documentation**: Check this README and API documentation
- **Issues**: Create GitHub issue with detailed information
- **Community**: Check for existing issues and discussions

## 🔄 Next Steps

After successful installation:

1. **Explore the Application**: Navigate through different dashboards
2. **Configure Your Data**: Ensure database contains the correct data structure
3. **Customize Settings**: Adjust environment variables as needed
4. **Read the API Documentation**: Understand available endpoints
5. **Review the Code**: Familiarize yourself with the project structure

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Vite Documentation](https://vitejs.dev/)

---

**Installation Complete! 🎉**

If you've followed all steps successfully, GIDAS Explorer should now be running on your local machine. The backend API will be available at `http://localhost:8000` and the frontend at `http://localhost:5173`.