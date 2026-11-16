import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio,
  Clock,
  CheckCircle2,
  Send,
  MessageSquare,
  Search,
  Plus,
  RefreshCw,
  BellRing,
  ShieldAlert,
  ArrowRight,
  Pin,
  Eye,
  Check,
  UserCheck,
} from 'lucide-react';
import { CurrentUser } from '../../context/AuthContext';
import { saasStorage } from '../../services/storage';
import {
  Hotel,
  ShiftHandoverEntry,
  RapidServiceTask,
  StaffBroadcastAlert,
  RapidTaskDepartment,
  RapidTaskPriority,
  RapidTaskStatus,
  HandoverShiftType,
  HandoverLogCategory,
  HandoverPriority,
} from '../../types/saas';
import { useToast } from '../../context/ToastContext';
import {
  PageHeader,
  KpiCard,
  StatusBadge,
  EmptyState,
  Modal,
  SampleDataBadge,
} from '../ui';

interface StaffHandoverAndDispatchHubProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

export const StaffHandoverAndDispatchHub: React.FC<StaffHandoverAndDispatchHubProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();
  const hotelId = activeHotel?.id || '';

  const [activeTab, setActiveTab] = useState<'rapid_dispatch' | 'shift_handover' | 'broadcast_bulletin'>('rapid_dispatch');
  const [tasks, setTasks] = useState<RapidServiceTask[]>([]);
  const [handovers, setHandovers] = useState<ShiftHandoverEntry[]>([]);
  const [broadcasts, setBroadcasts] = useState<StaffBroadcastAlert[]>([]);

  // Filters
  const [taskDeptFilter, setTaskDeptFilter] = useState<string>('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('all');
  const [handoverShiftFilter, setHandoverShiftFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showNewTaskModal, setShowNewTaskModal] = useState<boolean>(false);
  const [showNewHandoverModal, setShowNewHandoverModal] = useState<boolean>(false);
  const [showNewBroadcastModal, setShowNewBroadcastModal] = useState<boolean>(false);

  // New Rapid Task Form State
  const [newTask, setNewTask] = useState({
    roomNumber: '',
    guestName: '',
    targetDepartment: 'housekeeping' as RapidTaskDepartment,
    taskDescription: '',
    priority: 'high_20m' as RapidTaskPriority,
    slaMinutes: 20,
    assignedRunner: '',
  });

  // New Handover Form State
  const [newHandover, setNewHandover] = useState({
    shift: 'morning' as HandoverShiftType,
    category: 'vip_movement' as HandoverLogCategory,
    priority: 'high_attention' as HandoverPriority,
    roomNumber: '',
    subject: '',
    description: '',
    actionRequired: '',
    outgoingSupervisor: currentUser?.fullName || 'Duty Supervisor',
  });

  // New Broadcast Form State
  const [newBroadcast, setNewBroadcast] = useState({
    title: '',
    message: '',
    category: 'operations' as 'operations' | 'security' | 'vip_protocol' | 'weather_alert',
    targetAudience: 'All Departments',
    isPinned: false,
  });

  const loadData = useCallback(() => {
    if (!hotelId) {
      setTasks([]);
      setHandovers([]);
      setBroadcasts([]);
      return;
    }
    setTasks(saasStorage.getRapidServiceTasks(hotelId));
    setHandovers(saasStorage.getShiftHandovers(hotelId));
    setBroadcasts(saasStorage.getStaffBroadcastAlerts(hotelId));
  }, [hotelId]);

  useEffect(() => {
    setTaskDeptFilter('all');
    setTaskStatusFilter('all');
    setHandoverShiftFilter('all');
    setSearchQuery('');
    setShowNewTaskModal(false);
    setShowNewHandoverModal(false);
    setShowNewBroadcastModal(false);
    loadData();
  }, [hotelId, loadData]);

  // Handlers for Rapid Tasks
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    if (!newTask.roomNumber.trim() || !newTask.taskDescription.trim()) {
      toast('Missing required task fields', {
        description: 'Enter both a Room Number and Task Description.',
        variant: 'warning',
      });
      return;
    }

    const created = saasStorage.dispatchRapidTask(
      {
        hotelId,
        roomNumber: newTask.roomNumber.trim(),
        guestName: newTask.guestName.trim() || undefined,
        targetDepartment: newTask.targetDepartment,
        taskDescription: newTask.taskDescription.trim(),
        priority: newTask.priority,
        slaMinutes: newTask.slaMinutes,
        dispatchedBy: currentUser?.fullName || 'Front Desk',
        assignedRunner: newTask.assignedRunner.trim() || undefined,
      },
      currentUser?.fullName || 'Front Desk'
    );

    if (created) {
      loadData();
      setShowNewTaskModal(false);
      setNewTask({
        roomNumber: '',
        guestName: '',
        targetDepartment: 'housekeeping',
        taskDescription: '',
        priority: 'high_20m',
        slaMinutes: 20,
        assignedRunner: '',
      });
      toast(`Rapid task ${created.taskCode} dispatched`, {
        description: `Assigned to ${created.targetDepartment.replace(/_/g, ' ')} (${created.slaMinutes}m SLA).`,
        variant: 'success',
      });
    }
  };

  const handleUpdateTaskStatus = (taskId: string, nextStatus: RapidTaskStatus) => {
    saasStorage.updateRapidTaskStatus(
      taskId,
      nextStatus,
      nextStatus === 'completed' ? 'Item delivered & verified by guest' : undefined,
      currentUser?.fullName,
      currentUser?.fullName || 'Staff'
    );
    loadData();
    toast(`Task status updated`, {
      description: `Status moved to ${nextStatus.replace(/_/g, ' ')}.`,
      variant: nextStatus === 'completed' || nextStatus === 'verified' ? 'success' : 'info',
    });
  };

  // Handlers for Shift Handover
  const handleCreateHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    if (!newHandover.subject.trim() || !newHandover.description.trim() || !newHandover.actionRequired.trim()) {
      toast('Missing handover details', {
        description: 'Complete Subject, Situation Description, and Required Action.',
        variant: 'warning',
      });
      return;
    }

    const created = saasStorage.addShiftHandover(
      {
        hotelId,
        date: new Date().toISOString().slice(0, 10),
        shift: newHandover.shift,
        outgoingSupervisor: newHandover.outgoingSupervisor,
        category: newHandover.category,
        priority: newHandover.priority,
        roomNumber: newHandover.roomNumber.trim() || undefined,
        subject: newHandover.subject.trim(),
        description: newHandover.description.trim(),
        actionRequired: newHandover.actionRequired.trim(),
      },
      currentUser?.fullName || 'Supervisor'
    );

    if (created) {
      loadData();
      setShowNewHandoverModal(false);
      setNewHandover({
        shift: 'morning',
        category: 'vip_movement',
        priority: 'high_attention',
        roomNumber: '',
        subject: '',
        description: '',
        actionRequired: '',
        outgoingSupervisor: currentUser?.fullName || 'Duty Supervisor',
      });
      toast('Shift handover logged', {
        description: `Recorded for ${created.shift} shift sign-off.`,
        variant: 'success',
      });
    }
  };

  const handleAcknowledgeHandover = (entryId: string) => {
    saasStorage.acknowledgeShiftHandover(
      entryId,
      currentUser?.fullName || 'Incoming Duty Manager',
      currentUser?.fullName || 'Duty Manager'
    );
    loadData();
    toast('Handover entry acknowledged', { variant: 'info' });
  };

  const handleResolveHandover = (entryId: string) => {
    saasStorage.resolveShiftHandover(entryId, currentUser?.fullName || 'Duty Manager');
    loadData();
    toast('Handover action resolved', { variant: 'success' });
  };

  // Handlers for Broadcasts
  const handleCreateBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    if (!newBroadcast.title.trim() || !newBroadcast.message.trim()) {
      toast('Missing broadcast content', {
        description: 'Provide both a Broadcast Title and Message.',
        variant: 'warning',
      });
      return;
    }

    const created = saasStorage.createStaffBroadcast(
      {
        hotelId,
        title: newBroadcast.title.trim(),
        message: newBroadcast.message.trim(),
        category: newBroadcast.category,
        senderName: currentUser?.fullName || 'Executive Office',
        senderRole: currentUser?.role?.replace(/_/g, ' ') || 'Duty Manager',
        targetAudience: newBroadcast.targetAudience,
        isPinned: newBroadcast.isPinned,
      },
      currentUser?.fullName || 'Executive'
    );

    if (created) {
      loadData();
      setShowNewBroadcastModal(false);
      setNewBroadcast({
        title: '',
        message: '',
        category: 'operations',
        targetAudience: 'All Departments',
        isPinned: false,
      });
      toast('Broadcast published', {
        description: `"${created.title}" sent to ${created.targetAudience}.`,
        variant: 'success',
      });
    }
  };

  const handleAcknowledgeBroadcast = (alertId: string) => {
    saasStorage.acknowledgeBroadcast(alertId);
    loadData();
    toast('Broadcast read receipt recorded', { variant: 'info' });
  };

  // Filtered Lists
  const filteredTasks = tasks.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesDept = taskDeptFilter === 'all' || t.targetDepartment === taskDeptFilter;
    const matchesStatus = taskStatusFilter === 'all' || t.status === taskStatusFilter;
    const matchesSearch =
      !q ||
      t.taskCode.toLowerCase().includes(q) ||
      t.roomNumber.toLowerCase().includes(q) ||
      t.taskDescription.toLowerCase().includes(q) ||
      (t.guestName && t.guestName.toLowerCase().includes(q));
    return matchesDept && matchesStatus && matchesSearch;
  });

  const filteredHandovers = handovers.filter((h) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesShift = handoverShiftFilter === 'all' || h.shift === handoverShiftFilter;
    const matchesSearch =
      !q ||
      h.subject.toLowerCase().includes(q) ||
      h.description.toLowerCase().includes(q) ||
      (h.roomNumber && h.roomNumber.toLowerCase().includes(q));
    return matchesShift && matchesSearch;
  });

  // Metrics
  const activeTasksCount = tasks.filter((t) => t.status !== 'completed' && t.status !== 'verified').length;
  const urgentTasksCount = tasks.filter((t) => t.priority === 'urgent_10m' && t.status !== 'completed' && t.status !== 'verified').length;
  const pendingHandoversCount = handovers.filter((h) => h.status !== 'resolved').length;

  const tabs = [
    { id: 'rapid_dispatch' as const, label: 'Rapid Service Dispatch', count: tasks.length, icon: Send },
    { id: 'shift_handover' as const, label: 'MOD Handover Logbook', count: handovers.length, icon: MessageSquare },
    { id: 'broadcast_bulletin' as const, label: 'Team Bulletins', count: broadcasts.length, icon: BellRing },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Tasks & Shift Handover"
        subtitle="Manager on Duty (MOD) shift logbook, SLA runner dispatch queue, and department broadcast bulletins."
        breadcrumbs={['Operations', 'Staff Dispatch & Handover']}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            {activeHotel && (
              <span className="inline-flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#647B52]" />
                {activeHotel.name} • Live Operations Dispatch
              </span>
            )}
            <SampleDataBadge />
          </div>
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowNewHandoverModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#173F35] dark:text-[#C6A15B]" />
              Log Handover
            </button>
            <button
              type="button"
              onClick={() => setShowNewTaskModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              Dispatch Rapid Task
            </button>
          </>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Dispatched Tasks"
          value={activeTasksCount}
          helper="Runner SLA queue"
          delta={urgentTasksCount > 0 ? `${urgentTasksCount} Urgent 10m` : 'Within SLA'}
          deltaTone={urgentTasksCount > 0 ? 'critical' : 'positive'}
          icon={Clock}
        />
        <KpiCard
          label="Open Handover Items"
          value={pendingHandoversCount}
          helper="Pending shift sign-off"
          deltaTone={pendingHandoversCount > 0 ? 'warning' : 'positive'}
          icon={MessageSquare}
        />
        <KpiCard
          label="Operational Bulletins"
          value={broadcasts.length}
          helper="Active team broadcasts"
          deltaTone="forest"
          icon={BellRing}
        />
        <KpiCard
          label="Safety Beacon Status"
          value="Normal"
          helper="0 active distress alerts"
          delta="All zones clear"
          deltaTone="positive"
          icon={ShieldAlert}
        />
      </div>

      {/* Tabs */}
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

      {/* TAB 1: RAPID SERVICE DISPATCH QUEUE */}
      {activeTab === 'rapid_dispatch' && (
        <div className="space-y-4">
          <div className="seam-surface p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#78837D] pointer-events-none" />
              <input
                type="text"
                placeholder="Search task code, room #, guest name, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs seam-input"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={taskDeptFilter}
                onChange={(e) => setTaskDeptFilter(e.target.value)}
                className="px-3 py-1.5 text-xs seam-input"
              >
                <option value="all">All Departments</option>
                <option value="housekeeping">Housekeeping</option>
                <option value="concierge_bell">Concierge / Bell Desk</option>
                <option value="engineering">Engineering</option>
                <option value="room_service">Room Service</option>
                <option value="security">Security</option>
              </select>

              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs seam-input"
              >
                <option value="all">All Statuses</option>
                <option value="dispatched">Dispatched</option>
                <option value="accepted">Accepted</option>
                <option value="in_transit">In Transit</option>
                <option value="completed">Completed</option>
                <option value="verified">Verified</option>
              </select>

              <button
                type="button"
                onClick={loadData}
                className="p-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE] transition-colors"
                aria-label="Refresh tasks"
                title="Refresh Tasks"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={Send}
              title="No rapid tasks in queue"
              description="No active service requests match your search filter. Dispatch a new runner task to assign SLA-tracked guest requests."
              action={
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white"
                >
                  <Send className="w-3.5 h-3.5" />
                  Dispatch Rapid Task
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => {
                const isUrgent = task.priority === 'urgent_10m';
                const isCompleted = task.status === 'completed' || task.status === 'verified';

                return (
                  <div
                    key={task.id}
                    className={`seam-surface p-4 flex flex-col justify-between space-y-3 ${
                      isUrgent && !isCompleted
                        ? 'border-rose-300 dark:border-rose-800/70'
                        : isCompleted
                        ? 'opacity-80'
                        : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E6EBE7] dark:border-[#22322C]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#173F35] dark:text-[#C6A15B] bg-[#F1F4F1] dark:bg-[#192622] px-2 py-0.5 rounded border border-[#E6EBE7] dark:border-[#22322C]">
                            {task.taskCode}
                          </span>
                          <span className="text-xs font-mono font-medium text-[#202B27] dark:text-[#ECF1EE]">
                            Room {task.roomNumber}
                          </span>
                        </div>
                        <StatusBadge
                          label={`${task.slaMinutes}m SLA`}
                          tone={
                            task.priority === 'urgent_10m'
                              ? 'critical'
                              : task.priority === 'high_20m'
                              ? 'warning'
                              : 'neutral'
                          }
                          showIcon={false}
                        />
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <p className="text-sm font-medium text-[#202B27] dark:text-[#ECF1EE] leading-snug">
                          {task.taskDescription}
                        </p>
                        {task.guestName && (
                          <div className="text-[11px] text-[#78837D] dark:text-[#92A199] flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            <span>Guest: {task.guestName}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="seam-surface-subtle p-2.5">
                          <div className="text-[10px] text-[#78837D] dark:text-[#92A199] uppercase">Target Dept</div>
                          <div className="font-medium capitalize text-[#202B27] dark:text-[#ECF1EE] mt-0.5">
                            {task.targetDepartment.replace(/_/g, ' ')}
                          </div>
                        </div>
                        <div className="seam-surface-subtle p-2.5">
                          <div className="text-[10px] text-[#78837D] dark:text-[#92A199] uppercase">Runner</div>
                          <div className="font-medium text-[#173F35] dark:text-[#C6A15B] truncate mt-0.5">
                            {task.assignedRunner || 'Unassigned'}
                          </div>
                        </div>
                      </div>

                      {task.resolutionNotes && (
                        <div className="mt-2.5 seam-surface-subtle p-2 text-[11px] text-emerald-700 dark:text-emerald-400 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{task.resolutionNotes}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] space-y-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-[#78837D] dark:text-[#92A199] tabular-nums">
                          {new Date(task.dispatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <StatusBadge
                          label={task.status.replace(/_/g, ' ')}
                          tone={isCompleted ? 'success' : 'forest'}
                        />
                      </div>

                      {task.status === 'dispatched' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateTaskStatus(task.id, 'accepted')}
                          className="w-full py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept Task
                        </button>
                      )}

                      {task.status === 'accepted' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateTaskStatus(task.id, 'in_transit')}
                          className="w-full py-2 rounded-lg text-xs font-semibold bg-[#647B52] hover:bg-[#536843] text-white flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          Start In-Transit
                        </button>
                      )}

                      {task.status === 'in_transit' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                          className="w-full py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Delivered &amp; Completed
                        </button>
                      )}

                      {task.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateTaskStatus(task.id, 'verified')}
                          className="w-full py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] text-[#202B27] dark:text-[#ECF1EE] flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Verify Resolution
                        </button>
                      )}

                      {task.status === 'verified' && (
                        <div className="text-center text-xs text-emerald-700 dark:text-emerald-400 font-medium py-1 flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified by Supervisor
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANAGER ON DUTY (MOD) SHIFT HANDOVER LOGBOOK */}
      {activeTab === 'shift_handover' && (
        <div className="space-y-4">
          <div className="seam-surface p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {['all', 'morning', 'evening', 'graveyard'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setHandoverShiftFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    handoverShiftFilter === s
                      ? 'bg-[#173F35] text-white dark:bg-[#246353]'
                      : 'bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
                  }`}
                >
                  {s === 'all' ? 'All Shifts' : `${s} Shift`}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowNewHandoverModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Handover Entry
            </button>
          </div>

          {filteredHandovers.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No shift handover entries"
              description="Log operational updates, VIP arrivals, and pending actions for the incoming Duty Manager."
              action={
                <button
                  type="button"
                  onClick={() => setShowNewHandoverModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log Handover Entry
                </button>
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredHandovers.map((entry) => {
                const isPending = entry.status === 'pending_action';
                const isInProgress = entry.status === 'in_progress';
                const isResolved = entry.status === 'resolved';

                return (
                  <div
                    key={entry.id}
                    className={`seam-surface p-5 space-y-3 ${
                      entry.priority === 'critical'
                        ? 'border-rose-300 dark:border-rose-800/70'
                        : entry.priority === 'high_attention'
                        ? 'border-amber-300 dark:border-amber-800/70'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E6EBE7] dark:border-[#22322C]">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge
                          label={entry.priority.replace(/_/g, ' ')}
                          tone={
                            entry.priority === 'critical'
                              ? 'critical'
                              : entry.priority === 'high_attention'
                              ? 'warning'
                              : 'neutral'
                          }
                        />
                        <span className="text-xs font-medium text-[#173F35] dark:text-[#C6A15B] capitalize">
                          {entry.category.replace(/_/g, ' ')}
                        </span>
                        {entry.roomNumber && (
                          <span className="text-xs font-mono bg-[#F6F8F6] dark:bg-[#192622] px-2 py-0.5 rounded border border-[#E6EBE7] dark:border-[#22322C]">
                            Room {entry.roomNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#78837D] dark:text-[#92A199]">
                        <span className="capitalize">{entry.shift} Shift</span>
                        <span>•</span>
                        <span className="font-mono tabular-nums">{entry.date}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                        {entry.subject}
                      </h3>
                      <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-1 leading-relaxed">
                        {entry.description}
                      </p>
                    </div>

                    <div className="seam-surface-subtle p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-[#78837D] dark:text-[#92A199] font-medium mr-1.5">
                          Required Action:
                        </span>
                        <strong className="text-[#202B27] dark:text-[#ECF1EE]">{entry.actionRequired}</strong>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleAcknowledgeHandover(entry.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Accept &amp; Acknowledge
                          </button>
                        )}

                        {isInProgress && (
                          <button
                            type="button"
                            onClick={() => handleResolveHandover(entry.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark Resolved
                          </button>
                        )}

                        {isResolved && <StatusBadge label="Resolved" tone="success" />}
                      </div>
                    </div>

                    <div className="text-[11px] text-[#78837D] dark:text-[#92A199] flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span>Logged by {entry.outgoingSupervisor}</span>
                      {entry.incomingSupervisor && (
                        <span className="text-[#173F35] dark:text-[#C6A15B]">
                          Acknowledged by {entry.incomingSupervisor} (
                          {new Date(entry.acknowledgedAt || '').toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          )
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TEAM BULLETINS */}
      {activeTab === 'broadcast_bulletin' && (
        <div className="space-y-4">
          <div className="seam-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F1F4F1] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B] flex items-center justify-center shrink-0">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  Property Operations Bulletin Board
                </h4>
                <p className="text-xs text-[#78837D] dark:text-[#92A199]">
                  Targeted department broadcasts with read-receipt confirmation tracking.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowNewBroadcastModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Issue Broadcast
            </button>
          </div>

          {broadcasts.length === 0 ? (
            <EmptyState
              icon={BellRing}
              title="No active staff bulletins"
              description="Publish an operational bulletin to notify specific departments or the entire property."
              action={
                <button
                  type="button"
                  onClick={() => setShowNewBroadcastModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Issue Broadcast
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {broadcasts.map((alert) => (
                <div
                  key={alert.id}
                  className={`seam-surface p-5 flex flex-col justify-between space-y-4 ${
                    alert.isPinned ? 'border-[#C6A15B] dark:border-[#C6A15B]/60' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E6EBE7] dark:border-[#22322C]">
                      <div className="flex flex-wrap items-center gap-2">
                        {alert.isPinned && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                            <Pin className="w-3 h-3" /> Pinned
                          </span>
                        )}
                        <StatusBadge label={alert.category.replace(/_/g, ' ')} tone="forest" showIcon={false} />
                      </div>

                      <span className="text-[11px] font-mono text-[#78837D] dark:text-[#92A199]">
                        To: {alert.targetAudience}
                      </span>
                    </div>

                    <div className="mt-3">
                      <h3 className="text-sm sm:text-base font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                        {alert.title}
                      </h3>
                      <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-1 leading-relaxed">
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between gap-2 text-xs">
                    <div className="text-[#78837D] dark:text-[#92A199]">
                      <div>Issued by {alert.senderName}</div>
                      <div className="text-[11px] font-mono">
                        {new Date(alert.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAcknowledgeBroadcast(alert.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      <span>{alert.acknowledgedCount} Acknowledged</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: DISPATCH RAPID SERVICE TASK */}
      <Modal
        open={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        title="Dispatch Rapid Service Task"
        subtitle="Assign SLA-tracked guest request or inter-departmental runner task."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Room Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 402"
                value={newTask.roomNumber}
                onChange={(e) => setNewTask({ ...newTask, roomNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Guest Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Guest Surname"
                value={newTask.guestName}
                onChange={(e) => setNewTask({ ...newTask, guestName: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Target Department *
              </label>
              <select
                required
                value={newTask.targetDepartment}
                onChange={(e) => setNewTask({ ...newTask, targetDepartment: e.target.value as RapidTaskDepartment })}
                className="w-full px-3 py-2 text-xs seam-input"
              >
                <option value="housekeeping">Housekeeping</option>
                <option value="concierge_bell">Concierge / Bell Desk</option>
                <option value="engineering">Engineering</option>
                <option value="room_service">Room Service</option>
                <option value="front_office">Front Office</option>
                <option value="security">Security</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Priority &amp; SLA *
              </label>
              <select
                value={newTask.priority}
                onChange={(e) => {
                  const pri = e.target.value as RapidTaskPriority;
                  const sla = pri === 'urgent_10m' ? 10 : pri === 'high_20m' ? 20 : pri === 'standard_30m' ? 30 : 60;
                  setNewTask({ ...newTask, priority: pri, slaMinutes: sla });
                }}
                className="w-full px-3 py-2 text-xs seam-input"
              >
                <option value="urgent_10m">Urgent (10 Minutes SLA)</option>
                <option value="high_20m">High (20 Minutes SLA)</option>
                <option value="standard_30m">Standard (30 Minutes SLA)</option>
                <option value="routine_60m">Routine (60 Minutes SLA)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Task Description *
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Deliver 2 extra hypoallergenic pillows & fresh bath towel set..."
              value={newTask.taskDescription}
              onChange={(e) => setNewTask({ ...newTask, taskDescription: e.target.value })}
              className="w-full px-3 py-2 text-xs seam-input"
            />
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Assign Runner / Attendant (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Floor 4 Attendant"
              value={newTask.assignedRunner}
              onChange={(e) => setNewTask({ ...newTask, assignedRunner: e.target.value })}
              className="w-full px-3 py-2 text-xs seam-input"
            />
          </div>

          <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowNewTaskModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white"
            >
              Dispatch Task
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: LOG SHIFT HANDOVER */}
      <Modal
        open={showNewHandoverModal}
        onClose={() => setShowNewHandoverModal(false)}
        title="Log MOD Shift Handover"
        subtitle="Record critical handover notes and required follow-ups for incoming shift."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreateHandover} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Shift *</label>
              <select
                value={newHandover.shift}
                onChange={(e) => setNewHandover({ ...newHandover, shift: e.target.value as HandoverShiftType })}
                className="w-full px-3 py-2 text-xs seam-input"
              >
                <option value="morning">Morning (07:00–15:00)</option>
                <option value="evening">Evening (15:00–23:00)</option>
                <option value="graveyard">Graveyard (23:00–07:00)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Category *</label>
              <select
                value={newHandover.category}
                onChange={(e) => setNewHandover({ ...newHandover, category: e.target.value as HandoverLogCategory })}
                className="w-full px-3 py-2 text-xs seam-input"
              >
                <option value="vip_movement">VIP Movement</option>
                <option value="maintenance_defect">Maintenance Defect</option>
                <option value="guest_incident">Guest Incident</option>
                <option value="cash_accounting">Cash Accounting</option>
                <option value="gm_directive">GM Directive</option>
                <option value="general_operations">General Operations</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Priority *</label>
              <select
                value={newHandover.priority}
                onChange={(e) => setNewHandover({ ...newHandover, priority: e.target.value as HandoverPriority })}
                className="w-full px-3 py-2 text-xs seam-input"
              >
                <option value="critical">Critical Attention</option>
                <option value="high_attention">High Attention</option>
                <option value="routine">Routine</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Subject / Headline *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. VIP Delegation Arrival — Presidential Suite Ready"
                value={newHandover.subject}
                onChange={(e) => setNewHandover({ ...newHandover, subject: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Room (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 501"
                value={newHandover.roomNumber}
                onChange={(e) => setNewHandover({ ...newHandover, roomNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Situation Description *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Detail the operational situation, guest context, or equipment status..."
              value={newHandover.description}
              onChange={(e) => setNewHandover({ ...newHandover, description: e.target.value })}
              className="w-full px-3 py-2 text-xs seam-input"
            />
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Required Action for Incoming Shift *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Specify exact action items, deadlines, or inspection instructions..."
              value={newHandover.actionRequired}
              onChange={(e) => setNewHandover({ ...newHandover, actionRequired: e.target.value })}
              className="w-full px-3 py-2 text-xs seam-input"
            />
          </div>

          <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowNewHandoverModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white"
            >
              Log Handover
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ISSUE STAFF BROADCAST */}
      <Modal
        open={showNewBroadcastModal}
        onClose={() => setShowNewBroadcastModal(false)}
        title="Issue Staff Bulletin Broadcast"
        subtitle="Publish operational updates to targeted departments across the property."
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleCreateBroadcast} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Broadcast Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Conference Delegation Arrival at 14:30"
              value={newBroadcast.title}
              onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
              className="w-full px-3 py-2 text-xs seam-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Category *</label>
              <select
                value={newBroadcast.category}
                onChange={(e) =>
                  setNewBroadcast({
                    ...newBroadcast,
                    category: e.target.value as 'operations' | 'security' | 'vip_protocol' | 'weather_alert',
                  })
                }
                className="w-full px-3 py-2 text-xs seam-input"
              >
                <option value="operations">General Operations</option>
                <option value="vip_protocol">VIP Protocol</option>
                <option value="security">Security &amp; Safety</option>
                <option value="weather_alert">Weather Alert</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Target Audience *
              </label>
              <select
                value={newBroadcast.targetAudience}
                onChange={(e) => setNewBroadcast({ ...newBroadcast, targetAudience: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input"
              >
                <option value="All Departments">All Departments</option>
                <option value="Front Office & Concierge">Front Office &amp; Concierge</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Engineering & Maintenance">Engineering &amp; Maintenance</option>
                <option value="Food & Beverage">Food &amp; Beverage</option>
                <option value="Security">Security</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Message Content *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Detailed operational instructions, locations, or action mandates..."
              value={newBroadcast.message}
              onChange={(e) => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
              className="w-full px-3 py-2 text-xs seam-input"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newBroadcast.isPinned}
              onChange={(e) => setNewBroadcast({ ...newBroadcast, isPinned: e.target.checked })}
              className="rounded border-[#E6EBE7] text-[#173F35]"
            />
            <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
              Pin bulletin to top of board
            </span>
          </label>

          <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowNewBroadcastModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white"
            >
              Publish Broadcast
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
