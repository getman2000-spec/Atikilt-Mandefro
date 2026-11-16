/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Immutable Platform & Tenant Audit Log Ledger with search, sorting, pagination, and CSV export
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saasStorage } from '../../services/storage';
import { AuditLog } from '../../types/saas';
import { downloadCsvFile } from '../../utils/formatters';
import { PageHeader, DataTable, StatusBadge, DataTableColumn } from '../ui';

export const AuditLogViewer: React.FC = () => {
  const { language } = useAuth();
  const logs = useMemo<AuditLog[]>(() => saasStorage.getAuditLogs(), [language]);
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  const filteredByModule = useMemo(() => {
    if (moduleFilter === 'all') return logs;
    return logs.filter((l) => l.module === moduleFilter);
  }, [logs, moduleFilter]);

  const handleExportCSV = () => {
    downloadCsvFile(
      `SEAM_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Timestamp', 'Action', 'Module', 'Target ID', 'Property', 'Actor Email', 'Actor Role', 'Description'],
      filteredByModule.map((l) => [
        l.timestamp,
        l.action,
        l.module,
        l.targetId,
        l.hotelName || 'Platform Global',
        l.actor.email,
        l.actor.role,
        l.description,
      ])
    );
  };

  const columns: DataTableColumn<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp (UTC)',
      sortable: true,
      sortValue: (l) => l.timestamp,
      render: (l) => (
        <span className="font-mono text-[11px] text-[#78837D] dark:text-[#92A199] whitespace-nowrap">
          {l.timestamp.replace('T', ' ').slice(0, 19)}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Event Action',
      sortable: true,
      sortValue: (l) => l.action,
      render: (l) => (
        <span className="font-mono text-[11px] font-semibold text-[#202B27] dark:text-[#ECF1EE]">
          {l.action}
        </span>
      ),
    },
    {
      key: 'module',
      header: 'Module',
      sortable: true,
      sortValue: (l) => l.module,
      render: (l) => <StatusBadge label={l.module} tone="forest" showIcon={false} />,
    },
    {
      key: 'hotelName',
      header: 'Property Scope',
      sortable: true,
      sortValue: (l) => l.hotelName || 'Platform Global',
      render: (l) => (
        <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
          {l.hotelName || 'Platform Global'}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (l) => (
        <div>
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{l.actor.fullName}</div>
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
            {l.actor.email} · {l.actor.role}
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Details',
      render: (l) => (
        <span className="text-[#78837D] dark:text-[#92A199] line-clamp-2 max-w-xs block">
          {l.description}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Platform Administration', 'Security Audit Trail']}
        title="Security & Audit Ledger"
        subtitle="Immutable, append-only chronological record of administrative, tenant, and financial events."
      />

      <DataTable
        data={filteredByModule}
        columns={columns}
        keyExtractor={(l) => l.id}
        searchPlaceholder="Search action, actor email, or property..."
        searchFilter={(l, q) =>
          l.action.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.actor.email.toLowerCase().includes(q) ||
          (l.hotelName ? l.hotelName.toLowerCase().includes(q) : false)
        }
        filterToolbar={
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            aria-label="Filter by module"
            className="px-3 py-1.5 text-xs seam-input"
          >
            <option value="all">All Modules ({logs.length})</option>
            <option value="hotels">Hotels</option>
            <option value="subscriptions">Subscriptions</option>
            <option value="users">User Accounts</option>
            <option value="settings">Settings</option>
            <option value="finance">Finance</option>
            <option value="security">Security &amp; Auth</option>
          </select>
        }
        onExportCsv={handleExportCSV}
        exportLabel="Export Audit CSV"
        pageSize={15}
      />
    </div>
  );
};
