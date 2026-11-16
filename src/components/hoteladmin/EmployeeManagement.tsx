/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hotel Employee Directory & Bulk CSV Import Management
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { Employee } from '../../types/saas';
import { PageHeader, KpiCard, DataTable, DataTableColumn, StatusBadge, Modal } from '../ui';
import { formatCurrency, downloadCsvFile } from '../../utils/formatters';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Phone,
  Mail,
  Clock,
  DollarSign,
} from 'lucide-react';

export const EmployeeManagement: React.FC = () => {
  const { activeHotel, user } = useAuth();
  const { toast } = useToast();

  const [employees, setEmployees] = useState<Employee[]>(() =>
    activeHotel ? saasStorage.getEmployees(activeHotel.id) : []
  );
  const departments = useMemo(
    () => (activeHotel ? saasStorage.getDepartments(activeHotel.id) : []),
    [activeHotel?.id]
  );

  // Filters
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'on_leave' | 'suspended' | 'terminated'>('all');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  const [form, setForm] = useState({
    employeeId: '',
    fullName: '',
    phone: '',
    email: '',
    departmentId: departments[0]?.id || '',
    position: '',
    employmentDate: new Date().toISOString().slice(0, 10),
    employmentStatus: 'active' as Employee['employmentStatus'],
    salary: 15000,
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  // Bulk CSV States
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkPreview, setBulkPreview] = useState<Array<Omit<Employee, 'id' | 'hotelId' | 'createdAt' | 'updatedAt'>>>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);

  useEffect(() => {
    if (activeHotel) {
      setEmployees(saasStorage.getEmployees(activeHotel.id));
    }
  }, [activeHotel?.id]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const matchDept = deptFilter === 'all' || e.departmentId === deptFilter;
      const matchStatus = statusFilter === 'all' || e.employmentStatus === statusFilter;
      return matchDept && matchStatus;
    });
  }, [employees, deptFilter, statusFilter]);

  if (!activeHotel) return null;

  const currency = activeHotel.operationalSettings.currency;
  const symbol = activeHotel.operationalSettings.currencySymbol;

  const refreshEmployees = () => {
    setEmployees(saasStorage.getEmployees(activeHotel.id));
  };

  const actor = {
    email: user?.email || 'admin@hotel.com',
    fullName: user?.fullName || 'Hotel Admin',
    role: user?.role || 'hotel_admin',
  };

  const handleOpenAdd = () => {
    setEditingEmp(null);
    setForm({
      employeeId: `EMP-${(employees.length + 1).toString().padStart(3, '0')}`,
      fullName: '',
      phone: '+251 9',
      email: '',
      departmentId: departments[0]?.id || '',
      position: '',
      employmentDate: new Date().toISOString().slice(0, 10),
      employmentStatus: 'active',
      salary: currency === 'ETB' ? 12000 : 800,
      emergencyContactName: '',
      emergencyContactPhone: '+251 9',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setForm({
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      phone: emp.phone,
      email: emp.email,
      departmentId: emp.departmentId,
      position: emp.position,
      employmentDate: emp.employmentDate,
      employmentStatus: emp.employmentStatus,
      salary: emp.salary || 10000,
      emergencyContactName: emp.emergencyContactName || '',
      emergencyContactPhone: emp.emergencyContactPhone || '',
    });
    setIsAddOpen(true);
  };

  const handleSubmitSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.employeeId.trim()) return;

    const targetDept = departments.find((d) => d.id === form.departmentId) || departments[0];

    if (editingEmp) {
      const updated: Employee = {
        ...editingEmp,
        employeeId: form.employeeId.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        departmentId: form.departmentId,
        departmentName: targetDept?.name || 'Operations',
        position: form.position.trim(),
        employmentDate: form.employmentDate,
        employmentStatus: form.employmentStatus,
        salary: Number(form.salary),
        emergencyContactName: form.emergencyContactName.trim() || undefined,
        emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      saasStorage.saveEmployee(updated, actor);
      toast('Employee record updated', { description: `${updated.fullName} (${updated.employeeId})`, variant: 'success' });
    } else {
      const newEmp: Employee = {
        id: `emp_${activeHotel.id}_${Math.random().toString(36).substring(2, 7)}`,
        hotelId: activeHotel.id,
        employeeId: form.employeeId.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        departmentId: form.departmentId,
        departmentName: targetDept?.name || 'Operations',
        position: form.position.trim(),
        employmentDate: form.employmentDate,
        employmentStatus: form.employmentStatus,
        salary: Number(form.salary),
        emergencyContactName: form.emergencyContactName.trim() || undefined,
        emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saasStorage.saveEmployee(newEmp, actor);
      toast('Employee registered', { description: `${newEmp.fullName} added to roster.`, variant: 'success' });
    }

    refreshEmployees();
    setIsAddOpen(false);
    setEditingEmp(null);
  };

  // CSV Parsing logic
  const handleParseCsv = (rawText: string) => {
    setBulkCsvText(rawText);
    setBulkError(null);
    if (!rawText.trim()) {
      setBulkPreview([]);
      return;
    }

    try {
      const lines = rawText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setBulkError('CSV must include a header row and at least one employee data row.');
        setBulkPreview([]);
        return;
      }

      const rows = lines.slice(1);
      const parsed: Array<Omit<Employee, 'id' | 'hotelId' | 'createdAt' | 'updatedAt'>> = [];

      rows.forEach((row, idx) => {
        const cols = row.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        if (cols.length >= 4) {
          const empId = cols[0] || `EMP-${(employees.length + idx + 1).toString().padStart(3, '0')}`;
          const name = cols[1] || 'Unknown Employee';
          const email = cols[2] || `${empId.toLowerCase()}@hotel.com`;
          const phone = cols[3] || '+251 900000000';
          const deptRaw = cols[4] || 'Front Office';
          const pos = cols[5] || 'Staff Member';
          const hireDate = cols[6] || new Date().toISOString().slice(0, 10);
          const salary = cols[7] ? parseFloat(cols[7]) : 12000;

          const matchedDept =
            departments.find(
              (d) => d.name.toLowerCase() === deptRaw.toLowerCase() || d.code.toLowerCase() === deptRaw.toLowerCase()
            ) || departments[0];

          parsed.push({
            employeeId: empId,
            fullName: name,
            email,
            phone,
            departmentId: matchedDept ? matchedDept.id : 'dept_fo',
            departmentName: matchedDept ? matchedDept.name : 'Front Office',
            position: pos,
            employmentDate: hireDate,
            employmentStatus: 'active',
            salary,
          });
        }
      });

      if (parsed.length === 0) {
        setBulkError('No valid employee rows parsed from provided input.');
      } else {
        setBulkPreview(parsed);
      }
    } catch (err: unknown) {
      setBulkError(`CSV Parse Error: ${err instanceof Error ? err.message : 'Invalid format'}`);
      setBulkPreview([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleParseCsv(content);
    };
    reader.readAsText(file);
  };

  const handleCommitBulkImport = () => {
    if (bulkPreview.length === 0) return;

    saasStorage.importEmployeesBulk(activeHotel.id, bulkPreview, actor);
    refreshEmployees();
    toast('Bulk import completed', {
      description: `${bulkPreview.length} employees imported into ${activeHotel.name}.`,
      variant: 'success',
    });
    setIsBulkOpen(false);
    setBulkCsvText('');
    setBulkPreview([]);
  };

  const handleDownloadSampleCsv = () => {
    downloadCsvFile(
      'SEAM_Employee_Import_Template.csv',
      ['Employee_ID', 'Full_Name', 'Email', 'Phone', 'Department', 'Position', 'Employment_Date', 'Salary'],
      [
        ['EMP-101', 'Abebe Bikila', 'abebe.b@hotel.com', '+251 91 123 4567', 'Front Office', 'Front Desk Supervisor', '2025-01-15', 18500],
        ['EMP-102', 'Sara Tesfaye', 'sara.t@hotel.com', '+251 92 234 5678', 'Housekeeping', 'Executive Housekeeper', '2025-02-01', 16000],
        ['EMP-103', 'Mulugeta Assefa', 'mulugeta.a@hotel.com', '+251 93 345 6789', 'Food & Beverage', 'Head Chef', '2025-02-10', 24000],
      ]
    );
    toast('Sample CSV template downloaded', { variant: 'info' });
  };

  const handleExportStaffCsv = () => {
    downloadCsvFile(
      `${activeHotel.code}_Staff_Roster.csv`,
      ['Employee_ID', 'Full_Name', 'Email', 'Phone', 'Department', 'Position', 'Employment_Date', 'Salary', 'Status'],
      filteredEmployees.map((e) => [
        e.employeeId,
        e.fullName,
        e.email,
        e.phone,
        e.departmentName,
        e.position,
        e.employmentDate,
        e.salary || 0,
        e.employmentStatus,
      ])
    );
    toast('Staff roster exported to CSV', { variant: 'info' });
  };

  const activeStaffCount = employees.filter((e) => e.employmentStatus === 'active').length;
  const onLeaveCount = employees.filter((e) => e.employmentStatus === 'on_leave').length;
  const monthlyPayroll = employees.reduce((acc, e) => acc + (e.salary || 0), 0);

  const columns: DataTableColumn<Employee>[] = [
    {
      key: 'employeeId',
      header: 'Staff ID',
      sortable: true,
      sortValue: (e) => e.employeeId,
      render: (e) => <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">{e.employeeId}</span>,
    },
    {
      key: 'fullName',
      header: 'Employee',
      sortable: true,
      sortValue: (e) => e.fullName,
      render: (e) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B] font-semibold flex items-center justify-center text-xs shrink-0">
            {e.fullName.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{e.fullName}</div>
            {e.emergencyContactName && (
              <div className="text-[11px] text-[#78837D]">
                ICE: {e.emergencyContactName} ({e.emergencyContactPhone})
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'departmentName',
      header: 'Department & Role',
      sortable: true,
      sortValue: (e) => e.departmentName,
      render: (e) => (
        <div>
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{e.position}</div>
          <div className="text-[11px] text-[#647B52]">{e.departmentName}</div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Info',
      render: (e) => (
        <div>
          <div className="inline-flex items-center gap-1 font-mono text-[#202B27] dark:text-[#ECF1EE]">
            <Phone className="w-3 h-3 text-[#78837D]" />
            <span>{e.phone}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#78837D] mt-0.5">
            <Mail className="w-3 h-3 shrink-0" />
            <span className="break-all">{e.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'employmentDate',
      header: 'Hired Date',
      sortable: true,
      sortValue: (e) => e.employmentDate,
      render: (e) => <span className="font-mono text-[#78837D]">{e.employmentDate}</span>,
    },
    {
      key: 'salary',
      header: 'Monthly Salary',
      align: 'right',
      sortable: true,
      sortValue: (e) => e.salary || 0,
      render: (e) => (
        <span className="font-mono font-semibold">
          {e.salary ? formatCurrency(e.salary, currency, symbol) : '—'}
        </span>
      ),
    },
    {
      key: 'employmentStatus',
      header: 'Status',
      sortable: true,
      sortValue: (e) => e.employmentStatus,
      render: (e) => (
        <StatusBadge
          label={e.employmentStatus.replace(/_/g, ' ')}
          tone={
            e.employmentStatus === 'active'
              ? 'success'
              : e.employmentStatus === 'on_leave'
              ? 'warning'
              : 'critical'
          }
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (e) => (
        <button
          type="button"
          onClick={() => handleOpenEdit(e)}
          className="p-1.5 rounded-md text-[#78837D] hover:text-[#173F35] dark:hover:text-[#C6A15B] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
          title="Edit Employee"
          aria-label={`Edit ${e.fullName}`}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Property Configuration', 'Employee Directory']}
        title="Employee Directory & Staff Records"
        subtitle="Maintain property personnel files, departmental assignments, base salaries, and bulk CSV onboarding."
        actions={
          <>
            <button
              type="button"
              onClick={() => setIsBulkOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] font-medium text-xs whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#647B52]" />
              <span>Bulk CSV Import</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white font-semibold text-xs whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Register Employee</span>
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Enrolled Staff" value={employees.length} helper="Property headcount" icon={Users} />
        <KpiCard
          label="Active On Duty"
          value={activeStaffCount}
          delta={`${employees.length ? Math.round((activeStaffCount / employees.length) * 100) : 0}%`}
          deltaTone="positive"
          helper="Current active roster"
          icon={CheckCircle2}
        />
        <KpiCard
          label="On Approved Leave"
          value={onLeaveCount}
          deltaTone={onLeaveCount > 0 ? 'warning' : 'neutral'}
          helper="Scheduled absences"
          icon={Clock}
        />
        <KpiCard
          label="Monthly Base Payroll"
          value={formatCurrency(monthlyPayroll, currency, symbol)}
          helper="Gross salary commitment"
          icon={DollarSign}
        />
      </div>

      <DataTable
        data={filteredEmployees}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchPlaceholder="Search name, staff ID, position, or email..."
        searchFilter={(e, q) =>
          e.fullName.toLowerCase().includes(q) ||
          e.employeeId.toLowerCase().includes(q) ||
          e.position.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q)
        }
        filterToolbar={
          <>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 text-xs seam-input"
              aria-label="Filter by department"
            >
              <option value="all">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | 'active' | 'on_leave' | 'suspended' | 'terminated')
              }
              className="px-3 py-1.5 text-xs seam-input"
              aria-label="Filter by employment status"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="suspended">Suspended</option>
              <option value="terminated">Terminated</option>
            </select>
          </>
        }
        onExportCsv={handleExportStaffCsv}
        emptyTitle="No matching employees"
        emptyDescription="Adjust your department or status filter, or enroll new staff members."
      />

      {/* MODAL 1: ADD / EDIT EMPLOYEE */}
      <Modal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={editingEmp ? `Edit Employee: ${editingEmp.fullName}` : 'Register New Employee'}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSubmitSave} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Employee ID *</label>
              <input
                type="text"
                required
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 seam-input font-mono font-semibold"
              />
            </div>

            <div className="col-span-2">
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Almaz Bekele"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Department *</label>
              <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Job Title / Position *</label>
              <input
                type="text"
                required
                placeholder="e.g. Front Desk Lead"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Phone Number *</label>
              <input
                type="text"
                required
                placeholder="+251 9..."
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="staff@hotel.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Hired Date</label>
              <input
                type="date"
                required
                value={form.employmentDate}
                onChange={(e) => setForm({ ...form, employmentDate: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Monthly Salary ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 seam-input font-mono font-semibold tabular-nums"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Status</label>
              <select
                value={form.employmentStatus}
                onChange={(e) => setForm({ ...form, employmentStatus: e.target.value as Employee['employmentStatus'] })}
                className="w-full px-3 py-2 seam-input"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="suspended">Suspended</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <span className="text-[11px] font-medium text-[#78837D] uppercase tracking-wider block mb-2">
              Emergency Contact
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Contact Full Name"
                value={form.emergencyContactName}
                onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
              <input
                type="text"
                placeholder="Emergency Phone (+251 9...)"
                value={form.emergencyContactPhone}
                onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white font-semibold"
            >
              Save Employee
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: BULK CSV IMPORT */}
      <Modal
        open={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Bulk Employee Import (CSV)"
        subtitle="Upload or paste comma-separated employee records for batch onboarding"
        maxWidthClass="max-w-2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between gap-3 p-3.5 bg-[#F6F8F6] dark:bg-[#192622] rounded-lg border border-[#E6EBE7] dark:border-[#22322C]">
            <div>
              <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block">
                CSV Import Format Template
              </span>
              <span className="text-[11px] text-[#78837D]">
                Download a pre-formatted template with sample column headers.
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadSampleCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#173F35] text-white font-medium text-xs shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Sample CSV</span>
            </button>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Upload CSV File</label>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="w-full text-xs text-[#78837D] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-[#E6EBE7] dark:file:border-[#22322C] file:text-xs file:font-semibold file:bg-[#F6F8F6] file:text-[#173F35] dark:file:bg-[#192622] dark:file:text-[#ECF1EE]"
            />
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Or Paste CSV Content Directly
            </label>
            <textarea
              rows={5}
              value={bulkCsvText}
              onChange={(e) => handleParseCsv(e.target.value)}
              placeholder="Employee_ID,Full_Name,Email,Phone,Department,Position,Employment_Date,Salary..."
              className="w-full px-3 py-2 seam-input font-mono text-[11px]"
            />
          </div>

          {bulkError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{bulkError}</span>
            </div>
          )}

          {bulkPreview.length > 0 && (
            <div className="space-y-2">
              <div className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Parsed {bulkPreview.length} Employees Ready to Import</span>
              </div>

              <div className="max-h-40 overflow-y-auto border border-[#E6EBE7] dark:border-[#22322C] rounded-lg">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D] sticky top-0">
                    <tr>
                      <th className="p-2">ID</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Dept</th>
                      <th className="p-2">Position</th>
                      <th className="p-2 text-right">Salary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EBE7] dark:divide-[#22322C]">
                    {bulkPreview.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        <td className="p-2 font-mono font-semibold">{row.employeeId}</td>
                        <td className="p-2">{row.fullName}</td>
                        <td className="p-2">{row.departmentName}</td>
                        <td className="p-2">{row.position}</td>
                        <td className="p-2 text-right font-mono tabular-nums">{row.salary?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bulkPreview.length > 10 && (
                  <div className="p-1.5 text-center bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D] text-[10px]">
                    + {bulkPreview.length - 10} more rows
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsBulkOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={bulkPreview.length === 0}
              onClick={handleCommitBulkImport}
              className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] disabled:opacity-50 text-white font-semibold"
            >
              Import {bulkPreview.length} Employees
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
