/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hotel Financial Rules, Approval Limits, Chart of Accounts & Custom Fields
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { HotelFinancialRules, CustomField, CustomFieldType } from '../../types/saas';
import { PageHeader, DataTable, DataTableColumn, StatusBadge, Modal, VerificationNotice } from '../ui';
import { TAX_AND_PAYROLL_CONFIG } from '../../config/taxAndPayrollConfig';
import { formatCurrency } from '../../utils/formatters';
import {
  ShieldAlert,
  Save,
  Clock,
  FileText,
  Plus,
  Trash2,
  Settings,
} from 'lucide-react';

export const FinancialApprovalConfig: React.FC = () => {
  const { activeHotel, user } = useAuth();
  const { toast, confirmAction } = useToast();

  const [activeTab, setActiveTab] = useState<'approvals' | 'accounts' | 'deadlines' | 'custom_fields'>('approvals');

  const [rules, setRules] = useState<HotelFinancialRules | null>(() =>
    activeHotel ? saasStorage.getFinancialRules(activeHotel.id) : null
  );
  const [customFields, setCustomFields] = useState<CustomField[]>(() =>
    activeHotel ? saasStorage.getCustomFields(activeHotel.id) : []
  );

  useEffect(() => {
    if (!activeHotel) return;
    setRules(saasStorage.getFinancialRules(activeHotel.id));
    setCustomFields(saasStorage.getCustomFields(activeHotel.id));
  }, [activeHotel?.id]);

  // Modals
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    code: '',
    name: '',
    category: 'Expense' as 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense',
  });

  const [isAddCustomFieldOpen, setIsAddCustomFieldOpen] = useState(false);
  const [newCustomField, setNewCustomField] = useState({
    module: 'front_office' as CustomField['module'],
    fieldName: '',
    fieldLabel: '',
    fieldType: 'text' as CustomFieldType,
    optionsRaw: '',
    isRequired: false,
  });

  if (!activeHotel || !rules) return null;

  const actor = {
    email: user?.email || 'admin@hotel.com',
    fullName: user?.fullName || 'Hotel Admin',
    role: user?.role || 'hotel_admin',
  };

  const handleSaveRules = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saasStorage.saveFinancialRules(rules, actor);
    toast('Governance configuration saved', {
      description: 'Approval limits, GL mappings, and shift deadlines updated.',
      variant: 'success',
    });
  };

  const handleAddAccountCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.code.trim() || !newAccount.name.trim()) return;

    const updatedCodes = [
      ...rules.accountCodes,
      { code: newAccount.code.trim(), name: newAccount.name.trim(), category: newAccount.category },
    ];
    const updatedRules = { ...rules, accountCodes: updatedCodes };
    setRules(updatedRules);
    saasStorage.saveFinancialRules(updatedRules, actor);

    toast('GL account code added', {
      description: `${newAccount.code.trim()} — ${newAccount.name.trim()}`,
      variant: 'success',
    });
    setIsAddAccountOpen(false);
    setNewAccount({ code: '', name: '', category: 'Expense' });
  };

  const handleRemoveAccountCode = (code: string, name: string) => {
    confirmAction({
      title: `Remove GL Code ${code}?`,
      description: `Removing "${name}" detaches it from future departmental requisitions.`,
      confirmLabel: 'Remove Code',
      tone: 'danger',
      onConfirm: () => {
        const updatedCodes = rules.accountCodes.filter((c) => c.code !== code);
        const updatedRules = { ...rules, accountCodes: updatedCodes };
        setRules(updatedRules);
        saasStorage.saveFinancialRules(updatedRules, actor);
        toast('Account code removed', { variant: 'warning' });
      },
    });
  };

  const handleSaveCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomField.fieldLabel.trim()) return;

    const generatedName =
      newCustomField.fieldName.trim() || newCustomField.fieldLabel.trim().toLowerCase().replace(/\s+/g, '_');
    const options =
      newCustomField.fieldType === 'dropdown'
        ? newCustomField.optionsRaw
            .split(',')
            .map((o) => o.trim())
            .filter((o) => o.length > 0)
        : undefined;

    const field: CustomField = {
      id: `cf_${activeHotel.id}_${Math.random().toString(36).substring(2, 7)}`,
      hotelId: activeHotel.id,
      module: newCustomField.module,
      fieldName: generatedName,
      fieldLabel: newCustomField.fieldLabel.trim(),
      fieldType: newCustomField.fieldType,
      options,
      isRequired: newCustomField.isRequired,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    saasStorage.saveCustomField(field, actor);
    setCustomFields(saasStorage.getCustomFields(activeHotel.id));
    toast('Custom metadata field created', {
      description: `${field.fieldLabel} attached to ${field.module.replace(/_/g, ' ')}.`,
      variant: 'success',
    });
    setIsAddCustomFieldOpen(false);
    setNewCustomField({
      module: 'front_office',
      fieldName: '',
      fieldLabel: '',
      fieldType: 'text',
      optionsRaw: '',
      isRequired: false,
    });
  };

  const handleToggleCustomField = (cf: CustomField) => {
    const updated = { ...cf, isActive: !cf.isActive };
    saasStorage.saveCustomField(updated, actor);
    setCustomFields(saasStorage.getCustomFields(activeHotel.id));
    toast(updated.isActive ? 'Field activated' : 'Field deactivated', { variant: 'info' });
  };

  type AccountCodeRow = HotelFinancialRules['accountCodes'][number];
  const accountColumns: DataTableColumn<AccountCodeRow>[] = [
    {
      key: 'code',
      header: 'GL Code',
      sortable: true,
      sortValue: (a) => a.code,
      render: (a) => <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">{a.code}</span>,
    },
    {
      key: 'name',
      header: 'Account Title',
      sortable: true,
      sortValue: (a) => a.name,
      render: (a) => <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{a.name}</span>,
    },
    {
      key: 'category',
      header: 'Classification',
      sortable: true,
      sortValue: (a) => a.category,
      render: (a) => (
        <StatusBadge
          label={a.category}
          tone={
            a.category === 'Revenue'
              ? 'success'
              : a.category === 'Expense'
              ? 'warning'
              : a.category === 'Asset'
              ? 'forest'
              : 'neutral'
          }
          showIcon={false}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (a) => (
        <button
          type="button"
          onClick={() => handleRemoveAccountCode(a.code, a.name)}
          className="p-1.5 rounded-md text-[#78837D] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          title="Delete GL code"
          aria-label={`Delete ${a.code}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  const customFieldColumns: DataTableColumn<CustomField>[] = [
    {
      key: 'fieldLabel',
      header: 'Field Label',
      sortable: true,
      sortValue: (cf) => cf.fieldLabel,
      render: (cf) => <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{cf.fieldLabel}</span>,
    },
    {
      key: 'fieldName',
      header: 'Key',
      render: (cf) => <span className="font-mono text-[#78837D]">{cf.fieldName}</span>,
    },
    {
      key: 'module',
      header: 'Target Module',
      sortable: true,
      sortValue: (cf) => cf.module,
      render: (cf) => (
        <span className="capitalize font-medium text-[#173F35] dark:text-[#C6A15B]">
          {cf.module.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'fieldType',
      header: 'Input Type',
      render: (cf) => (
        <span className="px-2 py-0.5 rounded bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] font-mono text-[10px] uppercase">
          {cf.fieldType}
        </span>
      ),
    },
    {
      key: 'isRequired',
      header: 'Validation',
      render: (cf) => <span className="text-[#78837D]">{cf.isRequired ? 'Mandatory' : 'Optional'}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (cf) => (
        <StatusBadge label={cf.isActive ? 'Active' : 'Inactive'} tone={cf.isActive ? 'success' : 'neutral'} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (cf) => (
        <button
          type="button"
          onClick={() => handleToggleCustomField(cf)}
          className="text-xs font-medium text-[#173F35] dark:text-[#C6A15B] hover:underline"
        >
          {cf.isActive ? 'Deactivate' : 'Activate'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Property Configuration', 'Financial Controls']}
        title="Financial Rules & Governance Limits"
        subtitle="Configure approval authority tiers, Chart of Accounts codes, night closing deadlines, and custom property fields."
        actions={
          <button
            type="button"
            onClick={() => handleSaveRules()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white font-semibold text-xs whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>Save All Configurations</span>
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-[#E6EBE7] dark:border-[#22322C] gap-6 overflow-x-auto">
        {(
          [
            { id: 'approvals', label: 'Approval Authority Limits', icon: ShieldAlert },
            { id: 'accounts', label: `Chart of Accounts (${rules.accountCodes.length})`, icon: FileText },
            { id: 'deadlines', label: 'Closing & Reporting Deadlines', icon: Clock },
            { id: 'custom_fields', label: `Custom Property Fields (${customFields.length})`, icon: Settings },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-xs font-semibold transition-colors border-b-2 shrink-0 flex items-center gap-2 ${
                active
                  ? 'border-[#173F35] dark:border-[#C6A15B] text-[#173F35] dark:text-[#C6A15B]'
                  : 'border-transparent text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: APPROVAL LIMITS */}
      {activeTab === 'approvals' && (
        <div className="space-y-5">
          <VerificationNotice />
          <div className="p-4 rounded-[10px] bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs space-y-1">
            <div>
              <strong>Segregation of Duties:</strong> Any expense or purchase requisition exceeding an approver&apos;s limit escalates automatically to the next tier. Expenditures above the General Manager threshold require Owner / Board sanction.
            </div>
            <div className="text-[11px] opacity-90">
              All limits are standardized in <strong>ETB</strong>. Legacy USD baseline thresholds ($250 / $2,500 / $10,000) convert to {formatCurrency(TAX_AND_PAYROLL_CONFIG.convertedLegacyUsdApprovalLimitsEtb.deptHeadLimit, 'ETB')} / {formatCurrency(TAX_AND_PAYROLL_CONFIG.convertedLegacyUsdApprovalLimitsEtb.financeManagerLimit, 'ETB')} / {formatCurrency(TAX_AND_PAYROLL_CONFIG.convertedLegacyUsdApprovalLimitsEtb.gmLimit, 'ETB')} ({TAX_AND_PAYROLL_CONFIG.usdToEtbRateNote}).
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Dept Head */}
            <div className="p-5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#78837D] uppercase tracking-wider">Tier 1 Limit</span>
                <StatusBadge label="Department Head" tone="forest" showIcon={false} />
              </div>
              <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Routine Departmental Requisitions
              </h2>
              <p className="text-xs text-[#78837D] leading-relaxed">
                Authorized for daily linen replenishment, kitchen perishables, and routine operational supplies.
              </p>

              <div className="pt-1">
                <label className="text-[11px] font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                  Maximum Single Approval ({rules.currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono font-semibold text-[#78837D] text-xs">
                    {rules.currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={rules.approvalLimits.deptHeadLimit}
                    onChange={(e) =>
                      setRules({
                        ...rules,
                        approvalLimits: {
                          ...rules.approvalLimits,
                          deptHeadLimit: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full pl-9 pr-3 py-2 seam-input font-mono font-semibold text-sm tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* Finance Manager */}
            <div className="p-5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#78837D] uppercase tracking-wider">Tier 2 Limit</span>
                <StatusBadge label="Finance Manager" tone="warning" showIcon={false} />
              </div>
              <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Vendor Settlements &amp; Invoices
              </h2>
              <p className="text-xs text-[#78837D] leading-relaxed">
                Authorized for bulk F&amp;B procurement, utility settlements, and recurring vendor service contracts.
              </p>

              <div className="pt-1">
                <label className="text-[11px] font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                  Maximum Single Approval ({rules.currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono font-semibold text-[#78837D] text-xs">
                    {rules.currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={rules.approvalLimits.financeManagerLimit}
                    onChange={(e) =>
                      setRules({
                        ...rules,
                        approvalLimits: {
                          ...rules.approvalLimits,
                          financeManagerLimit: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full pl-9 pr-3 py-2 seam-input font-mono font-semibold text-sm tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* General Manager */}
            <div className="p-5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#78837D] uppercase tracking-wider">Tier 3 Limit</span>
                <StatusBadge label="General Manager" tone="success" showIcon={false} />
              </div>
              <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Major Capex &amp; Property Contracts
              </h2>
              <p className="text-xs text-[#78837D] leading-relaxed">
                Authorized for capital expenditures, plant equipment overhauls, and major property upgrades.
              </p>

              <div className="pt-1">
                <label className="text-[11px] font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                  Maximum Single Approval ({rules.currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono font-semibold text-[#78837D] text-xs">
                    {rules.currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="25000"
                    value={rules.approvalLimits.gmLimit}
                    onChange={(e) =>
                      setRules({
                        ...rules,
                        approvalLimits: {
                          ...rules.approvalLimits,
                          gmLimit: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full pl-9 pr-3 py-2 seam-input font-mono font-semibold text-sm tabular-nums"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHART OF ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[#78837D]">
              General ledger accounts mapped to departmental revenue streams and operational expenses.
            </p>
            <button
              type="button"
              onClick={() => setIsAddAccountOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white font-semibold text-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Add Account Code</span>
            </button>
          </div>

          <DataTable
            data={rules.accountCodes}
            columns={accountColumns}
            keyExtractor={(a) => a.code}
            searchPlaceholder="Search GL code or account title..."
            searchFilter={(a, q) =>
              a.code.toLowerCase().includes(q) ||
              a.name.toLowerCase().includes(q) ||
              a.category.toLowerCase().includes(q)
            }
          />
        </div>
      )}

      {/* TAB 3: DAILY REPORTING DEADLINES */}
      {activeTab === 'deadlines' && (
        <div className="max-w-xl">
          <div className="p-5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] space-y-4 text-xs">
            <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B]" />
              <span>Departmental Night Audit &amp; Daily Shift Deadlines</span>
            </h2>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Daily Night Shift Closing Time
              </label>
              <input
                type="time"
                value={rules.reportingDeadlines.dailyClosingTime}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    reportingDeadlines: {
                      ...rules.reportingDeadlines,
                      dailyClosingTime: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 seam-input font-mono text-sm"
              />
              <span className="text-[11px] text-[#78837D] mt-1 block">
                Front Office and Outlet Cashiers must balance their shifts and submit daily reports before this hour.
              </span>
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Late Notification Grace Period (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={rules.reportingDeadlines.lateNotificationGraceMinutes}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    reportingDeadlines: {
                      ...rules.reportingDeadlines,
                      lateNotificationGraceMinutes: parseInt(e.target.value, 10) || 30,
                    },
                  })
                }
                className="w-full px-3 py-2 seam-input font-mono tabular-nums"
              />
            </div>

            <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.reportingDeadlines.notifyGMOnMissing}
                  onChange={(e) =>
                    setRules({
                      ...rules,
                      reportingDeadlines: {
                        ...rules.reportingDeadlines,
                        notifyGMOnMissing: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-[#173F35] focus:ring-[#173F35] w-4 h-4 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block">
                    Alert General Manager on Overdue Shift Report
                  </span>
                  <span className="text-[11px] text-[#78837D]">
                    Triggers an alert when Front Office or F&amp;B shift reports miss the closing grace window.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.reportingDeadlines.notifyOwnerOnWeeklySummary}
                  onChange={(e) =>
                    setRules({
                      ...rules,
                      reportingDeadlines: {
                        ...rules.reportingDeadlines,
                        notifyOwnerOnWeeklySummary: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-[#173F35] focus:ring-[#173F35] w-4 h-4 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block">
                    Deliver Weekly Executive Digest to Hotel Owner
                  </span>
                  <span className="text-[11px] text-[#78837D]">
                    Compiles automated weekly revenue, occupancy, and cashier audit summaries.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOM HOTEL FIELDS */}
      {activeTab === 'custom_fields' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[#78837D]">
              Custom metadata fields attached to guest folios, housekeeping inspections, and front desk bookings.
            </p>
            <button
              type="button"
              onClick={() => setIsAddCustomFieldOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white font-semibold text-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Define Custom Field</span>
            </button>
          </div>

          <DataTable
            data={customFields}
            columns={customFieldColumns}
            keyExtractor={(cf) => cf.id}
            searchPlaceholder="Search custom field label or module..."
            searchFilter={(cf, q) =>
              cf.fieldLabel.toLowerCase().includes(q) ||
              cf.fieldName.toLowerCase().includes(q) ||
              cf.module.toLowerCase().includes(q)
            }
            emptyTitle="No custom property fields defined"
            emptyDescription="Create custom fields to capture flight arrival numbers, dietary preferences, or inspection notes."
          />
        </div>
      )}

      {/* MODAL: ADD ACCOUNT CODE */}
      <Modal
        open={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        title="Add Chart of Account Code"
        maxWidthClass="max-w-sm"
      >
        <form onSubmit={handleAddAccountCode} className="space-y-3.5 text-xs">
          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">GL Account Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. 1040"
              value={newAccount.code}
              onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })}
              className="w-full px-3 py-2 seam-input font-mono font-semibold"
            />
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Account Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. CBE Merchant POS Settlement"
              value={newAccount.name}
              onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Classification</label>
            <select
              value={newAccount.category}
              onChange={(e) => setNewAccount({ ...newAccount, category: e.target.value as AccountCodeRow['category'] })}
              className="w-full px-3 py-2 seam-input"
            >
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Equity">Equity</option>
              <option value="Revenue">Revenue</option>
              <option value="Expense">Expense</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsAddAccountOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white font-semibold"
            >
              Add Code
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD CUSTOM FIELD */}
      <Modal
        open={isAddCustomFieldOpen}
        onClose={() => setIsAddCustomFieldOpen(false)}
        title="Define Custom Property Field"
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleSaveCustomField} className="space-y-3.5 text-xs">
          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Target Operational Module *
            </label>
            <select
              value={newCustomField.module}
              onChange={(e) => setNewCustomField({ ...newCustomField, module: e.target.value as CustomField['module'] })}
              className="w-full px-3 py-2 seam-input"
            >
              <option value="front_office">Front Office (Guest Bookings &amp; Check-In)</option>
              <option value="housekeeping">Housekeeping (Room Inspections)</option>
              <option value="guest_profile">Guest Profiles &amp; CRM</option>
              <option value="general">General Property Operations</option>
            </select>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Field Display Label *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Flight Arrival Number"
              value={newCustomField.fieldLabel}
              onChange={(e) => setNewCustomField({ ...newCustomField, fieldLabel: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Input Data Type</label>
              <select
                value={newCustomField.fieldType}
                onChange={(e) => setNewCustomField({ ...newCustomField, fieldType: e.target.value as CustomFieldType })}
                className="w-full px-3 py-2 seam-input"
              >
                <option value="text">Text Input</option>
                <option value="number">Numeric</option>
                <option value="amount">Monetary Amount</option>
                <option value="dropdown">Dropdown Choice</option>
                <option value="date">Date Picker</option>
                <option value="boolean">Yes / No Switch</option>
                <option value="attachment">File / Attachment</option>
              </select>
            </div>

            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newCustomField.isRequired}
                  onChange={(e) => setNewCustomField({ ...newCustomField, isRequired: e.target.checked })}
                  className="rounded text-[#173F35] focus:ring-[#173F35] w-4 h-4"
                />
                <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">Mandatory Field</span>
              </label>
            </div>
          </div>

          {newCustomField.fieldType === 'dropdown' && (
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Dropdown Options (Comma separated)
              </label>
              <input
                type="text"
                placeholder="Option 1, Option 2, Option 3"
                value={newCustomField.optionsRaw}
                onChange={(e) => setNewCustomField({ ...newCustomField, optionsRaw: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsAddCustomFieldOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white font-semibold"
            >
              Create Field
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
