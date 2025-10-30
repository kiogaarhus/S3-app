-- Migration: Add indexes for dashboard query optimization
-- Purpose: Optimize /api/dashboard/stats and /api/dashboard/recent-activity endpoints
-- Date: 2025-10-02

-- =====================================================
-- Indexes for AMOProjekt table
-- =====================================================

-- Index for counting active projects (used in stats endpoint)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_amoprojekt_status' AND object_id = OBJECT_ID('dbo.AMOProjekt'))
BEGIN
    CREATE INDEX idx_amoprojekt_status ON dbo.AMOProjekt(Status)
    INCLUDE (ID);
END;
GO

-- Index for project type foreign key lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_amoprojekt_projekttype' AND object_id = OBJECT_ID('dbo.AMOProjekt'))
BEGIN
    CREATE INDEX idx_amoprojekt_projekttype ON dbo.AMOProjekt(ProjekttypeID);
END;
GO

-- =====================================================
-- Indexes for AMOHændelser table (events)
-- =====================================================

-- Composite index for recent activity query - sorted by date descending
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_amohaendelser_dato_desc' AND object_id = OBJECT_ID('dbo.AMOHændelser'))
BEGIN
    CREATE INDEX idx_amohaendelser_dato_desc ON dbo.AMOHændelser(Dato DESC)
    INCLUDE (Id, TypeID, Beskrivelse, ProjektID);
END;
GO

-- Index for event type foreign key
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_amohaendelser_type' AND object_id = OBJECT_ID('dbo.AMOHændelser'))
BEGIN
    CREATE INDEX idx_amohaendelser_type ON dbo.AMOHændelser(TypeID);
END;
GO

-- =====================================================
-- Indexes for AMOSagsbehandling table (case treatment)
-- =====================================================

-- Index for counting pending cases
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_amosagsbehandling_status' AND object_id = OBJECT_ID('dbo.AMOSagsbehandling'))
BEGIN
    CREATE INDEX idx_amosagsbehandling_status ON dbo.AMOSagsbehandling(Status)
    INCLUDE (ID, OprettetDato);
END;
GO

-- Composite index for recent activity query - sorted by created date descending
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_amosagsbehandling_oprettet_desc' AND object_id = OBJECT_ID('dbo.AMOSagsbehandling'))
BEGIN
    CREATE INDEX idx_amosagsbehandling_oprettet_desc ON dbo.AMOSagsbehandling(OprettetDato DESC)
    INCLUDE (ID, SagID, Status, Beskrivelse);
END;
GO

-- =====================================================
-- Indexes for AMOimport table (import history)
-- =====================================================

-- Composite index for recent imports (last 30 days) and recent activity
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_amoimport_dato_desc' AND object_id = OBJECT_ID('dbo.AMOimport'))
BEGIN
    CREATE INDEX idx_amoimport_dato_desc ON dbo.AMOimport(ImportDato DESC)
    INCLUDE (ID, Status, AntalRækker, Kilde);
END;
GO

-- =====================================================
-- Statistics update for better query plans
-- =====================================================

-- Update statistics for optimized tables
UPDATE STATISTICS dbo.AMOProjekt;
UPDATE STATISTICS dbo.AMOHændelser;
UPDATE STATISTICS dbo.AMOSagsbehandling;
UPDATE STATISTICS dbo.AMOimport;
UPDATE STATISTICS dbo.AMOProjekttype;
GO

PRINT 'Dashboard optimization indexes created successfully';
