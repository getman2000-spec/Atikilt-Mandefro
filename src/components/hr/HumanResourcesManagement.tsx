import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Calendar,
  Clock,
  DollarSign,
  Plus,
  CheckCircle2,
  Search,
  Briefcase,
  Eye,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import {
  Hotel,
  ShiftSchedule,
  ShiftType,
  AttendanceRecord,
  LeaveRequest,
  LeaveType,
  PayrollPeriod,
  EmployeePayrollItem,
  Employee,
} from '../../types/saas';
import { CurrentUser } from '../../context/AuthContext';
import { saasStorage } from '../../services/storage';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, downloadCsvFile } from '../../utils/formatters';
import {
  PageHeader,
  KpiCard,
  StatusBadge,
  EmptyState,
  Modal,
  DataTable,
  DataTableColumn,
  SampleDataBadge,
  VerificationNotice,
} from '../ui';
import { TAX_AND_PAYROLL_CONFIG } from '../../config/taxAndPayrollConfig';

interface HumanResourcesManagementProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

export const HumanResourcesManagement: React.FC<HumanResourcesManagementProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast, confirmAction } = useToast();
  const [activeTab, setActiveTab] = useState<'roster' | 'attendance' | 'leave' | 'payroll'>('roster');
  const [refreshKey, setRefreshKey] = useState(0);

  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings?.currency || 'ETB';
  const currencySymbol = activeHotel?.operationalSettings?.currencySymbol;
  const businessDate = hotelId
    ? saasStorage.getCurrentBusinessDate(hotelId)
    : new Date().toISOString().slice(0, 10);

  const actor = useMemo(
    () => ({
      email: currentUser?.email || 'hr@seam.com',
      fullName: currentUser?.fullName || 'HR Manager',
      role: currentUser?.role || 'hotel_admin',
    }),
    [currentUser]
  );

  // Data fetching
  const employees: Employee[] = useMemo(() => {
    void refreshKey;
    if (!hotelId) return [];
    return saasStorage.getEmployees(hotelId);
  }, [hotelId, refreshKey]);

  const shifts: ShiftSchedule[] = useMemo(() => {
    void refreshKey;
    if (!hotelId) return [];
    return saasStorage.getShiftSchedules(hotelId);
  }, [hotelId, refreshKey]);

  const attendance: AttendanceRecord[] = useMemo(() => {
    void refreshKey;
    if (!hotelId) return [];
    return saasStorage.getAttendanceRecords(hotelId);
  }, [hotelId, refreshKey]);

  const leaves: LeaveRequest[] = useMemo(() => {
    void refreshKey;
    if (!hotelId) return [];
    return saasStorage.getLeaveRequests(hotelId);
  }, [hotelId, refreshKey]);

  const payrollPeriods: PayrollPeriod[] = useMemo(() => {
    void refreshKey;
    if (!hotelId) return [];
    return saasStorage.getPayrollPeriods(hotelId);
  }, [hotelId, refreshKey]);

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');

  // Filters & State
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(businessDate);

  // Modals state
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [selectedPayslipItem, setSelectedPayslipItem] = useState<EmployeePayrollItem | null>(null);

  // Reset on property change
  useEffect(() => {
    setSelectedPeriodId('');
    setDepartmentFilter('all');
    setSearchQuery('');
    setSelectedDate(businessDate);
    setShowShiftModal(false);
    setShowClockInModal(false);
    setShowLeaveModal(false);
    setShowPayrollModal(false);
    setSelectedPayslipItem(null);
  }, [hotelId, businessDate]);

  useEffect(() => {
    if (payrollPeriods.length > 0 && !payrollPeriods.some((p) => p.id === selectedPeriodId)) {
      setSelectedPeriodId(payrollPeriods[0].id);
    }
  }, [payrollPeriods, selectedPeriodId]);

  const selectedPeriod = useMemo(() => {
    return payrollPeriods.find((p) => p.id === selectedPeriodId) || payrollPeriods[0] || null;
  }, [payrollPeriods, selectedPeriodId]);

  const payrollItems: EmployeePayrollItem[] = useMemo(() => {
    void refreshKey;
    if (!selectedPeriod) return [];
    return saasStorage.getPayrollItems(selectedPeriod.id);
  }, [selectedPeriod, refreshKey]);

  // New Shift Form
  const [shiftForm, setShiftForm] = useState({
    employeeId: '',
    shiftType: 'morning' as ShiftType,
    date: businessDate,
    startTime: '07:00',
    endTime: '15:30',
    notes: '',
  });

  // Clock In Form
  const [clockInEmployeeId, setClockInEmployeeId] = useState('');

  // Leave Form
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    leaveType: 'annual' as LeaveType,
    startDate: businessDate,
    endDate: businessDate,
    daysCount: 3,
    reason: '',
  });

  // Payroll Form
  const [payrollForm, setPayrollForm] = useState({
    periodName: 'Monthly Regular Payroll',
    startDate: businessDate.slice(0, 8) + '01',
    endDate: businessDate,
    serviceChargePool: 145000,
  });

  // Distinct departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.departmentName) set.add(e.departmentName);
    });
    return Array.from(set);
  }, [employees]);

  // Handler: Assign Shift
  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !shiftForm.employeeId) return;

    const emp = employees.find((item) => item.id === shiftForm.employeeId);
    if (!emp) return;

    const newShift: ShiftSchedule = {
      id: 'sft_' + Math.random().toString(36).substring(2, 9),
      hotelId,
      employeeId: emp.id,
      employeeName: emp.fullName,
      departmentId: emp.departmentId || 'dept_gen',
      departmentName: emp.departmentName || 'General',
      date: shiftForm.date,
      shiftType: shiftForm.shiftType,
      startTime: shiftForm.startTime,
      endTime: shiftForm.endTime,
      notes: shiftForm.notes,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };

    saasStorage.saveShiftSchedule(newShift, actor);
    setShowShiftModal(false);
    setShiftForm((prev) => ({ ...prev, employeeId: '', notes: '' }));
    setRefreshKey((k) => k + 1);
    toast('Shift assigned', {
      description: `${emp.fullName} scheduled for ${shiftForm.shiftType} shift on ${shiftForm.date}.`,
      variant: 'success',
    });
  };

  const handleDeleteShift = (shift: ShiftSchedule) => {
    confirmAction({
      title: 'Remove Scheduled Shift',
      description: `Remove ${shift.employeeName}'s ${shift.shiftType} shift on ${shift.date}?`,
      confirmLabel: 'Remove Shift',
      tone: 'danger',
      onConfirm: () => {
        saasStorage.deleteShiftSchedule(shift.id, actor);
        setRefreshKey((k) => k + 1);
        toast('Shift removed', { variant: 'info' });
      },
    });
  };

  // Handler: Clock In
  const handleClockIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !clockInEmployeeId) return;

    const emp = employees.find((item) => item.id === clockInEmployeeId);
    saasStorage.clockIn(clockInEmployeeId, hotelId, actor);

    setShowClockInModal(false);
    setClockInEmployeeId('');
    setRefreshKey((k) => k + 1);
    toast('Attendance punch recorded', {
      description: `${emp?.fullName || 'Staff member'} clocked in.`,
      variant: 'success',
    });
  };

  // Handler: Clock Out
  const handleClockOut = (recordId: string, employeeName: string) => {
    saasStorage.clockOut(recordId, actor);
    setRefreshKey((k) => k + 1);
    toast('Staff clocked out', {
      description: `Shift completed for ${employeeName}.`,
      variant: 'info',
    });
  };

  // Handler: Submit Leave
  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !leaveForm.employeeId) return;

    const emp = employees.find((item) => item.id === leaveForm.employeeId);
    if (!emp) return;

    saasStorage.submitLeaveRequest(
      {
        hotelId,
        employeeId: emp.id,
        employeeName: emp.fullName,
        departmentName: emp.departmentName || 'General',
        leaveType: leaveForm.leaveType,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        daysCount: Number(leaveForm.daysCount),
        reason: leaveForm.reason,
      },
      actor
    );

    setShowLeaveModal(false);
    setLeaveForm((prev) => ({ ...prev, employeeId: '', reason: '' }));
    setRefreshKey((k) => k + 1);
    toast('Leave application submitted', {
      description: `${emp.fullName} (${leaveForm.daysCount} days ${leaveForm.leaveType}).`,
      variant: 'success',
    });
  };

  // Handler: Approve/Reject Leave
  const handleLeaveAction = (leave: LeaveRequest, status: 'approved' | 'rejected') => {
    saasStorage.updateLeaveRequestStatus(
      leave.id,
      status,
      status === 'rejected' ? 'Operational staffing coverage constraint during requested period' : '',
      actor
    );
    setRefreshKey((k) => k + 1);
    toast(`Leave request ${status}`, {
      description: `${leave.employeeName} (${leave.startDate} → ${leave.endDate}).`,
      variant: status === 'approved' ? 'success' : 'warning',
    });
  };

  // Handler: Generate Payroll
  const handleGeneratePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    const period = saasStorage.generateMonthlyPayroll(
      hotelId,
      payrollForm.periodName,
      payrollForm.startDate,
      payrollForm.endDate,
      Number(payrollForm.serviceChargePool),
      actor
    );

    setSelectedPeriodId(period.id);
    setShowPayrollModal(false);
    setRefreshKey((k) => k + 1);
    toast('Payroll run generated', {
      description: `${period.periodName} calculated for ${period.eligibleStaffCount} staff.`,
      variant: 'success',
    });
  };

  // Handler: Disburse Payroll
  const handleDisbursePayroll = (period: PayrollPeriod) => {
    confirmAction({
      title: 'Authorize & Disburse Payroll',
      description: `Confirm disbursement of ${formatCurrency(period.totalNetPay, currency, currencySymbol)} across ${period.eligibleStaffCount} staff for "${period.periodName}"?`,
      confirmLabel: 'Authorize Disbursement',
      tone: 'warning',
      onConfirm: () => {
        saasStorage.disbursePayrollPeriod(period.id, actor);
        setRefreshKey((k) => k + 1);
        toast('Payroll disbursed', {
          description: `${period.periodName} marked as disbursed.`,
          variant: 'success',
        });
      },
    });
  };

  // Filtered Shifts
  const filteredShifts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return shifts.filter((s) => {
      const matchDept = departmentFilter === 'all' || s.departmentName === departmentFilter;
      const matchSearch =
        !q || s.employeeName.toLowerCase().includes(q) || s.shiftType.toLowerCase().includes(q);
      const matchDate = !selectedDate || s.date === selectedDate;
      return matchDept && matchSearch && matchDate;
    });
  }, [shifts, departmentFilter, searchQuery, selectedDate]);

  const activeDutyCount = useMemo(
    () => attendance.filter((a) => !a.clockOutTime).length,
    [attendance]
  );

  const pendingLeavesCount = useMemo(
    () => leaves.filter((l) => l.status === 'pending').length,
    [leaves]
  );

  const shiftColumns: DataTableColumn<ShiftSchedule>[] = [
    {
      key: 'employeeName',
      header: 'Staff Member',
      sortable: true,
      sortValue: (s) => s.employeeName,
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#F1F4F1] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B] font-semibold flex items-center justify-center text-xs shrink-0">
            {s.employeeName.charAt(0)}
          </div>
          <span className="font-medium">{s.employeeName}</span>
        </div>
      ),
    },
    {
      key: 'departmentName',
      header: 'Department',
      sortable: true,
      sortValue: (s) => s.departmentName,
      render: (s) => <span className="text-[#78837D] dark:text-[#92A199]">{s.departmentName}</span>,
    },
    {
      key: 'date',
      header: 'Date & Time',
      sortable: true,
      sortValue: (s) => `${s.date} ${s.startTime}`,
      render: (s) => (
        <div>
          <div className="font-mono font-medium tabular-nums">
            {s.startTime} – {s.endTime}
          </div>
          <div className="text-[11px] font-mono text-[#78837D] dark:text-[#92A199] tabular-nums">{s.date}</div>
        </div>
      ),
    },
    {
      key: 'shiftType',
      header: 'Shift Category',
      render: (s) => (
        <StatusBadge
          label={s.shiftType}
          tone={
            s.shiftType === 'morning'
              ? 'warning'
              : s.shiftType === 'afternoon'
              ? 'forest'
              : s.shiftType === 'night'
              ? 'neutral'
              : s.shiftType === 'split'
              ? 'critical'
              : 'neutral'
          }
          showIcon={false}
        />
      ),
    },
    {
      key: 'notes',
      header: 'Operational Notes',
      render: (s) => (
        <span className="text-[#78837D] dark:text-[#92A199] max-w-[260px] block">
          {s.notes || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <button
          type="button"
          onClick={() => handleDeleteShift(s)}
          className="text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline"
        >
          Remove
        </button>
      ),
    },
  ];

  const attendanceColumns: DataTableColumn<AttendanceRecord>[] = [
    {
      key: 'employeeName',
      header: 'Staff Member',
      sortable: true,
      sortValue: (a) => a.employeeName,
      render: (a) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#F1F4F1] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B] font-semibold flex items-center justify-center text-xs shrink-0">
            {a.employeeName.charAt(0)}
          </div>
          <span className="font-medium">{a.employeeName}</span>
        </div>
      ),
    },
    {
      key: 'departmentName',
      header: 'Department',
      render: (a) => <span className="text-[#78837D] dark:text-[#92A199]">{a.departmentName}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      sortValue: (a) => a.date,
      render: (a) => <span className="font-mono text-[#78837D] dark:text-[#92A199] tabular-nums">{a.date}</span>,
    },
    {
      key: 'clockInTime',
      header: 'Clock In',
      render: (a) => <span className="font-mono font-semibold tabular-nums">{a.clockInTime}</span>,
    },
    {
      key: 'clockOutTime',
      header: 'Clock Out',
      render: (a) =>
        a.clockOutTime ? (
          <span className="font-mono font-semibold tabular-nums">{a.clockOutTime}</span>
        ) : (
          <StatusBadge label="On Duty Now" tone="warning" />
        ),
    },
    {
      key: 'totalHours',
      header: 'Total Hours',
      align: 'right',
      render: (a) => (
        <span className="font-mono tabular-nums">
          {a.totalHours} hrs{a.overtimeHours > 0 ? ` (+${a.overtimeHours} OT)` : ''}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Punctuality',
      render: (a) => (
        <StatusBadge
          label={a.status.replace(/_/g, ' ')}
          tone={a.status === 'on_time' ? 'success' : a.status === 'late' ? 'critical' : 'forest'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (a) =>
        !a.clockOutTime ? (
          <button
            type="button"
            onClick={() => handleClockOut(a.id, a.employeeName)}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white transition-colors whitespace-nowrap"
          >
            Clock Out
          </button>
        ) : (
          <span className="text-[11px] text-[#78837D] dark:text-[#92A199]">Completed</span>
        ),
    },
  ];

  const leaveColumns: DataTableColumn<LeaveRequest>[] = [
    {
      key: 'employeeName',
      header: 'Staff Member',
      sortable: true,
      sortValue: (l) => l.employeeName,
      render: (l) => (
        <div>
          <div className="font-medium">{l.employeeName}</div>
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">{l.departmentName}</div>
        </div>
      ),
    },
    {
      key: 'leaveType',
      header: 'Type',
      render: (l) => <StatusBadge label={l.leaveType} tone="neutral" showIcon={false} />,
    },
    {
      key: 'dates',
      header: 'Duration & Dates',
      render: (l) => (
        <span className="font-mono text-[11px] text-[#78837D] dark:text-[#92A199] tabular-nums">
          {l.startDate} → {l.endDate}
        </span>
      ),
    },
    {
      key: 'daysCount',
      header: 'Days',
      align: 'right',
      sortable: true,
      sortValue: (l) => l.daysCount,
      render: (l) => <span className="font-mono font-semibold tabular-nums">{l.daysCount} d</span>,
    },
    {
      key: 'reason',
      header: 'Reason & Notes',
      render: (l) => (
        <div className="max-w-[280px]">
          <div>{l.reason}</div>
          {l.approvedBy && (
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Approved by {l.approvedBy}
            </div>
          )}
          {l.rejectionReason && (
            <div className="text-[11px] text-rose-600 dark:text-rose-400">
              {l.rejectionReason}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (l) => (
        <StatusBadge
          label={l.status}
          tone={l.status === 'approved' ? 'success' : l.status === 'rejected' ? 'critical' : 'warning'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Approval Actions',
      align: 'right',
      render: (l) =>
        l.status === 'pending' ? (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => handleLeaveAction(l, 'approved')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              <Check className="w-3 h-3" />
              Approve
            </button>
            <button
              type="button"
              onClick={() => handleLeaveAction(l, 'rejected')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white"
            >
              <X className="w-3 h-3" />
              Decline
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-[#78837D] dark:text-[#92A199]">Finalized</span>
        ),
    },
  ];

  const payrollColumns: DataTableColumn<EmployeePayrollItem>[] = [
    {
      key: 'employeeName',
      header: 'Staff Member',
      sortable: true,
      sortValue: (i) => i.employeeName,
      render: (i) => (
        <div>
          <div className="font-semibold">{i.employeeName}</div>
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
            {i.departmentName} · {i.designation}
          </div>
        </div>
      ),
    },
    {
      key: 'baseSalary',
      header: 'Base Salary',
      align: 'right',
      sortable: true,
      sortValue: (i) => i.baseSalary,
      render: (i) => (
        <span className="font-mono tabular-nums">
          {formatCurrency(i.baseSalary, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'serviceChargeShare',
      header: '10% SC Share',
      align: 'right',
      sortable: true,
      sortValue: (i) => i.serviceChargeShare,
      render: (i) => (
        <span className="font-mono font-semibold text-[#C6A15B] tabular-nums">
          +{formatCurrency(i.serviceChargeShare, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'overtime',
      header: 'OT & Bonus',
      align: 'right',
      render: (i) => (
        <span className="font-mono text-[#78837D] dark:text-[#92A199] tabular-nums">
          +{formatCurrency(i.overtimePay + i.bonuses, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'grossPay',
      header: 'Gross Pay',
      align: 'right',
      sortable: true,
      sortValue: (i) => i.grossPay,
      render: (i) => (
        <span className="font-mono font-semibold tabular-nums">
          {formatCurrency(i.grossPay, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'deductions',
      header: 'Tax & Pension',
      align: 'right',
      render: (i) => (
        <span className="font-mono text-rose-600 dark:text-rose-400 tabular-nums">
          -{formatCurrency(i.incomeTax + i.pensionEmployee, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'netPay',
      header: 'Net Payout',
      align: 'right',
      sortable: true,
      sortValue: (i) => i.netPay,
      render: (i) => (
        <span className="font-mono font-semibold text-[#173F35] dark:text-[#C6A15B] tabular-nums">
          {formatCurrency(i.netPay, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Payslip',
      align: 'right',
      render: (i) => (
        <button
          type="button"
          onClick={() => setSelectedPayslipItem(i)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
        >
          <Eye className="w-3 h-3" />
          Slip
        </button>
      ),
    },
  ];

  const handleExportShiftsCsv = () => {
    downloadCsvFile(
      `shift-roster-${selectedDate || 'all'}.csv`,
      ['Employee', 'Department', 'Date', 'Shift', 'Start', 'End', 'Notes'],
      filteredShifts.map((s) => [
        s.employeeName,
        s.departmentName,
        s.date,
        s.shiftType,
        s.startTime,
        s.endTime,
        s.notes || '',
      ])
    );
    toast('Shift roster exported', { variant: 'info' });
  };

  const handleExportPayrollCsv = () => {
    downloadCsvFile(
      `payroll-${selectedPeriod?.periodName || 'export'}.csv`,
      ['Employee', 'Department', 'Designation', 'Base Salary', '10% SC Share', 'OT & Bonuses', 'Gross Pay', 'Tax', 'Pension', 'Net Pay'],
      payrollItems.map((i) => [
        i.employeeName,
        i.departmentName,
        i.designation,
        i.baseSalary,
        i.serviceChargeShare,
        i.overtimePay + i.bonuses,
        i.grossPay,
        i.incomeTax,
        i.pensionEmployee,
        i.netPay,
      ])
    );
    toast('Payroll breakdown exported', { variant: 'info' });
  };

  const tabs = [
    { id: 'roster' as const, label: 'Shift Roster', count: shifts.length, icon: Calendar },
    { id: 'attendance' as const, label: 'Time & Attendance', count: attendance.length, icon: Clock },
    { id: 'leave' as const, label: 'Leave Approvals', count: pendingLeavesCount, icon: Briefcase },
    { id: 'payroll' as const, label: 'Payroll & 10% SC', count: payrollPeriods.length, icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR, Rosters & Hospitality Payroll"
        subtitle="Staff shift scheduling, live punch clock attendance, leave approvals, and statutory payroll with 10% service charge distribution."
        breadcrumbs={['Operations', 'HR & Payroll']}
        meta={
          activeHotel ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#647B52]" />
                {activeHotel.name} • {employees.length} Active Staff
              </span>
              <SampleDataBadge />
            </div>
          ) : undefined
        }
        actions={
          <>
            {activeTab === 'roster' && (
              <button
                type="button"
                onClick={() => setShowShiftModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Assign Shift
              </button>
            )}
            {activeTab === 'attendance' && (
              <button
                type="button"
                onClick={() => setShowClockInModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors whitespace-nowrap shrink-0"
              >
                <Clock className="w-3.5 h-3.5" />
                Staff Clock-In
              </button>
            )}
            {activeTab === 'leave' && (
              <button
                type="button"
                onClick={() => setShowLeaveModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Apply for Leave
              </button>
            )}
            {activeTab === 'payroll' && (
              <button
                type="button"
                onClick={() => setShowPayrollModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                New Payroll Run
              </button>
            )}
          </>
        }
      />

      {/* Top KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Workforce"
          value={employees.length}
          helper={`${departments.length} departments`}
          deltaTone="forest"
          icon={Users}
        />
        <KpiCard
          label="Staff On Duty Now"
          value={activeDutyCount}
          helper="Open clock-in punches"
          delta={activeDutyCount > 0 ? 'Shift live' : undefined}
          deltaTone="positive"
          icon={Clock}
        />
        <KpiCard
          label="Pending Leave Requests"
          value={pendingLeavesCount}
          helper={`${leaves.length} total applications`}
          deltaTone={pendingLeavesCount > 0 ? 'warning' : 'positive'}
          icon={Briefcase}
        />
        <KpiCard
          label="Latest Net Payroll"
          value={selectedPeriod ? formatCurrency(selectedPeriod.totalNetPay, currency, currencySymbol) : '—'}
          helper={selectedPeriod ? selectedPeriod.periodName : 'No payroll runs yet'}
          delta={selectedPeriod?.status === 'disbursed' ? 'Disbursed' : selectedPeriod ? 'Draft' : undefined}
          deltaTone={selectedPeriod?.status === 'disbursed' ? 'positive' : 'warning'}
          icon={DollarSign}
        />
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E6EBE7] dark:border-[#22322C] pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#173F35] text-white dark:bg-[#246353]'
                  : 'text-[#78837D] dark:text-[#92A199] hover:bg-[#F1F4F1] dark:hover:bg-[#192622] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D] dark:text-[#92A199]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SHIFT ROSTER & SCHEDULE */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Morning', count: shifts.filter((s) => s.shiftType === 'morning' && (!selectedDate || s.date === selectedDate)).length },
              { label: 'Afternoon', count: shifts.filter((s) => s.shiftType === 'afternoon' && (!selectedDate || s.date === selectedDate)).length },
              { label: 'Night', count: shifts.filter((s) => s.shiftType === 'night' && (!selectedDate || s.date === selectedDate)).length },
              { label: 'Split Shift', count: shifts.filter((s) => s.shiftType === 'split' && (!selectedDate || s.date === selectedDate)).length },
              { label: 'Total Roster', count: shifts.filter((s) => !selectedDate || s.date === selectedDate).length },
            ].map((item) => (
              <div key={item.label} className="seam-surface p-3 text-center">
                <span className="text-[11px] font-medium text-[#78837D] dark:text-[#92A199]">{item.label}</span>
                <div className="text-lg font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] tabular-nums mt-0.5">
                  {item.count}
                </div>
              </div>
            ))}
          </div>

          <DataTable
            data={filteredShifts}
            columns={shiftColumns}
            keyExtractor={(s) => s.id}
            searchPlaceholder="Search staff member or shift type..."
            searchFilter={(s, q) =>
              s.employeeName.toLowerCase().includes(q) || s.shiftType.toLowerCase().includes(q)
            }
            filterToolbar={
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs seam-input font-mono"
                />
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs seam-input"
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate('')}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]"
                  >
                    All Dates
                  </button>
                )}
              </div>
            }
            onExportCsv={handleExportShiftsCsv}
            exportLabel="Export Roster"
            emptyTitle="No shifts scheduled"
            emptyDescription="No shift schedules match the selected date and department filter. Assign a shift to schedule staff."
            emptyAction={
              <button
                type="button"
                onClick={() => setShowShiftModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                Assign Shift
              </button>
            }
          />
        </div>
      )}

      {/* TAB 2: TIME & ATTENDANCE */}
      {activeTab === 'attendance' && (
        <DataTable
          data={attendance}
          columns={attendanceColumns}
          keyExtractor={(a) => a.id}
          searchPlaceholder="Search staff or department..."
          searchFilter={(a, q) =>
            a.employeeName.toLowerCase().includes(q) || a.departmentName.toLowerCase().includes(q)
          }
          emptyTitle="No attendance records yet"
          emptyDescription="Use Staff Clock-In to record shift arrivals and monitor active floor presence."
          emptyAction={
            <button
              type="button"
              onClick={() => setShowClockInModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white"
            >
              <Clock className="w-3.5 h-3.5" />
              Staff Clock-In
            </button>
          }
        />
      )}

      {/* TAB 3: LEAVE APPROVALS */}
      {activeTab === 'leave' && (
        <DataTable
          data={leaves}
          columns={leaveColumns}
          keyExtractor={(l) => l.id}
          searchPlaceholder="Search employee, department, or leave type..."
          searchFilter={(l, q) =>
            l.employeeName.toLowerCase().includes(q) ||
            l.departmentName.toLowerCase().includes(q) ||
            l.leaveType.toLowerCase().includes(q)
          }
          emptyTitle="No leave applications on file"
          emptyDescription="Staff vacation, medical, and compassionate leave requests appear here for manager approval."
          emptyAction={
            <button
              type="button"
              onClick={() => setShowLeaveModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              Submit Leave Application
            </button>
          }
        />
      )}

      {/* TAB 4: HOSPITALITY PAYROLL & 10% SERVICE CHARGE */}
      {activeTab === 'payroll' && (
        <div className="space-y-5">
          <VerificationNotice />
          <div className="seam-surface p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F1F4F1] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B] flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                    {selectedPeriod?.periodName || 'Monthly Payroll'}
                  </h3>
                  {selectedPeriod && (
                    <StatusBadge
                      label={selectedPeriod.status}
                      tone={selectedPeriod.status === 'disbursed' ? 'success' : 'warning'}
                    />
                  )}
                </div>
                <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-0.5">
                  {selectedPeriod
                    ? `Pay Cycle: ${selectedPeriod.startDate} to ${selectedPeriod.endDate} · ${selectedPeriod.eligibleStaffCount} Eligible Staff`
                    : 'Generate a payroll run to calculate base pay, 10% service charge shares, and statutory deductions.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {payrollPeriods.length > 0 && (
                <select
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="px-3 py-2 text-xs font-medium seam-input"
                >
                  {payrollPeriods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.periodName} ({p.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              )}

              {selectedPeriod?.status === 'draft' && (
                <button
                  type="button"
                  onClick={() => handleDisbursePayroll(selectedPeriod)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors whitespace-nowrap shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Authorize &amp; Disburse
                </button>
              )}
            </div>
          </div>

          {selectedPeriod && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Gross Base & Overtime"
                value={formatCurrency(selectedPeriod.totalGrossWages, currency, currencySymbol)}
                helper="Fixed contract wages"
                icon={DollarSign}
              />
              <KpiCard
                label="10% Service Charge Pool"
                value={formatCurrency(selectedPeriod.totalServiceChargePool, currency, currencySymbol)}
                helper={`${formatCurrency(Math.round(selectedPeriod.totalServiceChargePool / Math.max(1, selectedPeriod.eligibleStaffCount)), currency, currencySymbol)}/staff`}
                delta="Equal share"
                deltaTone="positive"
                icon={Sparkles}
              />
              <KpiCard
                label="Tax & Pension Deductions"
                value={formatCurrency(
                  selectedPeriod.totalTaxDeductions + selectedPeriod.totalPensionDeductions,
                  currency,
                  currencySymbol
                )}
                helper={`Income tax + ${Math.round(TAX_AND_PAYROLL_CONFIG.pension.employeeRate * 100)}% EE (${Math.round(TAX_AND_PAYROLL_CONFIG.pension.employerRate * 100)}% ER)`}
                icon={Briefcase}
              />
              <KpiCard
                label="Net Disbursed Payout"
                value={formatCurrency(selectedPeriod.totalNetPay, currency, currencySymbol)}
                helper={selectedPeriod.approvedBy ? `Approved by ${selectedPeriod.approvedBy}` : 'Pending sign-off'}
                deltaTone="forest"
                icon={CheckCircle2}
              />
            </div>
          )}

          <DataTable
            data={payrollItems}
            columns={payrollColumns}
            keyExtractor={(i) => i.id}
            searchPlaceholder="Search employee or department..."
            searchFilter={(i, q) =>
              i.employeeName.toLowerCase().includes(q) ||
              i.departmentName.toLowerCase().includes(q) ||
              i.designation.toLowerCase().includes(q)
            }
            onExportCsv={handleExportPayrollCsv}
            exportLabel="Export Payroll CSV"
            emptyTitle="No payroll items for this cycle"
            emptyDescription="Create a new payroll run to calculate staff salaries, service charge distribution, and payslips."
            emptyAction={
              <button
                type="button"
                onClick={() => setShowPayrollModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                New Payroll Run
              </button>
            }
          />
        </div>
      )}

      {/* MODAL: ASSIGN SHIFT */}
      <Modal
        open={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        title="Assign Staff Shift Schedule"
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleCreateShift} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Employee *</label>
            <select
              required
              value={shiftForm.employeeId}
              onChange={(e) => setShiftForm({ ...shiftForm, employeeId: e.target.value })}
              className="w-full px-3 py-2 text-xs seam-input"
            >
              <option value="">Select Employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.departmentName} - {emp.position})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Shift Category</label>
              <select
                value={shiftForm.shiftType}
                onChange={(e) => {
                  const type = e.target.value as ShiftType;
                  let start = '07:00';
                  let end = '15:30';
                  if (type === 'afternoon') {
                    start = '15:00';
                    end = '23:30';
                  } else if (type === 'night') {
                    start = '23:00';
                    end = '07:30';
                  } else if (type === 'split') {
                    start = '11:00';
                    end = '22:00';
                  } else if (type === 'off') {
                    start = '00:00';
                    end = '00:00';
                  }
                  setShiftForm({ ...shiftForm, shiftType: type, startTime: start, endTime: end });
                }}
                className="w-full px-3 py-2 text-xs seam-input"
              >
                <option value="morning">Morning (07:00 – 15:30)</option>
                <option value="afternoon">Afternoon (15:00 – 23:30)</option>
                <option value="night">Night (23:00 – 07:30)</option>
                <option value="split">Split Shift</option>
                <option value="off">Off Day</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Date</label>
              <input
                type="date"
                required
                value={shiftForm.date}
                onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Start Time</label>
              <input
                type="time"
                required
                value={shiftForm.startTime}
                onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">End Time</label>
              <input
                type="time"
                required
                value={shiftForm.endTime}
                onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Duties / Shift Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. VIP floor inspection, conference coffee break lead"
              value={shiftForm.notes}
              onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs seam-input"
            />
          </div>

          <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowShiftModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white"
            >
              Confirm Shift
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: STAFF CLOCK-IN */}
      <Modal
        open={showClockInModal}
        onClose={() => setShowClockInModal(false)}
        title="Digital Attendance Punch"
        maxWidthClass="max-w-sm"
      >
        <form onSubmit={handleClockIn} className="space-y-4 text-xs">
          <div className="seam-surface-subtle p-3.5 text-center">
            <span className="text-[10px] font-medium text-[#78837D] dark:text-[#92A199] uppercase">
              Current Terminal Time
            </span>
            <div className="text-xl font-mono font-semibold text-[#173F35] dark:text-[#C6A15B] tabular-nums mt-0.5">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Select Staff Member *
            </label>
            <select
              required
              value={clockInEmployeeId}
              onChange={(e) => setClockInEmployeeId(e.target.value)}
              className="w-full px-3 py-2 text-xs seam-input"
            >
              <option value="">Select Employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.departmentName})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowClockInModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white"
            >
              Record Punch-In
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: SUBMIT LEAVE APPLICATION */}
      <Modal
        open={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Submit Leave Application"
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleCreateLeave} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Staff Member *</label>
            <select
              required
              value={leaveForm.employeeId}
              onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
              className="w-full px-3 py-2 text-xs seam-input"
            >
              <option value="">Select Employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.departmentName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Leave Category</label>
              <select
                value={leaveForm.leaveType}
                onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as LeaveType })}
                className="w-full px-3 py-2 text-xs seam-input"
              >
                <option value="annual">Annual Paid Leave</option>
                <option value="sick">Medical / Sick Leave</option>
                <option value="compassionate">Compassionate / Family</option>
                <option value="maternity">Maternity Leave</option>
                <option value="paternity">Paternity Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Total Days</label>
              <input
                type="number"
                min={1}
                max={60}
                required
                value={leaveForm.daysCount}
                onChange={(e) => setLeaveForm({ ...leaveForm, daysCount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Start Date</label>
              <input
                type="date"
                required
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">End Date</label>
              <input
                type="date"
                required
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Reason / Notes *</label>
            <textarea
              rows={2}
              required
              placeholder="Detail the reason for requested leave..."
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              className="w-full px-3 py-2 text-xs seam-input"
            />
          </div>

          <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowLeaveModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white"
            >
              Submit Application
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: NEW PAYROLL RUN */}
      <Modal
        open={showPayrollModal}
        onClose={() => setShowPayrollModal(false)}
        title="Generate Monthly Payroll Run"
        subtitle="Calculates base salaries, equal 10% service charge shares, pension, and tax withholding."
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleGeneratePayroll} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Payroll Cycle Name</label>
            <input
              type="text"
              required
              value={payrollForm.periodName}
              onChange={(e) => setPayrollForm({ ...payrollForm, periodName: e.target.value })}
              className="w-full px-3 py-2 text-xs seam-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Start Date</label>
              <input
                type="date"
                required
                value={payrollForm.startDate}
                onChange={(e) => setPayrollForm({ ...payrollForm, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">End Date</label>
              <input
                type="date"
                required
                value={payrollForm.endDate}
                onChange={(e) => setPayrollForm({ ...payrollForm, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              10% Service Charge Pool ({currency})
            </label>
            <input
              type="number"
              min={0}
              step={1000}
              required
              value={payrollForm.serviceChargePool}
              onChange={(e) => setPayrollForm({ ...payrollForm, serviceChargePool: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs seam-input font-mono font-semibold"
            />
            <p className="text-[11px] text-[#78837D] dark:text-[#92A199] mt-1">
              Collected surcharge pool will be distributed equally across active operational staff.
            </p>
          </div>

          <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowPayrollModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white"
            >
              Generate Payroll Run
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: INDIVIDUAL PAYSLIP VIEW */}
      <Modal
        open={Boolean(selectedPayslipItem)}
        onClose={() => setSelectedPayslipItem(null)}
        title={selectedPayslipItem ? `Confidential Payslip — ${selectedPayslipItem.employeeName}` : 'Payslip'}
        subtitle={
          selectedPayslipItem
            ? `${activeHotel?.name || 'Property'} · ${selectedPayslipItem.designation} · ${selectedPayslipItem.departmentName}`
            : undefined
        }
        maxWidthClass="max-w-lg"
        footer={
          <button
            type="button"
            onClick={() => setSelectedPayslipItem(null)}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white"
          >
            Close Payslip
          </button>
        }
      >
        {selectedPayslipItem && (
          <div className="space-y-4 text-xs">
            <div>
              <h4 className="text-[11px] font-semibold text-[#78837D] dark:text-[#92A199] uppercase tracking-wider mb-2">
                1. Gross Earnings
              </h4>
              <div className="rounded-lg border border-[#E6EBE7] dark:border-[#22322C] divide-y divide-[#E6EBE7] dark:divide-[#22322C] font-mono tabular-nums">
                <div className="p-2.5 flex justify-between">
                  <span className="font-sans text-[#78837D] dark:text-[#92A199]">Contract Base Salary</span>
                  <span className="font-semibold">
                    {formatCurrency(selectedPayslipItem.baseSalary, currency, currencySymbol)}
                  </span>
                </div>
                <div className="p-2.5 flex justify-between bg-[#F1F4F1] dark:bg-[#192622] text-[#173F35] dark:text-[#C6A15B] font-semibold">
                  <span className="font-sans">10% Service Charge Share</span>
                  <span>+{formatCurrency(selectedPayslipItem.serviceChargeShare, currency, currencySymbol)}</span>
                </div>
                <div className="p-2.5 flex justify-between">
                  <span className="font-sans text-[#78837D] dark:text-[#92A199]">Overtime Allowance</span>
                  <span>+{formatCurrency(selectedPayslipItem.overtimePay, currency, currencySymbol)}</span>
                </div>
                <div className="p-2.5 flex justify-between">
                  <span className="font-sans text-[#78837D] dark:text-[#92A199]">Bonuses / Commission</span>
                  <span>+{formatCurrency(selectedPayslipItem.bonuses, currency, currencySymbol)}</span>
                </div>
                <div className="p-2.5 flex justify-between bg-[#F6F8F6] dark:bg-[#192622]/70 font-semibold">
                  <span className="font-sans">Total Gross Pay</span>
                  <span>{formatCurrency(selectedPayslipItem.grossPay, currency, currencySymbol)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold text-[#78837D] dark:text-[#92A199] uppercase tracking-wider mb-2">
                2. Statutory Deductions
              </h4>
              <div className="rounded-lg border border-[#E6EBE7] dark:border-[#22322C] divide-y divide-[#E6EBE7] dark:divide-[#22322C] font-mono tabular-nums">
                <div className="p-2.5 flex justify-between">
                  <span className="font-sans text-[#78837D] dark:text-[#92A199]">Employee Pension (7%)</span>
                  <span className="text-rose-600 dark:text-rose-400">
                    -{formatCurrency(selectedPayslipItem.pensionEmployee, currency, currencySymbol)}
                  </span>
                </div>
                <div className="p-2.5 flex justify-between">
                  <span className="font-sans text-[#78837D] dark:text-[#92A199]">Income Tax Withholding</span>
                  <span className="text-rose-600 dark:text-rose-400">
                    -{formatCurrency(selectedPayslipItem.incomeTax, currency, currencySymbol)}
                  </span>
                </div>
                <div className="p-2.5 flex justify-between bg-[#F6F8F6] dark:bg-[#192622]/70 font-semibold">
                  <span className="font-sans">Total Deductions</span>
                  <span className="text-rose-600 dark:text-rose-400">
                    -{formatCurrency(selectedPayslipItem.pensionEmployee + selectedPayslipItem.incomeTax, currency, currencySymbol)}
                  </span>
                </div>
              </div>
            </div>

            <div className="seam-surface-subtle p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-[#78837D] dark:text-[#92A199] uppercase">
                  Net Take-Home Pay
                </span>
                <div className="text-xl font-mono font-semibold text-[#173F35] dark:text-[#C6A15B] tabular-nums mt-0.5">
                  {formatCurrency(selectedPayslipItem.netPay, currency, currencySymbol)}
                </div>
              </div>
              <StatusBadge
                label={selectedPayslipItem.status}
                tone={selectedPayslipItem.status === 'paid' ? 'success' : 'warning'}
              />
            </div>

            <div className="text-[11px] text-[#78837D] dark:text-[#92A199] flex justify-between px-1">
              <span>Employer Pension Contribution ({Math.round(TAX_AND_PAYROLL_CONFIG.pension.employerRate * 100)}%):</span>
              <span className="font-mono tabular-nums">
                {formatCurrency(selectedPayslipItem.pensionEmployer, currency, currencySymbol)}
              </span>
            </div>

            <VerificationNotice />
          </div>
        )}
      </Modal>
    </div>
  );
};
