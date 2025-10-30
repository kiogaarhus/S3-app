# Database Migrations

This directory contains SQL migration scripts for the GIDAS Explorer database.

## Migration Files

| File | Description | Status |
|------|-------------|--------|
| `001_add_dashboard_indexes.sql` | Adds performance indexes for dashboard endpoints | Pending |

## Running Migrations

### Using SQL Server Management Studio (SSMS)

1. Connect to the database: `Envidan_Gidas_SpvPlanDyn_Test`
2. Open the migration script in SSMS
3. Execute the script (F5)
4. Verify indexes were created:
   ```sql
   SELECT
       OBJECT_NAME(object_id) AS TableName,
       name AS IndexName,
       type_desc AS IndexType
   FROM sys.indexes
   WHERE OBJECT_NAME(object_id) IN ('AMOProjekt', 'AMOHændelser', 'AMOSagsbehandling', 'AMOimport')
   ORDER BY TableName, IndexName;
   ```

### Using sqlcmd (Command Line)

```bash
sqlcmd -S srvsql29 -d Envidan_Gidas_SpvPlanDyn_Test -E -i 001_add_dashboard_indexes.sql
```

## Index Strategy

### AMOProjekt
- `idx_amoprojekt_status` - Optimizes filtering by project status (e.g., "aktiv")
- `idx_amoprojekt_projekttype` - Speeds up joins with AMOProjekttype

### AMOHændelser (Events)
- `idx_amohaendelser_dato_desc` - Optimizes recent activity queries (descending date order)
- `idx_amohaendelser_type` - Speeds up joins with AMOHændelsestyper

### AMOSagsbehandling (Case Treatment)
- `idx_amosagsbehandling_status` - Optimizes counting pending cases
- `idx_amosagsbehandling_oprettet_desc` - Optimizes recent activity queries

### AMOimport (Import History)
- `idx_amoimport_dato_desc` - Optimizes recent imports query and recent activity

## Performance Impact

Expected query performance improvements:
- `/api/dashboard/stats`: ~60-80% faster (from ~500ms to ~100-200ms)
- `/api/dashboard/recent-activity`: ~70-90% faster (from ~800ms to ~100-200ms)

Actual performance will depend on table sizes and data distribution.

## Rollback

To remove all dashboard indexes:

```sql
-- AMOProjekt indexes
DROP INDEX IF EXISTS idx_amoprojekt_status ON dbo.AMOProjekt;
DROP INDEX IF EXISTS idx_amoprojekt_projekttype ON dbo.AMOProjekt;

-- AMOHændelser indexes
DROP INDEX IF EXISTS idx_amohaendelser_dato_desc ON dbo.AMOHændelser;
DROP INDEX IF EXISTS idx_amohaendelser_type ON dbo.AMOHændelser;

-- AMOSagsbehandling indexes
DROP INDEX IF EXISTS idx_amosagsbehandling_status ON dbo.AMOSagsbehandling;
DROP INDEX IF EXISTS idx_amosagsbehandling_oprettet_desc ON dbo.AMOSagsbehandling;

-- AMOimport indexes
DROP INDEX IF EXISTS idx_amoimport_dato_desc ON dbo.AMOimport;
```

## Best Practices

1. **Always test migrations** in a development environment first
2. **Schedule migrations** during low-traffic periods if possible
3. **Monitor index usage** with SQL Server DMVs:
   ```sql
   SELECT
       OBJECT_NAME(s.object_id) AS TableName,
       i.name AS IndexName,
       s.user_seeks,
       s.user_scans,
       s.user_lookups,
       s.user_updates
   FROM sys.dm_db_index_usage_stats s
   INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
   WHERE database_id = DB_ID()
     AND OBJECT_NAME(s.object_id) LIKE 'AMO%'
   ORDER BY TableName, IndexName;
   ```
4. **Rebuild indexes regularly** as part of maintenance:
   ```sql
   ALTER INDEX ALL ON dbo.AMOProjekt REBUILD;
   ALTER INDEX ALL ON dbo.AMOHændelser REBUILD;
   ALTER INDEX ALL ON dbo.AMOSagsbehandling REBUILD;
   ALTER INDEX ALL ON dbo.AMOimport REBUILD;
   ```
