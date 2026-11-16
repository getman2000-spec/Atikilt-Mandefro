/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Housekeeping Operations Board, Turnover Workflow & Minibar Folio Billing
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { HousekeepingTask, Employee } from '../../types/saas';
import { PageHeader, KpiCard, StatusBadge, Modal, EmptyState, SampleDataBadge } from '../ui';
import {
  Sparkles,
  CheckCircle2,
  Wrench,
  Clock,
  User,
  Check,
  Search,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const HousekeepingBoard: React.FC = () => {
  const { activeHotel, user } = useAuth();
  const { toast } = useToast();
  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings.currency || 'ETB';

  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [floorFilter, setFloorFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'dirty' | 'in_progress' | 'clean' | 'inspected'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [completingTask, setCompletingTask] = useState<HousekeepingTask | null>(null);
  const [completeForm, setCompleteForm] = useState({
    linenReplaced: true,
    minibarRestocked: false,
    minibarItemsCount: 0,
    minibarChargeAmount: 0,
    notes: '',
  });

  const [maintenanceTask, setMaintenanceTask] = useState<HousekeepingTask | null>(null);
  const [maintenanceIssue, setMaintenanceIssue] = useState('');

  const rooms = useMemo(() => (hotelId ? saasStorage.getRooms(hotelId) : []), [hotelId]);
  const employees = useMemo(() => (hotelId ? saasStorage.getEmployees(hotelId) : []), [hotelId]);

  const maids = useMemo(
    () =>
      employees.filter(
        (e) =>
          e.departmentName.toLowerCase().includes('housekeeping') ||
          e.departmentId.toLowerCase().includes('hk')
      ),
    [employees]
  );

  const refreshTasks = () => {
    if (!hotelId) return;
    setTasks(saasStorage.getHousekeepingTasks(hotelId));
  };

  useEffect(() => {
    refreshTasks();
    setFloorFilter('all');
  }, [hotelId]);

  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);

  const filteredTasks = tasks.filter((t) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      t.roomNumber.toLowerCase().includes(q) ||
      t.roomTypeName.toLowerCase().includes(q) ||
      (t.assignedStaffName && t.assignedStaffName.toLowerCase().includes(q));
    const matchFloor = floorFilter === 'all' || t.floor === floorFilter;
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchFloor && matchStatus;
  });

  const stats = {
    dirty: tasks.filter((t) => t.status === 'dirty').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    clean: tasks.filter((t) => t.status === 'clean').length,
    inspected: tasks.filter((t) => t.status === 'inspected').length,
    maintenance: rooms.filter((r) => r.status === 'maintenance' || r.status === 'out_of_order').length,
  };

  if (!activeHotel) return null;

  const actor = {
    email: user?.email || 'hk.supervisor@hotel.com',
    fullName: user?.fullName || 'Housekeeping Lead',
    role: user?.role || 'supervisor',
  };

  const handleStartCleaning = (task: HousekeepingTask, staffMember?: Employee) => {
    const assignedMaid = staffMember || maids[0] || { id: 'emp_maid', fullName: 'Housekeeping Attendant' };
    saasStorage.updateHousekeepingStatus(task.id, 'in_progress', actor, {
      staffId: assignedMaid.id,
      staffName: assignedMaid.fullName,
    });
    refreshTasks();
    toast(`Room ${task.roomNumber} assigned to ${assignedMaid.fullName}`, { variant: 'info' });
  };

  const handleOpenCompleteModal = (task: HousekeepingTask) => {
    setCompletingTask(task);
    setCompleteForm({
      linenReplaced: true,
      minibarRestocked: false,
      minibarItemsCount: 0,
      minibarChargeAmount: 0,
      notes: '',
    });
  };

  const handleConfirmComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTask) return;

    saasStorage.updateHousekeepingStatus(completingTask.id, 'clean', actor, {
      linenReplaced: completeForm.linenReplaced,
      minibarRestocked: completeForm.minibarRestocked,
      minibarItemsCount: completeForm.minibarRestocked ? completeForm.minibarItemsCount : 0,
      minibarChargeAmount: completeForm.minibarRestocked ? completeForm.minibarChargeAmount : 0,
      notes: completeForm.notes || undefined,
    });

    toast(`Room ${completingTask.roomNumber} marked clean & awaiting supervisor release`, { variant: 'success' });
    refreshTasks();
    setCompletingTask(null);
  };

  const handleInspectAndRelease = (task: HousekeepingTask) => {
    saasStorage.updateHousekeepingStatus(task.id, 'inspected', {
      ...actor,
      fullName: user?.fullName || 'Executive Housekeeper',
    });
    refreshTasks();
    toast(`Room ${task.roomNumber} inspected and released to Front Desk inventory`, { variant: 'success' });
  };

  const handleReportDefect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceTask || !maintenanceIssue) return;

    saasStorage.updateHousekeepingStatus(maintenanceTask.id, 'dirty', actor, {
      maintenanceIssue,
    });

    toast(`Maintenance defect logged for Room ${maintenanceTask.roomNumber}`, { variant: 'warning' });
    refreshTasks();
    setMaintenanceTask(null);
    setMaintenanceIssue('');
  };

  const getStatusBadge = (status: HousekeepingTask['status']) => {
    switch (status) {
      case 'dirty':
        return <StatusBadge label="Dirty" tone="warning" />;
      case 'in_progress':
        return <StatusBadge label="In Progress" tone="forest" />;
      case 'clean':
        return <StatusBadge label="Cleaned" tone="success" />;
      case 'inspected':
        return <StatusBadge label="Inspected" tone="success" />;
      default:
        return <StatusBadge label={status} tone="neutral" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Operations', 'Daily Operations', 'Housekeeping']}
        title="Housekeeping Operations Board"
        subtitle={`${activeHotel.name} · Room turnover workflow, attendant dispatch, minibar restock, and supervisor release.`}
        meta={<SampleDataBadge />}
        actions={
          <button
            onClick={refreshTasks}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] font-semibold text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Board</span>
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <KpiCard
          label="Dirty / Turnover"
          value={stats.dirty}
          helper="Needs cleaning"
          deltaTone={stats.dirty > 0 ? 'warning' : 'neutral'}
        />
        <KpiCard
          label="In Progress"
          value={stats.inProgress}
          helper="Attendant on site"
          deltaTone="forest"
        />
        <KpiCard
          label="Cleaned"
          value={stats.clean}
          helper="Pending inspection"
          deltaTone="positive"
        />
        <KpiCard
          label="Inspected (Ready)"
          value={stats.inspected}
          helper="Front desk ready"
          deltaTone="positive"
        />
        <KpiCard
          label="Maintenance Block"
          value={stats.maintenance}
          helper="Out of order"
          deltaTone={stats.maintenance > 0 ? 'critical' : 'neutral'}
          icon={Wrench}
        />
      </div>

      {/* Filter Toolbar */}
      <div className="seam-surface p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-[#78837D] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search Room #, Type, Attendant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="seam-input w-full pl-8"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#F6F8F6] dark:bg-[#192622] p-1 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C]">
            <span className="px-2 text-[11px] font-medium text-[#78837D]">Floor:</span>
            <button
              onClick={() => setFloorFilter('all')}
              className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors ${
                floorFilter === 'all'
                  ? 'bg-[#173F35] text-white'
                  : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
              }`}
            >
              All
            </button>
            {floors.map((fl) => (
              <button
                key={fl}
                onClick={() => setFloorFilter(fl)}
                className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors ${
                  floorFilter === fl
                    ? 'bg-[#173F35] text-white'
                    : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
                }`}
              >
                F{fl}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="seam-input"
          >
            <option value="all">All Turnover Stages</option>
            <option value="dirty">Dirty (Turnover)</option>
            <option value="in_progress">In Progress</option>
            <option value="clean">Clean (Pending Audit)</option>
            <option value="inspected">Inspected (Released)</option>
          </select>
        </div>

        <div className="text-xs text-[#78837D] shrink-0 font-mono tabular-nums">
          <strong className="text-[#202B27] dark:text-[#ECF1EE]">{filteredTasks.length}</strong> active tasks
        </div>
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          title="No housekeeping tasks match filters"
          description="Try clearing the floor or status filter to inspect all room turnovers."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const isDirty = task.status === 'dirty';
            const isInProgress = task.status === 'in_progress';
            const isClean = task.status === 'clean';
            const isInspected = task.status === 'inspected';

            return (
              <div
                key={task.id}
                className="seam-surface p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold text-[#202B27] dark:text-[#ECF1EE] tabular-nums">
                          Room {task.roomNumber}
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-[6px] bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#78837D]">
                          Floor {task.floor}
                        </span>
                      </div>
                      <span className="text-xs text-[#78837D] block mt-0.5">{task.roomTypeName}</span>
                    </div>

                    {getStatusBadge(task.status)}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#E6EBE7] dark:border-[#22322C] space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#78837D]">
                      <span>Turnover Type:</span>
                      <span className="font-medium text-[#202B27] dark:text-[#ECF1EE] capitalize">
                        {task.cleaningType.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex justify-between text-[#78837D]">
                      <span>Priority Level:</span>
                      <span
                        className={`font-semibold capitalize ${
                          task.priority === 'high'
                            ? 'text-[#B6463D] dark:text-[#E27A71]'
                            : 'text-[#202B27] dark:text-[#ECF1EE]'
                        }`}
                      >
                        {task.priority} Priority
                      </span>
                    </div>

                    <div className="flex justify-between text-[#78837D]">
                      <span>Attendant:</span>
                      <span className="font-medium text-[#173F35] dark:text-[#C6A15B] flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>{task.assignedStaffName || 'Unassigned'}</span>
                      </span>
                    </div>

                    {task.notes && (
                      <div className="p-2 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-[8px] text-[11px] text-[#78837D] mt-2">
                        {task.notes}
                      </div>
                    )}

                    {task.maintenanceIssue && (
                      <div className="p-2 bg-[#FDF2F2] dark:bg-[#2E1616] border border-[#F2C7C5] dark:border-[#4F2625] rounded-[8px] text-[11px] text-[#B6463D] dark:text-[#E27A71] flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 shrink-0" />
                        <span>Defect: {task.maintenanceIssue}</span>
                      </div>
                    )}

                    {task.inspectedBy && (
                      <div className="flex items-center gap-1 text-[11px] text-[#2F6B48] dark:text-[#66A881] font-medium pt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Released by {task.inspectedBy}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setMaintenanceTask(task);
                      setMaintenanceIssue('');
                    }}
                    className="px-2 py-1 text-[11px] text-[#78837D] hover:text-[#B6463D] flex items-center gap-1"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>Defect</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {isDirty && (
                      <button
                        onClick={() => handleStartCleaning(task)}
                        className="px-3 py-1.5 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold text-xs flex items-center gap-1"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Start Cleaning</span>
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        onClick={() => handleOpenCompleteModal(task)}
                        className="px-3 py-1.5 rounded-[8px] bg-[#2F6B48] hover:bg-[#25573A] text-white font-semibold text-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Finish &amp; Restock</span>
                      </button>
                    )}

                    {isClean && (
                      <button
                        onClick={() => handleInspectAndRelease(task)}
                        className="px-3 py-1.5 rounded-[8px] bg-[#C6A15B] hover:bg-[#B28D49] text-[#173F35] font-semibold text-xs flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Release Room</span>
                      </button>
                    )}

                    {isInspected && (
                      <span className="text-[11px] text-[#2F6B48] dark:text-[#66A881] font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Ready for Guest</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: FINISH CLEANING & MINIBAR RESTOCK */}
      <Modal
        open={Boolean(completingTask)}
        onClose={() => setCompletingTask(null)}
        title={completingTask ? `Turnover Sign-Off · Room ${completingTask.roomNumber}` : 'Turnover Sign-Off'}
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleConfirmComplete} className="space-y-3.5 text-xs">
          <label className="p-3 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-[10px] flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block">
                Bed Linen &amp; Towels Replaced
              </span>
              <span className="text-[11px] text-[#78837D]">
                Fresh duvet cover, pillowcases, and sanitization completed.
              </span>
            </div>
            <input
              type="checkbox"
              checked={completeForm.linenReplaced}
              onChange={(e) =>
                setCompleteForm({ ...completeForm, linenReplaced: e.target.checked })
              }
              className="rounded accent-[#173F35] w-4 h-4"
            />
          </label>

          <div className="p-3 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-[10px] space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block">
                  Minibar Restocked &amp; Charged
                </span>
                <span className="text-[11px] text-[#78837D]">
                  Post consumed beverages or snacks directly to guest folio.
                </span>
              </div>
              <input
                type="checkbox"
                checked={completeForm.minibarRestocked}
                onChange={(e) =>
                  setCompleteForm({ ...completeForm, minibarRestocked: e.target.checked })
                }
                className="rounded accent-[#173F35] w-4 h-4"
              />
            </label>

            {completeForm.minibarRestocked && (
              <div className="pt-2.5 border-t border-[#E6EBE7] dark:border-[#22322C] grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                    Consumed Items
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={completeForm.minibarItemsCount}
                    onChange={(e) =>
                      setCompleteForm({
                        ...completeForm,
                        minibarItemsCount: parseInt(e.target.value) || 1,
                      })
                    }
                    className="seam-input w-full font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                    Charge ({currency})
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="50"
                    value={completeForm.minibarChargeAmount}
                    onChange={(e) =>
                      setCompleteForm({
                        ...completeForm,
                        minibarChargeAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="seam-input w-full font-mono tabular-nums font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Housekeeper Cleaning Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Extra blanket provided in wardrobe"
              value={completeForm.notes}
              onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })}
              className="seam-input w-full"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setCompletingTask(null)}
              className="px-3.5 py-1.5 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Confirm Room Cleaned</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: REPORT MAINTENANCE DEFECT */}
      <Modal
        open={Boolean(maintenanceTask)}
        onClose={() => setMaintenanceTask(null)}
        title={maintenanceTask ? `Report Defect · Room ${maintenanceTask.roomNumber}` : 'Report Defect'}
        maxWidthClass="max-w-sm"
      >
        <form onSubmit={handleReportDefect} className="space-y-3 text-xs">
          <p className="text-[#78837D]">
            Flagging a maintenance issue removes this room from available Front Desk inventory until resolved.
          </p>

          <div>
            <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Defect Description *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. AC unit not cooling, water leak in bathroom."
              value={maintenanceIssue}
              onChange={(e) => setMaintenanceIssue(e.target.value)}
              className="seam-input w-full"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setMaintenanceTask(null)}
              className="px-3 py-1.5 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-[8px] bg-[#B6463D] hover:bg-[#9C3A32] text-white font-semibold"
            >
              Flag for Maintenance
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
