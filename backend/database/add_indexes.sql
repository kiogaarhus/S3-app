-- Performance optimization indexes for GIDAS Explorer
-- These indexes improve dashboard query performance

-- Add indexes to AMOSagsbehandling for dashboard stats queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_sagsbehandling_ferdigmeldt' AND object_id = OBJECT_ID('dbo.AMOSagsbehandling'))
BEGIN
    CREATE INDEX idx_sagsbehandling_ferdigmeldt
    ON dbo.AMOSagsbehandling(Færdigmeldt)
    INCLUDE (AfsluttetDato, AfslutUdenFærdigmelding, FærdigmeldingDato);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_sagsbehandling_oprettet_dato' AND object_id = OBJECT_ID('dbo.AMOSagsbehandling'))
BEGIN
    CREATE INDEX idx_sagsbehandling_oprettet_dato
    ON dbo.AMOSagsbehandling(OprettetDato DESC)
    INCLUDE (Bemærkning, ProjektID);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_sagsbehandling_paabud' AND object_id = OBJECT_ID('dbo.AMOSagsbehandling'))
BEGIN
    CREATE INDEX idx_sagsbehandling_paabud
    ON dbo.AMOSagsbehandling(Påbud, Færdigmeldt);
END
GO

-- Add indexes to AMOHændelser for recent activity queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_haendelser_dato' AND object_id = OBJECT_ID('dbo.AMOHændelser'))
BEGIN
    CREATE INDEX idx_haendelser_dato
    ON dbo.AMOHændelser(Dato DESC)
    WHERE Dato IS NOT NULL
    INCLUDE (Bemærkning, SagsID, TypeID);
END
GO

PRINT 'Performance indexes created successfully';
