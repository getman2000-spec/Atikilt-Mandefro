/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hotel Department Setup & Configuration
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { Department } from '../../types/saas';
import { PageHeader, KpiCard, DataTable, DataTableColumn, StatusBadge, Modal } from '../ui';
import { formatCurrency, downloadCsvFile } from '../../utils/formatters';
import {
  Layers,
  PlusCircle,
  CheckCircle2,
  Edit2,
  Clock,
  DollarSign,
  User,
} from 'lucide-react';

export const DepartmentManagement: React.FC = () => {
  const { activeHotel, user, language } = useAuth();
  const isAm = language === 'am';
  const { toast } = useToast();

  const [departments, setDepartments] = useState<Department[]>(() =>
    activeHotel ? saasStorage.getDepartments(activeHotel.id) : []
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [form, setForm] = useState({
    code: '',
    name: '',
    nameAm: '',
    description: '',
    operatingBudget: 100000,
    headOfDepartmentName: '',
    reportingDeadlineHour: 23,
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (activeHotel) {
      setDepartments(saasStorage.getDepartments(activeHotel.id));
    }
  }, [activeHotel?.id]);

  const filteredDepts = useMemo(() => {
    if (statusFilter === 'all') return departments;
    return departments.filter((d) => d.status === statusFilter);
  }, [departments, statusFilter]);

  if (!activeHotel) return null;

  const currency = activeHotel.operationalSettings.currency;
  const symbol = activeHotel.operationalSettings.currencySymbol;

  const refreshDepts = () => {
    setDepartments(saasStorage.getDepartments(activeHotel.id));
  };

  const handleOpenAdd = () => {
    setEditingDept(null);
    setForm({
      code: '',
      name: '',
      nameAm: '',
      description: '',
      operatingBudget: 100000,
      headOfDepartmentName: '',
      reportingDeadlineHour: 23,
      status: 'active',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setForm({
      code: dept.code,
      name: dept.name,
      nameAm: dept.nameAm || '',
      description: dept.description,
      operatingBudget: dept.operatingBudget || 100000,
      headOfDepartmentName: dept.headOfDepartmentName || '',
      reportingDeadlineHour: dept.reportingDeadlineHour || 23,
      status: dept.status,
    });
  };

  const actor = {
    email: user?.email || 'admin@hotel.com',
    fullName: user?.fullName || 'Hotel Admin',
    role: user?.role || 'hotel_admin',
  };

  const handleSubmitSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;

    if (editingDept) {
      const updated: Department = {
        ...editingDept,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        nameAm: form.nameAm.trim() || undefined,
        description: form.description.trim(),
        operatingBudget: Number(form.operatingBudget),
        headOfDepartmentName: form.headOfDepartmentName.trim() || undefined,
        reportingDeadlineHour: Number(form.reportingDeadlineHour),
        status: form.status,
      };
      saasStorage.saveDepartment(updated, actor);
      toast('Department updated', { description: `${updated.name} configuration saved.`, variant: 'success' });
    } else {
      const newDept: Department = {
        id: `dept_${activeHotel.id}_${Math.random().toString(36).substring(2, 7)}`,
        hotelId: activeHotel.id,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        nameAm: form.nameAm.trim() || undefined,
        description: form.description.trim(),
        operatingBudget: Number(form.operatingBudget),
        headOfDepartmentName: form.headOfDepartmentName.trim() || undefined,
        reportingDeadlineHour: Number(form.reportingDeadlineHour),
        status: form.status,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saasStorage.saveDepartment(newDept, actor);
      toast('Department created', { description: `${newDept.name} (${newDept.code}) added.`, variant: 'success' });
    }

    refreshDepts();
    setIsAddOpen(false);
    setEditingDept(null);
  };

  const handleToggleStatus = (dept: Department) => {
    const nextStatus = dept.status === 'active' ? 'inactive' : 'active';
    saasStorage.saveDepartment({ ...dept, status: nextStatus }, actor);
    refreshDepts();
    toast(nextStatus === 'active' ? 'Department activated' : 'Department paused', { variant: 'info' });
  };

  const activeCount = departments.filter((d) => d.status === 'active').length;
  const totalBudget = departments
    .filter((d) => d.status === 'active')
    .reduce((acc, d) => acc + (d.operatingBudget || 0), 0);

  const columns: DataTableColumn<Department>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      sortValue: (d) => d.code,
      render: (d) => <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">{d.code}</span>,
    },
    {
      key: 'name',
      header: 'Department Name',
      sortable: true,
      sortValue: (d) => d.name,
      render: (d) => (
        <div>
          <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-1.5">
            <span>{isAm && d.nameAm ? d.nameAm : d.name}</span>
            {d.isDefault && <span className="text-[10px] text-[#78837D] font-normal">({isAm ? 'መሰረታዊ' : 'Core'})</span>}
          </div>
          {isAm ? (
            <div className="text-[11px] text-[#78837D]">{d.name}</div>
          ) : (
            d.nameAm && <div className="text-[11px] text-[#78837D]">{d.nameAm}</div>
          )}
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Scope',
      render: (d) => (
        <span className="text-[#78837D] max-w-sm break-words block">
          {isAm && d.descriptionAm ? d.descriptionAm : d.description}
        </span>
      ),
    },
    {
      key: 'headOfDepartmentName',
      header: 'Department Head',
      sortable: true,
      sortValue: (d) => d.headOfDepartmentName || '',
      render: (d) =>
        d.headOfDepartmentName ? (
          <span className="font-medium inline-flex items-center gap-1.5 text-[#202B27] dark:text-[#ECF1EE]">
            <User className="w-3.5 h-3.5 text-[#647B52]" />
            {d.headOfDepartmentName}
          </span>
        ) : (
          <span className="text-[#78837D] italic">Unassigned</span>
        ),
    },
    {
      key: 'operatingBudget',
      header: 'Monthly Budget',
      align: 'right',
      sortable: true,
      sortValue: (d) => d.operatingBudget || 0,
      render: (d) => (
        <span className="font-mono font-semibold">
          {d.operatingBudget ? formatCurrency(d.operatingBudget, currency, symbol) : '—'}
        </span>
      ),
    },
    {
      key: 'reportingDeadlineHour',
      header: 'Shift Cutoff',
      render: (d) => (
        <span className="font-mono inline-flex items-center gap-1 text-[#78837D]">
          <Clock className="w-3.5 h-3.5 text-[#C6A15B]" />
          {d.reportingDeadlineHour || 23}:00
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (d) => d.status,
      render: (d) => (
        <button type="button" onClick={() => handleToggleStatus(d)} title="Click to toggle status">
          <StatusBadge label={d.status} tone={d.status === 'active' ? 'success' : 'neutral'} />
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (d) => (
        <button
          type="button"
          onClick={() => handleOpenEdit(d)}
          className="p-1.5 rounded-md text-[#78837D] hover:text-[#173F35] dark:hover:text-[#C6A15B] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
          title="Edit Department"
          aria-label={`Edit ${d.name}`}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Property Configuration', 'Departments']}
        title="Departmental Structure & Budgets"
        subtitle="Configure operational departments, reporting deadlines, monthly operating budgets, and leadership assignments."
        actions={
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white font-semibold text-xs whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>Add Department</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Configured Departments"
          value={departments.length}
          helper={`${activeCount} active operational units`}
          icon={Layers}
        />
        <KpiCard
          label="Active Departments"
          value={activeCount}
          delta={`${departments.length ? Math.round((activeCount / departments.length) * 100) : 0}%`}
          deltaTone="positive"
          helper="Submitting daily reports"
          icon={CheckCircle2}
        />
        <KpiCard
          label="Monthly Budget Pool"
          value={formatCurrency(totalBudget, currency, symbol)}
          helper="Combined active operating budgets"
          icon={DollarSign}
        />
      </div>

      <DataTable
        data={filteredDepts}
        columns={columns}
        keyExtractor={(d) => d.id}
        searchPlaceholder="Search department name, code, or head..."
        searchFilter={(d, q) =>
          d.name.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q) ||
          (d.headOfDepartmentName ? d.headOfDepartmentName.toLowerCase().includes(q) : false)
        }
        filterToolbar={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-1.5 text-xs seam-input"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        }
        onExportCsv={() => {
          downloadCsvFile(
            `${activeHotel.code.toLowerCase()}-departments.csv`,
            ['Code', 'Name', 'Head', 'Budget', 'Currency', 'Deadline Hour', 'Status'],
            filteredDepts.map((d) => [
              d.code,
              d.name,
              d.headOfDepartmentName || '',
              d.operatingBudget || 0,
              currency,
              d.reportingDeadlineHour || 23,
              d.status,
            ])
          );
          toast('Departments exported', { variant: 'info' });
        }}
      />

      <Modal
        open={isAddOpen || Boolean(editingDept)}
        onClose={() => {
          setIsAddOpen(false);
          setEditingDept(null);
        }}
        title={editingDept ? `Edit Department: ${editingDept.name}` : 'Add Custom Department'}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSubmitSave} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Dept Code *</label>
              <input
                type="text"
                required
                maxLength={5}
                placeholder="e.g. SPA"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 seam-input font-mono font-semibold"
              />
            </div>

            <div className="col-span-2">
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Department Name (English) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Spa & Wellness"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Local Translation (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. ስፓ እና መዝናኛ"
              value={form.nameAm}
              onChange={(e) => setForm({ ...form, nameAm: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Scope &amp; Responsibilities
            </label>
            <textarea
              rows={2}
              placeholder="Operational remit, shift schedules, and responsibilities..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Head of Department
              </label>
              <input
                type="text"
                placeholder="Manager or Lead Name"
                value={form.headOfDepartmentName}
                onChange={(e) => setForm({ ...form, headOfDepartmentName: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Monthly Operating Budget ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={form.operatingBudget}
                onChange={(e) => setForm({ ...form, operatingBudget: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 seam-input font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Daily Report Deadline
              </label>
              <select
                value={form.reportingDeadlineHour}
                onChange={(e) => setForm({ ...form, reportingDeadlineHour: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 seam-input"
              >
                <option value={20}>20:00 (8:00 PM)</option>
                <option value={21}>21:00 (9:00 PM)</option>
                <option value={22}>22:00 (10:00 PM)</option>
                <option value={23}>23:00 (11:00 PM)</option>
                <option value={24}>24:00 (Midnight)</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-3 py-2 seam-input"
              >
                <option value="active">Active Operational</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                setEditingDept(null);
              }}
              className="px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white font-semibold"
            >
              Save Department
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
