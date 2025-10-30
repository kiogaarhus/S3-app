# GIDAS Explorer

Full-stack web application for managing and analyzing environmental case data from GIDAS database system.

## 🏗️ Architecture

**Technology Stack:**
- **Backend**: FastAPI with SQLAlchemy ORM
- **Frontend**: React with TypeScript
- **Database**: Microsoft SQL Server
- **State Management**: React Query (TanStack Query)
- **UI Components**: Custom UI component library
- **Build Tools**: Vite (frontend), Python pip (backend)

## 📋 Features

### 📊 Dashboard System
- **Separering Dashboard**: Specialized UI for separation cases
- **Åben Land Dashboard**: Environmental case management
- **Dispensationssag Dashboard**: Dispensation case tracking
- **Nedsivningstilladelse Dashboard**: Permits and authorizations
- **Analytics Page**: Comprehensive reporting and visualizations

### 📋 Case Management (Sagsbehandling)
- **Advanced Filtering**: Filter by project type, project name, status, dates
- **Full CRUD Operations**: Create, read, update, delete cases
- **Export Functionality**: CSV and Excel export with filter preservation
- **Search**: Full-text search across case fields
- **Status Workflow**: Active → Færdigmeldt → Closed

### 🔍 Case Details
- **Comprehensive Views**: Complete case information display
- **Registration Tracking**: Dynamic field registration (BBR status, etc.)
- **Timeline View**: Activity history and event tracking
- **Document Management**: PDF generation and export

### 📈 Analytics & Reporting
- **Real-time Statistics**: KPI tracking across all project types
- **Trend Analysis**: Monthly trends and growth metrics
- **Project Distribution**: Visual breakdown by project types
- **Export Reports**: Excel and CSV report generation

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Microsoft SQL Server
- Git

### Installation

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd gidas_explorer
   ```

2. **Backend Setup**
   ```bash
   # Create virtual environment
   python -m venv venv

   # Activate (Windows)
   venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Configuration**
   ```bash
   # Create .env file with your database credentials
   # See example in Installation section
   ```

5. **Run Application**
   ```bash
   # Start backend (Terminal 1)
   cd backend
   uvicorn main:app --reload --port 8000

   # Start frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

## 📁 Project Structure

```
gidas_explorer/
├── backend/                    # FastAPI backend
│   ├── api/                   # API endpoints
│   │   ├── sager.py           # Case management API
│   │   ├── separering.py      # Separation dashboard
│   │   ├── aabenland.py       # Åben Land dashboard
│   │   ├── dispensationssag.py # Dispensation cases
│   │   ├── nedsivningstilladelse.py # Permits
│   │   ├── reports.py         # Analytics API
│   │   └── forecasts.py       # Forecasting
│   ├── models/               # SQLAlchemy ORM models
│   │   └── amo.py            # AMO database models
│   ├── schemas/              # Pydantic response schemas
│   ├── database/             # Database session management
│   └── main.py               # FastAPI application entry
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── pages/           # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── SepareringDashboard.tsx
│   │   │   ├── AabenlandDashboard.tsx
│   │   │   ├── DispensationssagDashboard.tsx
│   │   │   ├── NedsivningstilladelseDashboard.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   └── Sager/        # Case management
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── types/            # TypeScript type definitions
│   │   └── utils/            # Utility functions
│   ├── package.json
│   └── vite.config.ts
├── .gitignore               # Git ignore rules
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## 🔧 Configuration

### Environment Variables (.env)

```bash
# Database Configuration
DATABASE_URL=sqlalchemy+pyodbc://username:password@server/database

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Frontend Configuration
VITE_API_URL=http://localhost:8000
VITE_APP_TITLE=GIDAS Explorer
```

### Database Connection

Ensure your database connection string follows this format:
```
sqlalchemy+pyodbc://username:password@server_name/database_name?driver=ODBC+Driver+17+for+SQL+Server
```

## 📊 API Endpoints

### Case Management
- `GET /api/sager` - List cases with filtering and pagination
- `GET /api/sager/{id}` - Get case details
- `POST /api/sager` - Create new case
- `PUT /api/sager/{id}` - Update case
- `GET /api/sager/export/csv` - Export cases to CSV
- `GET /api/sager/export/excel` - Export cases to Excel

### Dashboards
- `GET /api/dashboard/separering/stats` - Separation statistics
- `GET /api/dashboard/aabenland/stats` - Åben Land statistics
- `GET /api/dashboard/dispensationssag/stats` - Dispensation statistics
- `GET /api/dashboard/nedsivningstilladelse/stats` - Permit statistics

### Analytics
- `GET /api/reports/monthly` - Monthly overview
- `GET /api/reports/projekttyper` - Project type distribution
- `GET /api/reports/export/excel` - Export reports to Excel

## 🎨 UI Components

The application uses a custom UI component library with:
- **Cards**: Structured content containers
- **Buttons**: Various button styles and states
- **Badges**: Status indicators and labels
- **Tables**: Sortable, paginated data tables
- **Forms**: Input validation and form handling
- **Charts**: Data visualization components

## 🔒 Security

- **Authentication**: Session-based authentication system
- **Authorization**: Role-based access control
- **Data Validation**: Comprehensive input validation
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Cross-origin resource sharing setup

## 🧪 Development

### Code Quality
```bash
# Backend code formatting
black backend/
isort backend/
flake8 backend/

# Frontend code formatting
cd frontend
npm run lint
npm run format
```

### Testing
```bash
# Backend tests
pytest backend/

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Production Build
```bash
# Frontend build
cd frontend
npm run build

# Backend deployment
# Use WSGI server like Gunicorn
gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Environment Setup
- Use environment variables for all configuration
- Ensure proper database connection pooling
- Configure reverse proxy (nginx/Apache) for production
- Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

[Add your license information here]

## 📞 Support

For technical support and questions:
- Create an issue in the repository
- Contact the development team