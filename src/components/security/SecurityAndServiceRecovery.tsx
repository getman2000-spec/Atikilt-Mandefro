/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Security, Gate Access, Lost & Found Vault, and Service Recovery SLA
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  Car,
  UserCheck,
  Clock,
  AlertTriangle,
  Search,
  CheckCircle2,
  Package,
  Lock,
  Camera,
  Phone,
  Gift,
  Smile,
  Frown,
  DoorOpen,
  Download,
} from 'lucide-react';
import {
  Hotel,
  SecurityIncident,
  SecurityIncidentCategory,
  VisitorGatePass,
  VisitorType,
  LostAndFoundItem,
  LostAndFoundCategory,
  GuestComplaintTicket,
  ComplaintCategory,
} from '../../types/saas';
import { CurrentUser } from '../../context/AuthContext';
import { saasStorage } from '../../services/storage';
import {
  PageHeader,
  KpiCard,
  StatusBadge,
  EmptyState,
  Modal,
  DataTable,
  DataTableColumn,
  StatusTone,
  SampleDataBadge,
} from '../ui';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatShortDate, downloadCsvFile } from '../../utils/formatters';

interface SecurityAndServiceRecoveryProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

const incidentSeverityTone = (severity: SecurityIncident['severity']): StatusTone => {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'critical';
    case 'medium':
      return 'warning';
    default:
      return 'neutral';
  }
};

const incidentStatusTone = (status: SecurityIncident['status']): StatusTone => {
  switch (status) {
    case 'resolved':
      return 'success';
    case 'escalated':
      return 'critical';
    case 'under_investigation':
      return 'warning';
    default:
      return 'neutral';
  }
};

const lostItemStatusTone = (status: LostAndFoundItem['status']): StatusTone => {
  switch (status) {
    case 'claimed':
      return 'success';
    case 'in_safekeeping':
      return 'forest';
    default:
      return 'neutral';
  }
};

export const SecurityAndServiceRecovery: React.FC<SecurityAndServiceRecoveryProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();

  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings?.currency || 'ETB';
  const currencySymbol = activeHotel?.operationalSettings?.currencySymbol;
  const businessDate = hotelId
    ? saasStorage.getCurrentBusinessDate(hotelId)
    : new Date().toISOString().slice(0, 10);

  const actor = {
    email: currentUser?.email || 'security@hotel.local',
    fullName: currentUser?.fullName || 'Security Officer',
    role: currentUser?.role || 'hotel_admin',
  };

  const [activeTab, setActiveTab] = useState<'incidents' | 'gate_passes' | 'lost_found' | 'complaints'>('incidents');

  // Filters
  const [incidentCategoryFilter, setIncidentCategoryFilter] = useState<string>('all');
  const [incidentStatusFilter, setIncidentStatusFilter] = useState<string>('all');
  const [gatePassStatusFilter, setGatePassStatusFilter] = useState<string>('all');
  const [lostFoundStatusFilter, setLostFoundStatusFilter] = useState<string>('all');
  const [lostFoundSearch, setLostFoundSearch] = useState<string>('');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<string>('all');

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const reloadData = () => setRefreshKey((prev) => prev + 1);

  // Modals state
  const [showIncidentModal, setShowIncidentModal] = useState<boolean>(false);
  const [showResolveIncidentModal, setShowResolveIncidentModal] = useState<boolean>(false);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [incidentResolutionNotes, setIncidentResolutionNotes] = useState<string>('');

  const [showGatePassModal, setShowGatePassModal] = useState<boolean>(false);
  const [showLostItemModal, setShowLostItemModal] = useState<boolean>(false);
  const [showClaimModal, setShowClaimModal] = useState<boolean>(false);
  const [selectedLostItem, setSelectedLostItem] = useState<LostAndFoundItem | null>(null);
  const [showComplaintModal, setShowComplaintModal] = useState<boolean>(false);
  const [showResolveComplaintModal, setShowResolveComplaintModal] = useState<boolean>(false);
  const [selectedComplaint, setSelectedComplaint] = useState<GuestComplaintTicket | null>(null);

  // Reset tenant-scoped UI state when switching properties
  useEffect(() => {
    setIncidentCategoryFilter('all');
    setIncidentStatusFilter('all');
    setGatePassStatusFilter('all');
    setLostFoundStatusFilter('all');
    setLostFoundSearch('');
    setComplaintStatusFilter('all');
    setShowIncidentModal(false);
    setShowResolveIncidentModal(false);
    setSelectedIncident(null);
    setIncidentResolutionNotes('');
    setShowGatePassModal(false);
    setShowLostItemModal(false);
    setShowClaimModal(false);
    setSelectedLostItem(null);
    setShowComplaintModal(false);
    setShowResolveComplaintModal(false);
    setSelectedComplaint(null);
  }, [hotelId]);

  // Data fetching
  const incidents: SecurityIncident[] = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return hotelId ? saasStorage.getSecurityIncidents(hotelId) : [];
  }, [hotelId, refreshKey]);

  const gatePasses: VisitorGatePass[] = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return hotelId ? saasStorage.getVisitorPasses(hotelId) : [];
  }, [hotelId, refreshKey]);

  const lostItems: LostAndFoundItem[] = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return hotelId ? saasStorage.getLostAndFoundItems(hotelId) : [];
  }, [hotelId, refreshKey]);

  const complaints: GuestComplaintTicket[] = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return hotelId ? saasStorage.getGuestComplaints(hotelId) : [];
  }, [hotelId, refreshKey]);

  // KPIs
  const activeIncidentsCount = incidents.filter(
    (i) => i.status === 'open' || i.status === 'under_investigation'
  ).length;
  const criticalIncidentsCount = incidents.filter(
    (i) => (i.severity === 'critical' || i.severity === 'high') && i.status !== 'resolved'
  ).length;
  const activeGatePassesCount = gatePasses.filter((p) => p.status === 'active').length;
  const itemsInCustodyCount = lostItems.filter((i) => i.status === 'in_safekeeping').length;
  const openComplaintsCount = complaints.filter(
    (c) => c.status === 'open' || c.status === 'investigating'
  ).length;
  const breachedComplaintsCount = complaints.filter(
    (c) => c.timeElapsedMinutes > c.slaMinutes && c.status !== 'resolved'
  ).length;

  // Filtered lists
  const filteredIncidents = useMemo(
    () =>
      incidents.filter((i) => {
        const matchesCat = incidentCategoryFilter === 'all' || i.category === incidentCategoryFilter;
        const matchesStatus = incidentStatusFilter === 'all' || i.status === incidentStatusFilter;
        return matchesCat && matchesStatus;
      }),
    [incidents, incidentCategoryFilter, incidentStatusFilter]
  );

  const filteredGatePasses = useMemo(
    () =>
      gatePasses.filter((p) => {
        return gatePassStatusFilter === 'all' || p.status === gatePassStatusFilter;
      }),
    [gatePasses, gatePassStatusFilter]
  );

  const filteredLostItems = useMemo(() => {
    const q = lostFoundSearch.trim().toLowerCase();
    return lostItems.filter((i) => {
      const matchesStatus = lostFoundStatusFilter === 'all' || i.status === lostFoundStatusFilter;
      const matchesSearch =
        !q ||
        i.itemNumber.toLowerCase().includes(q) ||
        i.itemName.toLowerCase().includes(q) ||
        i.foundLocation.toLowerCase().includes(q) ||
        i.storageLocker.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [lostItems, lostFoundStatusFilter, lostFoundSearch]);

  const filteredComplaints = useMemo(
    () =>
      complaints.filter((c) => {
        return complaintStatusFilter === 'all' || c.status === complaintStatusFilter;
      }),
    [complaints, complaintStatusFilter]
  );

  // Modal form states
  const [newIncident, setNewIncident] = useState<{
    category: SecurityIncidentCategory;
    severity: 'low' | 'medium' | 'high' | 'critical';
    location: string;
    description: string;
    cctvReviewed: boolean;
    policeNotified: boolean;
  }>({
    category: 'noise_disturbance',
    severity: 'medium',
    location: '',
    description: '',
    cctvReviewed: false,
    policeNotified: false,
  });

  const [newGatePass, setNewGatePass] = useState<{
    visitorName: string;
    visitorPhone: string;
    visitorType: VisitorType;
    visitingRoomOrDept: string;
    vehiclePlate: string;
    vehicleModel: string;
    badgeNumber: string;
  }>({
    visitorName: '',
    visitorPhone: '',
    visitorType: 'guest_visitor',
    visitingRoomOrDept: '',
    vehiclePlate: '',
    vehicleModel: '',
    badgeNumber: `V-${Math.floor(10 + Math.random() * 90)}`,
  });

  const [newLostItem, setNewLostItem] = useState<{
    itemName: string;
    category: LostAndFoundCategory;
    description: string;
    foundLocation: string;
    foundBy: string;
    storageLocker: string;
    guestIdOrPhone: string;
  }>({
    itemName: '',
    category: 'electronics',
    description: '',
    foundLocation: '',
    foundBy: '',
    storageLocker: 'Security Vault Locker #1',
    guestIdOrPhone: '',
  });

  const [claimantInfo, setClaimantInfo] = useState<{
    claimantName: string;
    notes: string;
  }>({
    claimantName: '',
    notes: '',
  });

  const [newComplaint, setNewComplaint] = useState<{
    guestName: string;
    roomNumber: string;
    category: ComplaintCategory;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    departmentAttribution: string;
    description: string;
    slaMinutes: number;
    assignedTo: string;
  }>({
    guestName: '',
    roomNumber: '',
    category: 'room_comfort',
    priority: 'high',
    departmentAttribution: 'Housekeeping',
    description: '',
    slaMinutes: 30,
    assignedTo: 'Duty Manager',
  });

  const [resolutionData, setResolutionData] = useState<{
    resolutionNotes: string;
    guestSatisfied: boolean;
    compensationType: 'none' | 'loyalty_points' | 'complimentary_meal' | 'room_discount' | 'apology_amenity';
    compensationDetail: string;
    compensationValue: number;
  }>({
    resolutionNotes: '',
    guestSatisfied: true,
    compensationType: 'complimentary_meal',
    compensationDetail: 'Complimentary Main Restaurant Dinner Voucher',
    compensationValue: 650,
  });

  // Handlers
  const handleSaveIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newIncident.location.trim() || !newIncident.description.trim()) return;

    const incidentNumber = `SEC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const fullIncident: SecurityIncident = {
      id: 'inc_' + Math.random().toString(36).substring(2, 9),
      hotelId,
      incidentNumber,
      category: newIncident.category,
      severity: newIncident.severity,
      location: newIncident.location.trim(),
      reportedBy: actor.fullName,
      investigatingOfficer: 'Duty Security Officer',
      description: newIncident.description.trim(),
      cctvReviewed: newIncident.cctvReviewed,
      policeNotified: newIncident.policeNotified,
      status: 'under_investigation',
      timestamp: new Date().toISOString(),
    };

    saasStorage.saveSecurityIncident(fullIncident, actor);
    setShowIncidentModal(false);
    setNewIncident({
      category: 'noise_disturbance',
      severity: 'medium',
      location: '',
      description: '',
      cctvReviewed: false,
      policeNotified: false,
    });
    reloadData();
    toast('Security incident logged', {
      description: `${incidentNumber} recorded under investigation.`,
      variant: 'success',
    });
  };

  const handleOpenResolveIncident = (inc: SecurityIncident) => {
    setSelectedIncident(inc);
    setIncidentResolutionNotes(inc.resolutionNotes || '');
    setShowResolveIncidentModal(true);
  };

  const handleConfirmResolveIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !incidentResolutionNotes.trim()) return;

    const updated: SecurityIncident = {
      ...selectedIncident,
      status: 'resolved',
      resolutionNotes: incidentResolutionNotes.trim(),
    };
    saasStorage.saveSecurityIncident(updated, actor);
    setShowResolveIncidentModal(false);
    toast('Incident resolved', {
      description: `${selectedIncident.incidentNumber} marked as resolved.`,
      variant: 'success',
    });
    setSelectedIncident(null);
    setIncidentResolutionNotes('');
    reloadData();
  };

  const handleCreateGatePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newGatePass.visitorName.trim() || !newGatePass.visitingRoomOrDept.trim()) return;

    saasStorage.createVisitorPass(
      {
        hotelId,
        visitorName: newGatePass.visitorName.trim(),
        visitorPhone: newGatePass.visitorPhone.trim(),
        visitorType: newGatePass.visitorType,
        visitingRoomOrDept: newGatePass.visitingRoomOrDept.trim(),
        vehiclePlate: newGatePass.vehiclePlate.trim() || undefined,
        vehicleModel: newGatePass.vehicleModel.trim() || undefined,
        badgeNumber: newGatePass.badgeNumber.trim(),
        entryTime: new Date().toTimeString().slice(0, 5),
        date: businessDate,
        authorizedBy: actor.fullName,
      },
      actor
    );

    setShowGatePassModal(false);
    toast('Gate pass issued', {
      description: `Badge ${newGatePass.badgeNumber} authorized for ${newGatePass.visitorName.trim()}.`,
      variant: 'success',
    });
    setNewGatePass({
      visitorName: '',
      visitorPhone: '',
      visitorType: 'guest_visitor',
      visitingRoomOrDept: '',
      vehiclePlate: '',
      vehicleModel: '',
      badgeNumber: `V-${Math.floor(10 + Math.random() * 90)}`,
    });
    reloadData();
  };

  const handleCheckoutGatePass = (pass: VisitorGatePass) => {
    saasStorage.checkoutVisitorPass(pass.id, actor);
    reloadData();
    toast('Visitor checked out', {
      description: `${pass.visitorName} (${pass.badgeNumber}) cleared at exit gate.`,
      variant: 'success',
    });
  };

  const handleRegisterLostItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newLostItem.itemName.trim() || !newLostItem.foundLocation.trim()) return;

    saasStorage.registerLostItem(
      {
        hotelId,
        category: newLostItem.category,
        itemName: newLostItem.itemName.trim(),
        description: newLostItem.description.trim(),
        foundLocation: newLostItem.foundLocation.trim(),
        foundBy: newLostItem.foundBy.trim() || actor.fullName,
        foundDate: businessDate,
        storageLocker: newLostItem.storageLocker.trim(),
        guestIdOrPhone: newLostItem.guestIdOrPhone.trim() || undefined,
      },
      actor
    );

    setShowLostItemModal(false);
    toast('Lost item deposited in vault', {
      description: `${newLostItem.itemName.trim()} logged into ${newLostItem.storageLocker}.`,
      variant: 'success',
    });
    setNewLostItem({
      itemName: '',
      category: 'electronics',
      description: '',
      foundLocation: '',
      foundBy: '',
      storageLocker: 'Security Vault Locker #1',
      guestIdOrPhone: '',
    });
    reloadData();
  };

  const handleClaimLostItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLostItem || !claimantInfo.claimantName.trim()) return;

    saasStorage.claimLostItem(
      selectedLostItem.id,
      claimantInfo.claimantName.trim(),
      claimantInfo.notes.trim(),
      actor
    );
    setShowClaimModal(false);
    toast('Custody item released', {
      description: `${selectedLostItem.itemNumber} claimed by ${claimantInfo.claimantName.trim()}.`,
      variant: 'success',
    });
    setSelectedLostItem(null);
    setClaimantInfo({ claimantName: '', notes: '' });
    reloadData();
  };

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newComplaint.guestName.trim() || !newComplaint.description.trim()) return;

    saasStorage.createGuestComplaint(
      {
        hotelId,
        guestName: newComplaint.guestName.trim(),
        roomNumber: newComplaint.roomNumber.trim() || undefined,
        category: newComplaint.category,
        priority: newComplaint.priority,
        departmentAttribution: newComplaint.departmentAttribution,
        description: newComplaint.description.trim(),
        slaMinutes: Number(newComplaint.slaMinutes),
        assignedTo: newComplaint.assignedTo.trim() || 'Duty Manager',
        guestSatisfied: false,
      },
      actor
    );

    setShowComplaintModal(false);
    toast('Complaint ticket opened', {
      description: `SLA countdown (${newComplaint.slaMinutes}m) started for ${newComplaint.guestName.trim()}.`,
      variant: 'warning',
    });
    setNewComplaint({
      guestName: '',
      roomNumber: '',
      category: 'room_comfort',
      priority: 'high',
      departmentAttribution: 'Housekeeping',
      description: '',
      slaMinutes: 30,
      assignedTo: 'Duty Manager',
    });
    reloadData();
  };

  const handleResolveComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !resolutionData.resolutionNotes.trim()) return;

    const compensation =
      resolutionData.compensationType !== 'none'
        ? {
            type: resolutionData.compensationType,
            detail: resolutionData.compensationDetail.trim() || 'Service recovery gesture',
            value: Number(resolutionData.compensationValue) || 0,
          }
        : undefined;

    saasStorage.resolveGuestComplaint(
      selectedComplaint.id,
      resolutionData.resolutionNotes.trim(),
      compensation,
      actor
    );

    setShowResolveComplaintModal(false);
    toast('Service recovery completed', {
      description: `Ticket ${selectedComplaint.ticketNumber} resolved and closed.`,
      variant: 'success',
    });
    setSelectedComplaint(null);
    setResolutionData({
      resolutionNotes: '',
      guestSatisfied: true,
      compensationType: 'complimentary_meal',
      compensationDetail: 'Complimentary Main Restaurant Dinner Voucher',
      compensationValue: 650,
    });
    reloadData();
  };

  // CSV Exports
  const exportIncidentsCsv = () => {
    downloadCsvFile(
      `security-incidents-${businessDate}.csv`,
      ['Incident #', 'Category', 'Severity', 'Location', 'Status', 'CCTV Reviewed', 'Police Notified', 'Reported By', 'Timestamp', 'Description', 'Resolution'],
      filteredIncidents.map((inc) => [
        inc.incidentNumber,
        inc.category,
        inc.severity,
        inc.location,
        inc.status,
        inc.cctvReviewed ? 'Yes' : 'No',
        inc.policeNotified ? 'Yes' : 'No',
        inc.reportedBy,
        inc.timestamp,
        inc.description,
        inc.resolutionNotes || '',
      ])
    );
    toast('Exported incidents CSV', { variant: 'info' });
  };

  const exportGatePassesCsv = () => {
    downloadCsvFile(
      `gate-passes-${businessDate}.csv`,
      ['Pass #', 'Badge', 'Visitor Name', 'Phone', 'Type', 'Destination', 'Vehicle Plate', 'Vehicle Model', 'Entry Time', 'Exit Time', 'Status'],
      filteredGatePasses.map((p) => [
        p.passNumber,
        p.badgeNumber,
        p.visitorName,
        p.visitorPhone,
        p.visitorType,
        p.visitingRoomOrDept,
        p.vehiclePlate || '',
        p.vehicleModel || '',
        p.entryTime,
        p.exitTime || '',
        p.status,
      ])
    );
    toast('Exported gate passes CSV', { variant: 'info' });
  };

  const exportLostItemsCsv = () => {
    downloadCsvFile(
      `lost-found-vault-${businessDate}.csv`,
      ['Item #', 'Item Name', 'Category', 'Found Location', 'Found By', 'Found Date', 'Storage Locker', 'Status', 'Claimed By'],
      filteredLostItems.map((i) => [
        i.itemNumber,
        i.itemName,
        i.category,
        i.foundLocation,
        i.foundBy,
        i.foundDate,
        i.storageLocker,
        i.status,
        i.claimedBy || '',
      ])
    );
    toast('Exported Lost & Found vault CSV', { variant: 'info' });
  };

  const exportComplaintsCsv = () => {
    downloadCsvFile(
      `service-recovery-complaints-${businessDate}.csv`,
      ['Ticket #', 'Guest', 'Room', 'Category', 'Department', 'Priority', 'SLA (min)', 'Elapsed (min)', 'Status', 'Compensation', 'Value'],
      filteredComplaints.map((c) => [
        c.ticketNumber,
        c.guestName,
        c.roomNumber || 'Public Area',
        c.category,
        c.departmentAttribution,
        c.priority,
        c.slaMinutes,
        c.timeElapsedMinutes,
        c.status,
        c.compensationOffered?.detail || 'None',
        c.compensationOffered?.value ?? 0,
      ])
    );
    toast('Exported complaints SLA CSV', { variant: 'info' });
  };

  // DataTable Columns
  const incidentColumns: DataTableColumn<SecurityIncident>[] = [
    {
      key: 'incidentNumber',
      header: 'Incident #',
      sortable: true,
      sortValue: (row) => row.incidentNumber,
      render: (row) => (
        <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] whitespace-nowrap">
          {row.incidentNumber}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category & Severity',
      sortable: true,
      sortValue: (row) => row.severity,
      render: (row) => (
        <div className="space-y-1">
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE] capitalize">
            {row.category.replace(/_/g, ' ')}
          </div>
          <StatusBadge
            label={`${row.severity.charAt(0).toUpperCase() + row.severity.slice(1)} Severity`}
            tone={incidentSeverityTone(row.severity)}
          />
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      sortable: true,
      sortValue: (row) => row.location,
      render: (row) => (
        <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{row.location}</span>
      ),
    },
    {
      key: 'description',
      header: 'Occurrence Summary',
      render: (row) => (
        <div className="max-w-xs space-y-1">
          <p className="text-xs text-[#202B27] dark:text-[#ECF1EE] line-clamp-2">{row.description}</p>
          {row.resolutionNotes && (
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Resolution: {row.resolutionNotes}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'surveillance',
      header: 'Surveillance & Dispatch',
      render: (row) => (
        <div className="flex flex-col gap-1 text-[11px]">
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              row.cctvReviewed
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-[#78837D] dark:text-[#92A199]'
            }`}
          >
            <Camera className="w-3 h-3" />
            {row.cctvReviewed ? 'CCTV Reviewed' : 'No CCTV Log'}
          </span>
          {row.policeNotified && (
            <span className="inline-flex items-center gap-1 font-medium text-rose-700 dark:text-rose-400">
              <Shield className="w-3 h-3" />
              Police Notified
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (row) => row.status,
      render: (row) => (
        <StatusBadge
          label={row.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          tone={incidentStatusTone(row.status)}
        />
      ),
    },
    {
      key: 'reportedBy',
      header: 'Reported',
      sortable: true,
      sortValue: (row) => row.timestamp,
      render: (row) => (
        <div className="text-xs">
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{row.reportedBy}</div>
          <div className="text-[11px] font-mono text-[#78837D] dark:text-[#92A199] mt-0.5">
            {formatShortDate(row.timestamp)} ·{' '}
            {new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) =>
        row.status !== 'resolved' ? (
          <button
            type="button"
            onClick={() => handleOpenResolveIncident(row)}
            className="px-2.5 py-1.5 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white text-xs font-medium transition-colors whitespace-nowrap"
          >
            Resolve
          </button>
        ) : (
          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Closed</span>
        ),
    },
  ];

  const gatePassColumns: DataTableColumn<VisitorGatePass>[] = [
    {
      key: 'passNumber',
      header: 'Pass & Badge',
      sortable: true,
      sortValue: (row) => row.passNumber,
      render: (row) => (
        <div>
          <div className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">{row.passNumber}</div>
          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-[#F1F4F1] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[11px] font-mono text-[#78837D] dark:text-[#92A199]">
            {row.badgeNumber}
          </span>
        </div>
      ),
    },
    {
      key: 'visitorName',
      header: 'Visitor / Driver',
      sortable: true,
      sortValue: (row) => row.visitorName,
      render: (row) => (
        <div>
          <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{row.visitorName}</div>
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199] flex items-center gap-1 mt-0.5 font-mono">
            <Phone className="w-3 h-3" />
            {row.visitorPhone || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'visitorType',
      header: 'Type',
      sortable: true,
      sortValue: (row) => row.visitorType,
      render: (row) => (
        <span className="capitalize px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]">
          {row.visitorType.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'visitingRoomOrDept',
      header: 'Destination',
      sortable: true,
      sortValue: (row) => row.visitingRoomOrDept,
      render: (row) => (
        <span className="font-medium text-[#173F35] dark:text-[#C6A15B]">{row.visitingRoomOrDept}</span>
      ),
    },
    {
      key: 'vehiclePlate',
      header: 'Vehicle Details',
      render: (row) =>
        row.vehiclePlate ? (
          <div>
            <div className="font-mono text-xs font-semibold text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-[#C6A15B]" />
              {row.vehiclePlate}
            </div>
            {row.vehicleModel && (
              <div className="text-[11px] text-[#78837D] dark:text-[#92A199] mt-0.5">{row.vehicleModel}</div>
            )}
          </div>
        ) : (
          <span className="text-xs text-[#78837D] dark:text-[#92A199]">Pedestrian Entry</span>
        ),
    },
    {
      key: 'entryTime',
      header: 'Gate Timestamps',
      sortable: true,
      sortValue: (row) => row.entryTime,
      render: (row) => (
        <div className="text-xs font-mono tabular-nums">
          <div className="text-emerald-700 dark:text-emerald-400 font-medium">In: {row.entryTime}</div>
          {row.exitTime ? (
            <div className="text-[#78837D] dark:text-[#92A199]">Out: {row.exitTime}</div>
          ) : (
            <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">On Premises</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (row) => row.status,
      render: (row) => (
        <StatusBadge
          label={row.status === 'active' ? 'Active Inside' : 'Cleared / Exited'}
          tone={row.status === 'active' ? 'success' : 'neutral'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Gate Action',
      align: 'right',
      render: (row) =>
        row.status === 'active' ? (
          <button
            type="button"
            onClick={() => handleCheckoutGatePass(row)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C6A15B] hover:bg-[#B48F4B] text-[#173F35] text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <DoorOpen className="w-3.5 h-3.5" />
            Check-out Exit
          </button>
        ) : (
          <span className="text-[11px] text-[#78837D] dark:text-[#92A199]">Exited</span>
        ),
    },
  ];

  const complaintColumns: DataTableColumn<GuestComplaintTicket>[] = [
    {
      key: 'ticketNumber',
      header: 'Ticket #',
      sortable: true,
      sortValue: (row) => row.ticketNumber,
      render: (row) => (
        <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] whitespace-nowrap">
          {row.ticketNumber}
        </span>
      ),
    },
    {
      key: 'guestName',
      header: 'Guest & Room',
      sortable: true,
      sortValue: (row) => row.guestName,
      render: (row) => (
        <div>
          <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{row.guestName}</div>
          {row.roomNumber ? (
            <span className="text-[11px] font-mono font-medium text-[#173F35] dark:text-[#C6A15B]">
              Room {row.roomNumber}
            </span>
          ) : (
            <span className="text-[11px] text-[#78837D] dark:text-[#92A199]">Public Area Guest</span>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category & Dept',
      sortable: true,
      sortValue: (row) => row.departmentAttribution,
      render: (row) => (
        <div className="space-y-1">
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE] capitalize">
            {row.category.replace(/_/g, ' ')}
          </div>
          <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-[#F1F4F1] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#78837D] dark:text-[#92A199]">
            {row.departmentAttribution}
          </span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Issue Description',
      render: (row) => (
        <div className="max-w-xs space-y-1">
          <p className="text-xs text-[#202B27] dark:text-[#ECF1EE] line-clamp-2">{row.description}</p>
          {row.resolutionNotes && (
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Notes: {row.resolutionNotes}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'slaMinutes',
      header: 'SLA Countdown',
      sortable: true,
      sortValue: (row) => row.slaMinutes,
      render: (row) => {
        const isBreached = row.timeElapsedMinutes > row.slaMinutes && row.status !== 'resolved';
        return (
          <div className="space-y-1">
            <div className="text-xs font-mono font-medium text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#78837D]" />
              Target {row.slaMinutes}m
            </div>
            {row.status !== 'resolved' ? (
              <StatusBadge
                label={isBreached ? 'SLA Breached' : 'In Progress'}
                tone={isBreached ? 'critical' : 'warning'}
              />
            ) : (
              <StatusBadge label="SLA Satisfied" tone="success" />
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status & Satisfaction',
      sortable: true,
      sortValue: (row) => row.status,
      render: (row) => (
        <div className="space-y-1">
          <StatusBadge
            label={row.status.charAt(0).toUpperCase() + row.status.slice(1)}
            tone={row.status === 'resolved' ? 'success' : 'warning'}
          />
          {row.status === 'resolved' && (
            <div
              className={`text-[11px] flex items-center gap-1 font-medium ${
                row.guestSatisfied
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-[#78837D] dark:text-[#92A199]'
              }`}
            >
              {row.guestSatisfied ? (
                <>
                  <Smile className="w-3 h-3" /> Guest Satisfied
                </>
              ) : (
                <>
                  <Frown className="w-3 h-3" /> Neutral / Unconfirmed
                </>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'compensationOffered',
      header: 'Compensation',
      render: (row) =>
        row.compensationOffered ? (
          <div className="p-2 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-xs space-y-0.5 max-w-[220px]">
            <div className="font-medium text-[#202B27] dark:text-[#ECF1EE] flex items-start gap-1">
              <Gift className="w-3 h-3 text-[#C6A15B] shrink-0 mt-0.5" />
              <span className="break-words">{row.compensationOffered.detail}</span>
            </div>
            <div className="text-[11px] font-mono text-[#78837D] dark:text-[#92A199]">
              {row.compensationOffered.type === 'loyalty_points'
                ? `${row.compensationOffered.value} pts`
                : formatCurrency(row.compensationOffered.value, currency, currencySymbol)}
            </div>
          </div>
        ) : (
          <span className="text-xs text-[#78837D] dark:text-[#92A199]">No voucher issued</span>
        ),
    },
    {
      key: 'actions',
      header: 'Recovery Action',
      align: 'right',
      render: (row) =>
        row.status !== 'resolved' ? (
          <button
            type="button"
            onClick={() => {
              setSelectedComplaint(row);
              setShowResolveComplaintModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white text-xs font-medium transition-colors whitespace-nowrap"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Resolve & Compensate
          </button>
        ) : (
          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Closed</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Operations', 'Security & Service Recovery']}
        title="Security, Gate Access & Service Recovery"
        subtitle="24/7 security occurrence surveillance, visitor vehicle gate pass authorization, custodial safekeeping vault, and SLA-driven guest service recovery."
        meta={
          <div className="flex flex-wrap items-center gap-2">
            {activeHotel?.name && <span>Property: {activeHotel.name}</span>}
            <span aria-hidden="true">·</span>
            <span className="font-mono">Business Date: {formatShortDate(businessDate)}</span>
            <SampleDataBadge />
          </div>
        }
        actions={
          <>
            {activeTab === 'incidents' && (
              <button
                type="button"
                onClick={() => setShowIncidentModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
              >
                <ShieldAlert className="w-4 h-4" />
                Log Incident
              </button>
            )}
            {activeTab === 'gate_passes' && (
              <button
                type="button"
                onClick={() => setShowGatePassModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
              >
                <Car className="w-4 h-4" />
                Issue Gate Pass
              </button>
            )}
            {activeTab === 'lost_found' && (
              <button
                type="button"
                onClick={() => setShowLostItemModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
              >
                <Package className="w-4 h-4" />
                Register Lost Item
              </button>
            )}
            {activeTab === 'complaints' && (
              <button
                type="button"
                onClick={() => setShowComplaintModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
              >
                <AlertTriangle className="w-4 h-4" />
                Log Complaint Ticket
              </button>
            )}
          </>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Incidents"
          value={activeIncidentsCount}
          icon={ShieldAlert}
          delta={criticalIncidentsCount > 0 ? `${criticalIncidentsCount} High/Critical` : 'All Clear'}
          deltaTone={criticalIncidentsCount > 0 ? 'critical' : 'positive'}
          helper="Open or under investigation"
          onClick={() => setActiveTab('incidents')}
        />
        <KpiCard
          label="Vehicles & Visitors Inside"
          value={activeGatePassesCount}
          icon={Car}
          delta="On-Premises"
          deltaTone="positive"
          helper="Authorized gate clearance"
          onClick={() => setActiveTab('gate_passes')}
        />
        <KpiCard
          label="Vault Safekeeping"
          value={itemsInCustodyCount}
          icon={Lock}
          delta="Items Held"
          deltaTone={itemsInCustodyCount > 0 ? 'warning' : 'neutral'}
          helper="Pending claimant verification"
          onClick={() => setActiveTab('lost_found')}
        />
        <KpiCard
          label="Service Recovery SLA"
          value={openComplaintsCount}
          icon={Clock}
          delta={breachedComplaintsCount > 0 ? `${breachedComplaintsCount} Breached` : 'On Target'}
          deltaTone={breachedComplaintsCount > 0 ? 'critical' : 'forest'}
          helper="Target SLA 30–45 mins"
          onClick={() => setActiveTab('complaints')}
        />
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E6EBE7] dark:border-[#22322C] overflow-x-auto">
        {[
          { id: 'incidents' as const, label: `Security Occurrence Log (${incidents.length})`, icon: ShieldAlert },
          { id: 'gate_passes' as const, label: `Visitor & Vehicle Gate Passes (${gatePasses.length})`, icon: Car },
          { id: 'lost_found' as const, label: `Lost & Found Vault (${lostItems.length})`, icon: Package },
          { id: 'complaints' as const, label: `Guest Complaints & SLA (${complaints.length})`, icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'border-[#173F35] dark:border-[#C6A15B] text-[#173F35] dark:text-[#ECF1EE]'
                  : 'border-transparent text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SECURITY OCCURRENCE LOG */}
      {activeTab === 'incidents' && (
        <DataTable
          data={filteredIncidents}
          columns={incidentColumns}
          keyExtractor={(row) => row.id}
          searchPlaceholder="Search by incident #, location, or description..."
          searchFilter={(row, q) =>
            row.incidentNumber.toLowerCase().includes(q) ||
            row.location.toLowerCase().includes(q) ||
            row.description.toLowerCase().includes(q) ||
            row.reportedBy.toLowerCase().includes(q)
          }
          onExportCsv={exportIncidentsCsv}
          exportLabel="Export Log CSV"
          emptyTitle="No security incidents recorded"
          emptyDescription="Adjust filters or log a new security occurrence for investigation and CCTV audit."
          filterToolbar={
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={incidentCategoryFilter}
                onChange={(e) => setIncidentCategoryFilter(e.target.value)}
                className="seam-input text-xs py-1.5 px-2.5"
                aria-label="Filter incidents by category"
              >
                <option value="all">All Categories</option>
                <option value="noise_disturbance">Noise Disturbance</option>
                <option value="theft_loss">Theft / Loss</option>
                <option value="unauthorized_entry">Unauthorized Entry</option>
                <option value="property_damage">Property Damage</option>
                <option value="medical_emergency">Medical Emergency</option>
                <option value="safe_override">Safe Override</option>
                <option value="fire_alarm">Fire Alarm</option>
              </select>
              <select
                value={incidentStatusFilter}
                onChange={(e) => setIncidentStatusFilter(e.target.value)}
                className="seam-input text-xs py-1.5 px-2.5"
                aria-label="Filter incidents by status"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="under_investigation">Under Investigation</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>
          }
        />
      )}

      {/* TAB 2: VISITOR & VEHICLE GATE PASSES */}
      {activeTab === 'gate_passes' && (
        <DataTable
          data={filteredGatePasses}
          columns={gatePassColumns}
          keyExtractor={(row) => row.id}
          searchPlaceholder="Search pass #, visitor, plate, or destination..."
          searchFilter={(row, q) =>
            row.passNumber.toLowerCase().includes(q) ||
            row.visitorName.toLowerCase().includes(q) ||
            (row.vehiclePlate ? row.vehiclePlate.toLowerCase().includes(q) : false) ||
            row.visitingRoomOrDept.toLowerCase().includes(q) ||
            row.badgeNumber.toLowerCase().includes(q)
          }
          onExportCsv={exportGatePassesCsv}
          exportLabel="Export Gate Log CSV"
          emptyTitle="No visitor gate passes found"
          emptyDescription="Issue a gate pass to track visitor badges, vehicle license plates, and exit clearance."
          filterToolbar={
            <select
              value={gatePassStatusFilter}
              onChange={(e) => setGatePassStatusFilter(e.target.value)}
              className="seam-input text-xs py-1.5 px-2.5"
              aria-label="Filter gate passes by status"
            >
              <option value="all">All Gate Passes</option>
              <option value="active">Active On-Premises</option>
              <option value="cleared">Cleared / Exited</option>
            </select>
          }
        />
      )}

      {/* TAB 3: LOST & FOUND SAFEKEEPING VAULT */}
      {activeTab === 'lost_found' && (
        <div className="space-y-4">
          <div className="seam-surface p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-[#78837D] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={lostFoundSearch}
                  onChange={(e) => setLostFoundSearch(e.target.value)}
                  placeholder="Search item #, name, location, locker..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs seam-input"
                />
              </div>

              <select
                value={lostFoundStatusFilter}
                onChange={(e) => setLostFoundStatusFilter(e.target.value)}
                className="seam-input text-xs py-1.5 px-2.5"
                aria-label="Filter lost items by custody status"
              >
                <option value="all">All Custody Statuses</option>
                <option value="in_safekeeping">In Safekeeping Vault</option>
                <option value="claimed">Claimed by Guest</option>
                <option value="disposed">Disposed / Donated</option>
              </select>
            </div>

            <button
              type="button"
              onClick={exportLostItemsCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-[#78837D]" />
              <span>Export Vault CSV</span>
            </button>
          </div>

          {filteredLostItems.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No lost & found items matching filters"
              description="Register discovered guest belongings into custodial safekeeping lockers with full chain-of-custody tracking."
              action={
                <button
                  type="button"
                  onClick={() => setShowLostItemModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white text-xs font-semibold transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  Register Lost Item
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLostItems.map((item) => (
                <div
                  key={item.id}
                  className="seam-surface p-4 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B]">
                        {item.itemNumber}
                      </span>
                      <StatusBadge
                        label={item.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        tone={lostItemStatusTone(item.status)}
                      />
                    </div>

                    <h3 className="font-semibold text-sm text-[#202B27] dark:text-[#ECF1EE] mt-2.5">
                      {item.itemName}
                    </h3>
                    <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-1 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="mt-3 p-3 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] space-y-1.5 text-xs">
                      <div>
                        <span className="text-[#78837D] dark:text-[#92A199]">Found Location: </span>
                        <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                          {item.foundLocation}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#78837D] dark:text-[#92A199]">Found By: </span>
                        <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                          {item.foundBy}
                        </span>{' '}
                        <span className="font-mono text-[11px] text-[#78837D] dark:text-[#92A199]">
                          ({formatShortDate(item.foundDate)})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#173F35] dark:text-[#C6A15B] font-medium pt-0.5">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.storageLocker}</span>
                      </div>
                    </div>

                    {item.status === 'claimed' && (
                      <div className="mt-3 p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300">
                        <div className="font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Claimed by {item.claimedBy}</span>
                        </div>
                        {item.claimNotes && (
                          <div className="text-[11px] mt-1 opacity-90">{item.claimNotes}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {item.status === 'in_safekeeping' && (
                    <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLostItem(item);
                          setShowClaimModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white text-xs font-medium transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Verify & Process Claim
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GUEST COMPLAINTS & SERVICE RECOVERY SLA */}
      {activeTab === 'complaints' && (
        <DataTable
          data={filteredComplaints}
          columns={complaintColumns}
          keyExtractor={(row) => row.id}
          searchPlaceholder="Search ticket #, guest, room, or department..."
          searchFilter={(row, q) =>
            row.ticketNumber.toLowerCase().includes(q) ||
            row.guestName.toLowerCase().includes(q) ||
            (row.roomNumber ? row.roomNumber.toLowerCase().includes(q) : false) ||
            row.description.toLowerCase().includes(q) ||
            row.departmentAttribution.toLowerCase().includes(q)
          }
          onExportCsv={exportComplaintsCsv}
          exportLabel="Export SLA CSV"
          emptyTitle="No service recovery tickets"
          emptyDescription="Guest complaints and SLA recovery tickets will appear here once logged."
          filterToolbar={
            <select
              value={complaintStatusFilter}
              onChange={(e) => setComplaintStatusFilter(e.target.value)}
              className="seam-input text-xs py-1.5 px-2.5"
              aria-label="Filter complaints by status"
            >
              <option value="all">All Service Recovery Tickets</option>
              <option value="open">Open (Immediate Attention)</option>
              <option value="investigating">Under Investigation</option>
              <option value="resolved">Resolved & Compensated</option>
            </select>
          }
        />
      )}

      {/* MODAL 1: LOG SECURITY INCIDENT */}
      <Modal
        open={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
        title="Log Security Incident / Occurrence"
        subtitle="Record an official occurrence entry for duty security and management review."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSaveIncident} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Category</label>
              <select
                value={newIncident.category}
                onChange={(e) =>
                  setNewIncident({ ...newIncident, category: e.target.value as SecurityIncidentCategory })
                }
                className="w-full seam-input px-3 py-2"
              >
                <option value="noise_disturbance">Noise Disturbance</option>
                <option value="theft_loss">Theft / Loss</option>
                <option value="unauthorized_entry">Unauthorized Entry</option>
                <option value="property_damage">Property Damage</option>
                <option value="medical_emergency">Medical Emergency</option>
                <option value="safe_override">Safe Electronic Override</option>
                <option value="fire_alarm">Fire Alarm Activation</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Severity Level</label>
              <select
                value={newIncident.severity}
                onChange={(e) =>
                  setNewIncident({
                    ...newIncident,
                    severity: e.target.value as 'low' | 'medium' | 'high' | 'critical',
                  })
                }
                className="w-full seam-input px-3 py-2"
              >
                <option value="low">Low Severity</option>
                <option value="medium">Medium Severity</option>
                <option value="high">High Severity</option>
                <option value="critical">Critical Severity</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Location on Property
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Room 204 Balcony, Pool Terrace, Main Gate"
              value={newIncident.location}
              onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
              className="w-full seam-input px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Occurrence Description
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide precise details of incident, witnesses, and immediate actions taken..."
              value={newIncident.description}
              onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
              className="w-full seam-input px-3 py-2"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-[#202B27] dark:text-[#ECF1EE]">
              <input
                type="checkbox"
                checked={newIncident.cctvReviewed}
                onChange={(e) => setNewIncident({ ...newIncident, cctvReviewed: e.target.checked })}
                className="rounded border-[#E6EBE7] dark:border-[#22322C] text-[#173F35]"
              />
              <span>CCTV Footage Reviewed</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-[#202B27] dark:text-[#ECF1EE]">
              <input
                type="checkbox"
                checked={newIncident.policeNotified}
                onChange={(e) => setNewIncident({ ...newIncident, policeNotified: e.target.checked })}
                className="rounded border-[#E6EBE7] dark:border-[#22322C] text-[#173F35]"
              />
              <span>Police / Authorities Notified</span>
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowIncidentModal(false)}
              className="px-4 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] font-medium hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white font-semibold"
            >
              Save Incident Log
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 1B: RESOLVE SECURITY INCIDENT (Replaces native prompt) */}
      <Modal
        open={showResolveIncidentModal && Boolean(selectedIncident)}
        onClose={() => {
          setShowResolveIncidentModal(false);
          setSelectedIncident(null);
        }}
        title={
          selectedIncident
            ? `Resolve Incident ${selectedIncident.incidentNumber}`
            : 'Resolve Security Incident'
        }
        subtitle="Document final resolution findings before closing this security occurrence."
        maxWidthClass="max-w-md"
      >
        {selectedIncident && (
          <form onSubmit={handleConfirmResolveIncident} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] space-y-1">
              <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                {selectedIncident.location} ·{' '}
                <span className="capitalize">{selectedIncident.category.replace(/_/g, ' ')}</span>
              </div>
              <p className="text-[#78837D] dark:text-[#92A199]">{selectedIncident.description}</p>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Resolution Notes
              </label>
              <textarea
                required
                rows={3}
                placeholder="Enter investigation outcome, corrective measures, and sign-off..."
                value={incidentResolutionNotes}
                onChange={(e) => setIncidentResolutionNotes(e.target.value)}
                className="w-full seam-input px-3 py-2"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
              <button
                type="button"
                onClick={() => {
                  setShowResolveIncidentModal(false);
                  setSelectedIncident(null);
                }}
                className="px-4 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] font-medium hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white font-semibold"
              >
                Confirm Resolution
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 2: ISSUE GATE PASS */}
      <Modal
        open={showGatePassModal}
        onClose={() => setShowGatePassModal(false)}
        title="Issue Visitor & Vehicle Gate Pass"
        subtitle="Authorize entry badge and record vehicle details at the security checkpoint."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreateGatePass} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Visitor Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Solomon Haile"
                value={newGatePass.visitorName}
                onChange={(e) => setNewGatePass({ ...newGatePass, visitorName: e.target.value })}
                className="w-full seam-input px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Phone Number</label>
              <input
                type="text"
                required
                placeholder="+251 91 123 4567"
                value={newGatePass.visitorPhone}
                onChange={(e) => setNewGatePass({ ...newGatePass, visitorPhone: e.target.value })}
                className="w-full seam-input px-3 py-2 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Visitor Type</label>
              <select
                value={newGatePass.visitorType}
                onChange={(e) => setNewGatePass({ ...newGatePass, visitorType: e.target.value as VisitorType })}
                className="w-full seam-input px-3 py-2"
              >
                <option value="guest_visitor">Guest Personal Visitor</option>
                <option value="vendor_supplier">Vendor / Produce Supplier</option>
                <option value="contractor">Maintenance Contractor</option>
                <option value="event_attendee">Conference / Banquet Delegate</option>
                <option value="official">Government / Official Inspector</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Destination Room / Dept
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Room 302 or Kitchen Store"
                value={newGatePass.visitingRoomOrDept}
                onChange={(e) => setNewGatePass({ ...newGatePass, visitingRoomOrDept: e.target.value })}
                className="w-full seam-input px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Vehicle License Plate (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. AA 3-B12948"
                value={newGatePass.vehiclePlate}
                onChange={(e) => setNewGatePass({ ...newGatePass, vehiclePlate: e.target.value })}
                className="w-full seam-input px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Vehicle Model / Color
              </label>
              <input
                type="text"
                placeholder="e.g. Toyota Hilux White"
                value={newGatePass.vehicleModel}
                onChange={(e) => setNewGatePass({ ...newGatePass, vehicleModel: e.target.value })}
                className="w-full seam-input px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Physical Visitor Badge #
            </label>
            <input
              type="text"
              required
              value={newGatePass.badgeNumber}
              onChange={(e) => setNewGatePass({ ...newGatePass, badgeNumber: e.target.value })}
              className="w-full seam-input px-3 py-2 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowGatePassModal(false)}
              className="px-4 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] font-medium hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white font-semibold"
            >
              Authorize & Issue Pass
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: REGISTER LOST ITEM */}
      <Modal
        open={showLostItemModal}
        onClose={() => setShowLostItemModal(false)}
        title="Register Item in Lost & Found Vault"
        subtitle="Log found property and assign a secure custodial storage locker."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleRegisterLostItem} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Item Title / Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apple iPad Pro 11-inch"
                value={newLostItem.itemName}
                onChange={(e) => setNewLostItem({ ...newLostItem, itemName: e.target.value })}
                className="w-full seam-input px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Category</label>
              <select
                value={newLostItem.category}
                onChange={(e) =>
                  setNewLostItem({ ...newLostItem, category: e.target.value as LostAndFoundCategory })
                }
                className="w-full seam-input px-3 py-2"
              >
                <option value="electronics">Electronics & Gadgets</option>
                <option value="documents_passport">Passports & ID Documents</option>
                <option value="jewelry">Jewelry & Luxury Watches</option>
                <option value="clothing">Designer Clothing & Accessories</option>
                <option value="luggage">Luggage & Handbags</option>
                <option value="other">Other Miscellaneous</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Description & Identifying Marks
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Serial # or distinctive case, color, condition..."
              value={newLostItem.description}
              onChange={(e) => setNewLostItem({ ...newLostItem, description: e.target.value })}
              className="w-full seam-input px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Found Location
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Room 204 bedside drawer"
                value={newLostItem.foundLocation}
                onChange={(e) => setNewLostItem({ ...newLostItem, foundLocation: e.target.value })}
                className="w-full seam-input px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Found By (Staff Name)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Meron Tadesse (HK)"
                value={newLostItem.foundBy}
                onChange={(e) => setNewLostItem({ ...newLostItem, foundBy: e.target.value })}
                className="w-full seam-input px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Custody Storage Locker
              </label>
              <input
                type="text"
                required
                value={newLostItem.storageLocker}
                onChange={(e) => setNewLostItem({ ...newLostItem, storageLocker: e.target.value })}
                className="w-full seam-input px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Suspected Guest / Room Phone
              </label>
              <input
                type="text"
                placeholder="e.g. +251 91 123 4567"
                value={newLostItem.guestIdOrPhone}
                onChange={(e) => setNewLostItem({ ...newLostItem, guestIdOrPhone: e.target.value })}
                className="w-full seam-input px-3 py-2 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowLostItemModal(false)}
              className="px-4 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] font-medium hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white font-semibold"
            >
              Deposit in Safekeeping
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: CLAIM LOST ITEM */}
      <Modal
        open={showClaimModal && Boolean(selectedLostItem)}
        onClose={() => {
          setShowClaimModal(false);
          setSelectedLostItem(null);
        }}
        title="Process Lost & Found Item Claim"
        subtitle="Verify claimant identity before releasing property from custody."
        maxWidthClass="max-w-md"
      >
        {selectedLostItem && (
          <form onSubmit={handleClaimLostItem} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] space-y-1">
              <div className="font-semibold text-sm text-[#202B27] dark:text-[#ECF1EE]">
                {selectedLostItem.itemName}
              </div>
              <div className="font-mono text-[#78837D] dark:text-[#92A199]">
                Item #: {selectedLostItem.itemNumber} · {selectedLostItem.storageLocker}
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Claimant Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Almaz Kebede"
                value={claimantInfo.claimantName}
                onChange={(e) => setClaimantInfo({ ...claimantInfo, claimantName: e.target.value })}
                className="w-full seam-input px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Identity Verification & Release Notes
              </label>
              <textarea
                required
                rows={3}
                placeholder="Passport/ID verified, device unlocked in presence of duty security officer..."
                value={claimantInfo.notes}
                onChange={(e) => setClaimantInfo({ ...claimantInfo, notes: e.target.value })}
                className="w-full seam-input px-3 py-2"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
              <button
                type="button"
                onClick={() => {
                  setShowClaimModal(false);
                  setSelectedLostItem(null);
                }}
                className="px-4 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] font-medium hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white font-semibold"
              >
                Complete Release & Claim
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 5: LOG COMPLAINT TICKET */}
      <Modal
        open={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        title="Log Guest Complaint & Start SLA Clock"
        subtitle="Assign departmental ownership and recovery target SLA."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreateComplaint} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Guest Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Yohannes Girma"
                value={newComplaint.guestName}
                onChange={(e) => setNewComplaint({ ...newComplaint, guestName: e.target.value })}
                className="w-full seam-input px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Room Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 204"
                value={newComplaint.roomNumber}
                onChange={(e) => setNewComplaint({ ...newComplaint, roomNumber: e.target.value })}
                className="w-full seam-input px-3 py-2 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Issue Category
              </label>
              <select
                value={newComplaint.category}
                onChange={(e) =>
                  setNewComplaint({ ...newComplaint, category: e.target.value as ComplaintCategory })
                }
                className="w-full seam-input px-3 py-2"
              >
                <option value="room_comfort">Room Comfort & Temperature</option>
                <option value="noise">Noise Disturbance</option>
                <option value="food_beverage">Food & Beverage Delay / Quality</option>
                <option value="staff_service">Staff Attitude / Delay</option>
                <option value="billing">Billing & Folio Discrepancy</option>
                <option value="maintenance">Plumbing / Electrical Defect</option>
                <option value="wifi_amenity">Wi-Fi & Digital Amenities</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Department Attribution
              </label>
              <select
                value={newComplaint.departmentAttribution}
                onChange={(e) =>
                  setNewComplaint({ ...newComplaint, departmentAttribution: e.target.value })
                }
                className="w-full seam-input px-3 py-2"
              >
                <option value="Housekeeping">Housekeeping</option>
                <option value="Front Desk">Front Desk</option>
                <option value="Kitchen">Kitchen & Production</option>
                <option value="Restaurant & Bar">Restaurant & Bar</option>
                <option value="Maintenance">Engineering & Maintenance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Priority</label>
              <select
                value={newComplaint.priority}
                onChange={(e) =>
                  setNewComplaint({
                    ...newComplaint,
                    priority: e.target.value as 'urgent' | 'high' | 'medium' | 'low',
                  })
                }
                className="w-full seam-input px-3 py-2"
              >
                <option value="urgent">Urgent (&lt; 20 Mins)</option>
                <option value="high">High (&lt; 30 Mins)</option>
                <option value="medium">Medium (&lt; 45 Mins)</option>
                <option value="low">Low (&lt; 60 Mins)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Target SLA (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={180}
                value={newComplaint.slaMinutes}
                onChange={(e) => setNewComplaint({ ...newComplaint, slaMinutes: Number(e.target.value) })}
                className="w-full seam-input px-3 py-2 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Complaint Description
            </label>
            <textarea
              required
              rows={3}
              placeholder="Specific details of the guest grievance..."
              value={newComplaint.description}
              onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
              className="w-full seam-input px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Assigned Recovery Lead
            </label>
            <input
              type="text"
              required
              value={newComplaint.assignedTo}
              onChange={(e) => setNewComplaint({ ...newComplaint, assignedTo: e.target.value })}
              className="w-full seam-input px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowComplaintModal(false)}
              className="px-4 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] font-medium hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white font-semibold"
            >
              Open Ticket & Start Timer
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 6: RESOLVE COMPLAINT & ISSUE COMPENSATION */}
      <Modal
        open={showResolveComplaintModal && Boolean(selectedComplaint)}
        onClose={() => {
          setShowResolveComplaintModal(false);
          setSelectedComplaint(null);
        }}
        title="Service Recovery Resolution & Compensation"
        subtitle="Close SLA ticket and optionally authorize a guest recovery gesture."
        maxWidthClass="max-w-lg"
      >
        {selectedComplaint && (
          <form onSubmit={handleResolveComplaint} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] space-y-1">
              <div className="font-semibold text-sm text-[#202B27] dark:text-[#ECF1EE]">
                <span className="font-mono">{selectedComplaint.ticketNumber}</span> — {selectedComplaint.guestName}
              </div>
              <p className="text-[#78837D] dark:text-[#92A199]">{selectedComplaint.description}</p>
              <div className="font-medium text-[#173F35] dark:text-[#C6A15B]">
                Attributed to: {selectedComplaint.departmentAttribution}
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Resolution Action & Explanation
              </label>
              <textarea
                required
                rows={2}
                placeholder="Explain steps taken with the guest and departmental corrective action..."
                value={resolutionData.resolutionNotes}
                onChange={(e) => setResolutionData({ ...resolutionData, resolutionNotes: e.target.value })}
                className="w-full seam-input px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                  Compensation Type
                </label>
                <select
                  value={resolutionData.compensationType}
                  onChange={(e) =>
                    setResolutionData({
                      ...resolutionData,
                      compensationType: e.target.value as
                        | 'none'
                        | 'loyalty_points'
                        | 'complimentary_meal'
                        | 'room_discount'
                        | 'apology_amenity',
                    })
                  }
                  className="w-full seam-input px-3 py-2"
                >
                  <option value="none">No Monetary Compensation</option>
                  <option value="complimentary_meal">Complimentary Meal / Beverage</option>
                  <option value="loyalty_points">Loyalty Bonus Points Credit</option>
                  <option value="room_discount">Room Rate Billing Discount</option>
                  <option value="apology_amenity">VIP Fruit / Pastry Amenity Basket</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                  Estimated Value ({currency} / Points)
                </label>
                <input
                  type="number"
                  min={0}
                  value={resolutionData.compensationValue}
                  onChange={(e) =>
                    setResolutionData({ ...resolutionData, compensationValue: Number(e.target.value) })
                  }
                  className="w-full seam-input px-3 py-2 font-mono"
                />
              </div>
            </div>

            {resolutionData.compensationType !== 'none' && (
              <div>
                <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                  Voucher / Item Detail
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complimentary dinner for two at Main Restaurant"
                  value={resolutionData.compensationDetail}
                  onChange={(e) =>
                    setResolutionData({ ...resolutionData, compensationDetail: e.target.value })
                  }
                  className="w-full seam-input px-3 py-2"
                />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer text-[#202B27] dark:text-[#ECF1EE] pt-1">
              <input
                type="checkbox"
                checked={resolutionData.guestSatisfied}
                onChange={(e) => setResolutionData({ ...resolutionData, guestSatisfied: e.target.checked })}
                className="rounded border-[#E6EBE7] dark:border-[#22322C] text-[#173F35]"
              />
              <span>Guest verbally acknowledged and confirmed satisfaction with recovery</span>
            </label>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
              <button
                type="button"
                onClick={() => {
                  setShowResolveComplaintModal(false);
                  setSelectedComplaint(null);
                }}
                className="px-4 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] font-medium hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white font-semibold"
              >
                Confirm Resolution & Close Ticket
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default SecurityAndServiceRecovery;
