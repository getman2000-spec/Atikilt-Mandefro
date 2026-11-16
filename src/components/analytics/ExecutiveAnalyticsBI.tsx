/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Business Intelligence, Multi-Property Portfolio Analytics & Compliance Export Vault
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  PieChart,
  Download,
  Building2,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import {
  Hotel,
  PortfolioMetric,
  ChannelDistribution,
  ExportJob,
  ExportReportType,
  KPITargetItem,
} from '../../types/saas';
import { CurrentUser } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import {
  PageHeader,
  KpiCard,
  StatusBadge,
  DataTable,
  EmptyState,
  SampleDataBadge,
  VerificationNotice,
  type DataTableColumn,
  type StatusTone,
} from '../ui';
import { formatCurrency, downloadCsvFile } from '../../utils/formatters';

interface ExecutiveAnalyticsBIProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

export const ExecutiveAnalyticsBI: React.FC<ExecutiveAnalyticsBIProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'channels' | 'kpi' | 'exports'>(
    'portfolio'
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const currency = activeHotel?.operationalSettings?.currency || 'ETB';
  const currencySymbol = activeHotel?.operationalSettings?.currencySymbol;
  const hotelId = activeHotel?.id || '';

  const portfolioMetrics: PortfolioMetric[] = useMemo(() => {
    return saasStorage.getPortfolioMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const channelDistributions: ChannelDistribution[] = useMemo(() => {
    if (!hotelId) return [];
    return saasStorage.getChannelDistribution(hotelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, refreshKey]);

  const kpiTargets: KPITargetItem[] = useMemo(() => {
    if (!hotelId) return [];
    return saasStorage.getKPITargets(hotelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, refreshKey]);

  const exportJobs: ExportJob[] = useMemo(() => {
    if (!hotelId) return [];
    return saasStorage.getExportJobs(hotelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, refreshKey]);

  const latestReport = useMemo(() => {
    if (!hotelId) return undefined;
    return saasStorage.getDailyRevenueReports(hotelId)[0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, refreshKey]);

  const [exportType, setExportType] = useState<ExportReportType>('daily_revenue_flash');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'excel'>('csv');

  const groupTotals = useMemo(() => {
    let totalRooms = 0;
    let totalOccupied = 0;
    let totalGrossRev = 0;
    let totalNetRev = 0;
    let totalGop = 0;

    portfolioMetrics.forEach((m) => {
      totalRooms += m.totalRooms;
      totalOccupied += m.occupiedRooms;
      totalGrossRev += m.grossRevenue;
      totalNetRev += m.netRevenue;
      totalGop += m.gop;
    });

    const avgOccupancy =
      totalRooms > 0 ? Math.round((totalOccupied / totalRooms) * 1000) / 10 : 0;
    const avgAdr = totalOccupied > 0 ? Math.round((totalGrossRev * 0.65) / totalOccupied) : 0;
    const avgRevPar = totalRooms > 0 ? Math.round((totalGrossRev * 0.65) / totalRooms) : 0;
    const avgGopMargin =
      totalGrossRev > 0 ? Math.round((totalGop / totalGrossRev) * 1000) / 10 : 0;

    return {
      totalProperties: portfolioMetrics.length,
      totalRooms,
      totalOccupied,
      totalGrossRev,
      totalNetRev,
      totalGop,
      avgOccupancy,
      avgAdr,
      avgRevPar,
      avgGopMargin,
    };
  }, [portfolioMetrics]);

  const departmentalBreakdown = useMemo(() => {
    const roomsRev = latestReport?.roomsRevenue || 0;
    const foodRev = latestReport?.foodRevenue || 0;
    const bevRev = latestReport?.beverageRevenue || 0;
    const otherRev = latestReport?.otherRevenue || 0;
    const total = roomsRev + foodRev + bevRev + otherRev;

    return [
      {
        label: 'Rooms Division',
        amount: roomsRev,
        pct: total > 0 ? Math.round((roomsRev / total) * 100) : 0,
        note: 'Primary room tariff revenue',
      },
      {
        label: 'Food & Dining Outlets',
        amount: foodRev,
        pct: total > 0 ? Math.round((foodRev / total) * 100) : 0,
        note: 'Restaurant, breakfast & banquets',
      },
      {
        label: 'Beverage & Lounge',
        amount: bevRev,
        pct: total > 0 ? Math.round((bevRev / total) * 100) : 0,
        note: 'Bars, cellar & specialty coffee',
      },
      {
        label: 'Spa, Laundry & Minor',
        amount: otherRev,
        pct: total > 0 ? Math.round((otherRev / total) * 100) : 0,
        note: 'Wellness, laundry & ancillary',
      },
    ];
  }, [latestReport]);

  const handleGenerateExport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    const job = saasStorage.triggerExport(hotelId, exportType, exportFormat, {
      email: currentUser?.email || 'admin@hotel.com',
      fullName: currentUser?.fullName || 'General Manager',
      role: currentUser?.role || 'gm',
    });

    toast(`Export "${job.title}" generated`, {
      variant: 'success',
      description: 'Archived in the compliance export vault below.',
    });
    setRefreshKey((k) => k + 1);
  };

  const handleDownloadFile = (job: ExportJob) => {
    let content = '';
    let mimeType = 'text/plain';
    const filename = `${job.reportType}_${new Date().toISOString().slice(0, 10)}.${
      job.format === 'excel' ? 'csv' : job.format
    }`;

    if (job.format === 'json') {
      mimeType = 'application/json';
      content = JSON.stringify(
        {
          exportTitle: job.title,
          hotelId: job.hotelId,
          hotelName: activeHotel?.name || '',
          generatedAt: job.generatedAt,
          generatedBy: job.generatedBy,
          recordsCount: job.recordsCount,
          metrics: {
            occupancyRate: latestReport?.occupancyRate ?? groupTotals.avgOccupancy,
            grossRevenue: latestReport?.totalGrossRevenue ?? groupTotals.totalGrossRev,
            vatRate: activeHotel?.operationalSettings?.vatRate ?? 15,
            serviceChargeRate: activeHotel?.operationalSettings?.serviceChargeRate ?? 10,
          },
        },
        null,
        2
      );
    } else {
      mimeType = 'text/csv';
      content = `ID,ReportType,Hotel,GeneratedAt,RecordsCount\n"${job.id}","${job.reportType}","${
        activeHotel?.name || 'Property'
      }","${job.generatedAt}",${job.recordsCount}\n`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const portfolioColumns: DataTableColumn<PortfolioMetric>[] = [
    {
      key: 'hotel',
      header: 'Hotel Property',
      sortable: true,
      sortValue: (p) => p.hotelName,
      render: (p) => (
        <div>
          <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-2">
            <span>{p.hotelName}</span>
            {p.hotelId === hotelId && <StatusBadge tone="forest" label="Current" />}
          </div>
          <div className="text-[11px] font-mono text-[#78837D] dark:text-[#92A199]">
            {p.hotelCode}
          </div>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'Location',
      render: (p) => <span>{p.city}</span>,
    },
    {
      key: 'rooms',
      header: 'Rooms',
      align: 'center',
      render: (p) => (
        <span className="font-mono tabular-nums">
          {p.occupiedRooms}/{p.totalRooms}
        </span>
      ),
    },
    {
      key: 'occ',
      header: 'Occupancy %',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.occupancyRate,
      render: (p) => (
        <span
          className={`font-mono font-semibold tabular-nums ${
            p.occupancyRate >= 75
              ? 'text-emerald-700 dark:text-emerald-400'
              : p.occupancyRate >= 60
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-[#78837D] dark:text-[#92A199]'
          }`}
        >
          {p.occupancyRate}%
        </span>
      ),
    },
    {
      key: 'adr',
      header: 'ADR',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.adr,
      render: (p) => (
        <span className="font-mono tabular-nums">{formatCurrency(p.adr, p.currency)}</span>
      ),
    },
    {
      key: 'revpar',
      header: 'RevPAR',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.revPar,
      render: (p) => (
        <span className="font-mono font-semibold tabular-nums">
          {formatCurrency(p.revPar, p.currency)}
        </span>
      ),
    },
    {
      key: 'gross',
      header: 'Gross Revenue',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.grossRevenue,
      render: (p) => (
        <span className="font-mono font-semibold tabular-nums">
          {formatCurrency(p.grossRevenue, p.currency)}
        </span>
      ),
    },
    {
      key: 'gop',
      header: 'GOP Profit',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.gop,
      render: (p) => (
        <span className="font-mono font-semibold tabular-nums text-[#173F35] dark:text-[#C6A15B]">
          {formatCurrency(p.gop, p.currency)}
        </span>
      ),
    },
    {
      key: 'margin',
      header: 'GOP Margin',
      align: 'right',
      render: (p) => <span className="font-mono font-semibold">{p.gopMargin}%</span>,
    },
  ];

  const kpiColumns: DataTableColumn<KPITargetItem>[] = [
    {
      key: 'label',
      header: 'Performance Indicator',
      sortable: true,
      sortValue: (k) => k.label,
      render: (k) => (
        <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{k.label}</span>
      ),
    },
    {
      key: 'target',
      header: 'Target',
      align: 'right',
      render: (k) => (
        <span className="font-mono tabular-nums">
          {k.targetValue.toLocaleString()} {k.unit === '%' ? '%' : currency}
        </span>
      ),
    },
    {
      key: 'actual',
      header: 'Actual Realized',
      align: 'right',
      render: (k) => (
        <span className="font-mono font-semibold tabular-nums">
          {k.actualValue.toLocaleString()} {k.unit === '%' ? '%' : currency}
        </span>
      ),
    },
    {
      key: 'variance',
      header: 'Variance',
      align: 'right',
      sortable: true,
      sortValue: (k) => k.variance,
      render: (k) => (
        <span
          className={`font-mono font-semibold tabular-nums ${
            k.variance >= 0
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-rose-700 dark:text-rose-400'
          }`}
        >
          {k.variance > 0 ? `+${k.variance}` : k.variance} {k.unit === '%' ? '%' : ''}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Benchmark Status',
      align: 'center',
      render: (k) => {
        const tone: StatusTone =
          k.status === 'exceeded' ? 'success' : k.status === 'on_track' ? 'forest' : 'critical';
        return <StatusBadge tone={tone} label={k.status.replace(/_/g, ' ')} />;
      },
    },
  ];

  const exportColumns: DataTableColumn<ExportJob>[] = [
    {
      key: 'title',
      header: 'Report File Name',
      sortable: true,
      sortValue: (j) => j.title,
      render: (j) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B] shrink-0" />
          <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{j.title}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (j) => <span className="capitalize">{j.reportType.replace(/_/g, ' ')}</span>,
    },
    {
      key: 'format',
      header: 'Format',
      align: 'center',
      render: (j) => <StatusBadge tone="neutral" label={j.format.toUpperCase()} />,
    },
    {
      key: 'size',
      header: 'Size / Records',
      align: 'right',
      render: (j) => (
        <span className="font-mono tabular-nums">
          {Math.round(j.fileSizeBytes / 1024)} KB ({j.recordsCount} rows)
        </span>
      ),
    },
    {
      key: 'generatedBy',
      header: 'Generated By & Time',
      render: (j) => (
        <div>
          <div className="text-[#202B27] dark:text-[#ECF1EE]">{j.generatedBy}</div>
          <div className="text-[11px] font-mono text-[#78837D] dark:text-[#92A199]">
            {j.generatedAt.replace('T', ' ').slice(0, 16)}
          </div>
        </div>
      ),
    },
    {
      key: 'download',
      header: 'Download',
      align: 'right',
      render: (j) => (
        <button
          type="button"
          onClick={() => handleDownloadFile(j)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#173F35] hover:bg-[#12332B] text-white text-[11px] font-medium transition-colors"
        >
          <Download className="w-3 h-3" />
          <span>Download</span>
        </button>
      ),
    },
  ];

  if (!activeHotel) {
    return (
      <EmptyState
        title="No property selected"
        description="Select a hotel property to access Business Intelligence and Export Vault."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Executive & BI', 'Business Intelligence & Export Vault']}
        title="Executive BI, Portfolio & Compliance Analytics"
        subtitle="Multi-property portfolio benchmarks, revenue channel contribution, KPI target variance, and regulatory audit export vault."
        meta={<SampleDataBadge label="Sample data & Simulator" />}
        actions={
          <button
            type="button"
            onClick={() => setActiveTab('exports')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Generate Export</span>
          </button>
        }
      />

      <VerificationNotice />

      {/* Tabs */}
      <div className="flex border-b border-[#E6EBE7] dark:border-[#22322C] gap-1 overflow-x-auto">
        {[
          {
            id: 'portfolio',
            label: 'Multi-Property Portfolio',
            icon: Building2,
            count: portfolioMetrics.length,
          },
          { id: 'channels', label: 'Channels & Revenue Mix', icon: PieChart },
          { id: 'kpi', label: 'KPI Target Variance', icon: TrendingUp, count: kpiTargets.length },
          {
            id: 'exports',
            label: 'Compliance Export Vault',
            icon: FileSpreadsheet,
            count: exportJobs.length,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-3.5 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-[#173F35] dark:border-[#C6A15B] text-[#173F35] dark:text-[#C6A15B]'
                  : 'border-transparent text-[#78837D] hover:text-[#202B27] dark:text-[#92A199] dark:hover:text-[#ECF1EE]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D] dark:text-[#92A199] text-[10px] font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PORTFOLIO */}
      {activeTab === 'portfolio' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Group Portfolio Revenue"
              value={formatCurrency(groupTotals.totalGrossRev, currency, currencySymbol)}
              helper={`${groupTotals.totalProperties} authorized properties`}
              deltaTone="positive"
            />
            <KpiCard
              label="Weighted Occupancy"
              value={`${groupTotals.avgOccupancy}%`}
              helper={`${groupTotals.totalOccupied} of ${groupTotals.totalRooms} rooms`}
              deltaTone="forest"
            />
            <KpiCard
              label="Portfolio RevPAR"
              value={formatCurrency(groupTotals.avgRevPar, currency, currencySymbol)}
              helper={`Portfolio ADR: ${formatCurrency(groupTotals.avgAdr, currency, currencySymbol)}`}
            />
            <KpiCard
              label="Gross Operating Profit"
              value={formatCurrency(groupTotals.totalGop, currency, currencySymbol)}
              helper={`Margin: ${groupTotals.avgGopMargin}%`}
              deltaTone="positive"
            />
          </div>

          <DataTable
            data={portfolioMetrics}
            columns={portfolioColumns}
            keyExtractor={(p) => p.hotelId}
            searchPlaceholder="Search property name or city..."
            searchFilter={(p, q) =>
              p.hotelName.toLowerCase().includes(q) || p.city.toLowerCase().includes(q)
            }
            onExportCsv={() => {
              downloadCsvFile(
                `SEAM_Portfolio_Benchmark_${new Date().toISOString().slice(0, 10)}.csv`,
                ['Property', 'Code', 'City', 'Occupied', 'Total Rooms', 'Occupancy %', 'ADR', 'RevPAR', 'Gross Revenue', 'GOP', 'GOP Margin %'],
                portfolioMetrics.map((p) => [
                  p.hotelName,
                  p.hotelCode,
                  p.city,
                  p.occupiedRooms,
                  p.totalRooms,
                  p.occupancyRate,
                  p.adr,
                  p.revPar,
                  p.grossRevenue,
                  p.gop,
                  p.gopMargin,
                ])
              );
              toast('Portfolio matrix exported to CSV', { variant: 'success' });
            }}
            emptyTitle="No portfolio properties available"
          />
        </div>
      )}

      {/* TAB 2: CHANNELS & REVENUE MIX */}
      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="seam-surface p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Booking Channel Mix &amp; Share
              </h3>
              <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-0.5">
                Direct website vs OTA vs corporate contract revenue contribution.
              </p>
            </div>

            {channelDistributions.length === 0 ? (
              <EmptyState
                title="No channel data available"
                description="Channel revenue share records will appear once bookings are synchronized."
              />
            ) : (
              <div className="space-y-3 pt-1">
                {channelDistributions.map((c) => (
                  <div key={c.channel} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                        {c.channelLabel}
                      </span>
                      <span className="font-mono font-semibold text-[#173F35] dark:text-[#C6A15B]">
                        {c.percentage}% ({formatCurrency(c.revenue, currency, currencySymbol)})
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#F6F8F6] dark:bg-[#192622] rounded-full overflow-hidden border border-[#E6EBE7] dark:border-[#22322C]">
                      <div
                        className="h-full bg-[#173F35] dark:bg-[#647B52] rounded-full"
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="seam-surface p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Departmental Revenue Contribution
              </h3>
              <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-0.5">
                Calculated from the latest property flash revenue report.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {departmentalBreakdown.map((dept) => (
                <div
                  key={dept.label}
                  className="p-3.5 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C]"
                >
                  <span className="text-[11px] font-semibold text-[#173F35] dark:text-[#C6A15B] uppercase tracking-wider">
                    {dept.label} ({dept.pct}%)
                  </span>
                  <div className="text-lg font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] mt-1 tabular-nums">
                    {formatCurrency(dept.amount, currency, currencySymbol)}
                  </div>
                  <span className="text-[11px] text-[#78837D] dark:text-[#92A199]">{dept.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KPI TARGETS */}
      {activeTab === 'kpi' && (
        <DataTable
          data={kpiTargets}
          columns={kpiColumns}
          keyExtractor={(k) => k.kpiKey}
          searchPlaceholder="Search KPI..."
          searchFilter={(k, q) => k.label.toLowerCase().includes(q)}
          onExportCsv={() => {
            downloadCsvFile(
              `SEAM_KPI_Targets_${new Date().toISOString().slice(0, 10)}.csv`,
              ['Indicator', 'Target', 'Actual', 'Variance', 'Unit', 'Status'],
              kpiTargets.map((k) => [
                k.label,
                k.targetValue,
                k.actualValue,
                k.variance,
                k.unit,
                k.status,
              ])
            );
            toast('KPI variance report exported', { variant: 'success' });
          }}
          emptyTitle="No KPI targets configured"
        />
      )}

      {/* TAB 4: EXPORT VAULT */}
      {activeTab === 'exports' && (
        <div className="space-y-5">
          <div className="seam-surface p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Generate Regulatory Export or Audit Package
              </h3>
              <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-0.5">
                Download tax returns, ministry occupancy filings, or full property backups.
              </p>
            </div>

            <form
              onSubmit={handleGenerateExport}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end text-xs"
            >
              <div>
                <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                  Report Type
                </label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value as ExportReportType)}
                  className="w-full p-2 seam-input"
                >
                  <option value="daily_revenue_flash">Daily Revenue Flash Report</option>
                  <option value="vat_service_charge_tax">
                    15% VAT &amp; 10% Service Charge Tax Summary
                  </option>
                  <option value="occupancy_statistics">
                    Ministry of Tourism Occupancy Statistics
                  </option>
                  <option value="general_ledger_trial_balance">
                    General Ledger Monthly Trial Balance
                  </option>
                  <option value="employee_payroll_summary">
                    Payroll &amp; Service Charge Distribution
                  </option>
                  <option value="full_tenant_backup">
                    Complete Property Data Backup (JSON)
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                  File Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json' | 'excel')}
                  className="w-full p-2 seam-input"
                >
                  <option value="csv">CSV (Comma-Separated Values)</option>
                  <option value="excel">Microsoft Excel (.xlsx / CSV)</option>
                  <option value="json">JSON Structured Data</option>
                </select>
              </div>

              <button
                type="submit"
                className="h-9 px-4 rounded-lg bg-[#173F35] hover:bg-[#12332B] text-white font-medium text-xs inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Generate Export File</span>
              </button>
            </form>
          </div>

          <DataTable
            data={exportJobs}
            columns={exportColumns}
            keyExtractor={(j) => j.id}
            searchPlaceholder="Search export title or category..."
            searchFilter={(j, q) =>
              j.title.toLowerCase().includes(q) || j.reportType.toLowerCase().includes(q)
            }
            emptyTitle="No archived exports yet"
          />
        </div>
      )}
    </div>
  );
};
