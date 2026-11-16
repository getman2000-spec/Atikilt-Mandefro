/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Guest Experience, CRM, VIP Profiles, Loyalty Rewards & Spa Wellness
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Award,
  Heart,
  Star,
  Plus,
  Gift,
  Clock,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  Hotel,
  GuestProfile,
  VIPTier,
  LoyaltyTransaction,
  SpaAppointment,
} from '../../types/saas';
import { CurrentUser } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { PageHeader, KpiCard, StatusBadge, Modal, DataTable, DataTableColumn, EmptyState, SampleDataBadge } from '../ui';
import { formatCurrency, maskIdNumber } from '../../utils/formatters';

interface GuestCRMAndSpaProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

export const GuestCRMAndSpa: React.FC<GuestCRMAndSpaProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'guests' | 'loyalty' | 'spa' | 'feedback'>('guests');
  const [refreshKey, setRefreshKey] = useState(0);
  const currency = activeHotel?.operationalSettings?.currency || 'ETB';
  const hotelId = activeHotel?.id || '';

  const [vipTierFilter, setVipTierFilter] = useState<string>('all');

  const [isNewGuestModalOpen, setIsNewGuestModalOpen] = useState(false);
  const [selectedGuestForDrawer, setSelectedGuestForDrawer] = useState<GuestProfile | null>(null);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [selectedRedeemGuestId, setSelectedRedeemGuestId] = useState<string>('');
  const [selectedRewardId, setSelectedRewardId] = useState<string>('');
  const [isBookSpaModalOpen, setIsBookSpaModalOpen] = useState(false);
  const [feedbackReplyModalId, setFeedbackReplyModalId] = useState<string | null>(null);
  const [managementReplyText, setManagementReplyText] = useState('');

  const [newGuestForm, setNewGuestForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    nationality: 'Ethiopian',
    idOrPassportNumber: '',
    companyAffiliation: '',
    vipTier: 'standard' as VIPTier,
    roomLocation: 'high_floor' as 'high_floor' | 'low_floor' | 'quiet_corner' | 'near_elevator',
    pillowType: 'feather' as 'feather' | 'foam' | 'memory_foam' | 'hypoallergenic',
    dietaryRestrictions: '',
    favoriteDrink: '',
    specialNotes: '',
  });

  const [newSpaForm, setNewSpaForm] = useState({
    guestId: '',
    guestName: '',
    roomId: '',
    roomNumber: '',
    treatmentId: '',
    therapistName: 'Tigist Assefa (Senior Spa Therapist)',
    treatmentRoom: 'Lotus Sanctuary Suite #1',
    date: new Date().toISOString().slice(0, 10),
    startTime: '14:00',
    chargeToRoomFolio: true,
    notes: '',
  });

  useEffect(() => {
    setVipTierFilter('all');
    setSelectedGuestForDrawer(null);
    setFeedbackReplyModalId(null);
    setRefreshKey((k) => k + 1);
  }, [hotelId]);

  const guestProfiles = useMemo(() => {
    if (!hotelId) return [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return saasStorage.getGuestProfiles(hotelId);
  }, [hotelId, refreshKey]);

  const loyaltyRewards = useMemo(() => {
    if (!hotelId) return [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return saasStorage.getLoyaltyRewards(hotelId);
  }, [hotelId, refreshKey]);

  const loyaltyTransactions = useMemo(() => {
    if (!hotelId) return [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return saasStorage.getLoyaltyTransactions(hotelId);
  }, [hotelId, refreshKey]);

  const spaTreatments = useMemo(() => {
    if (!hotelId) return [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return saasStorage.getSpaTreatments(hotelId);
  }, [hotelId, refreshKey]);

  const spaAppointments = useMemo(() => {
    if (!hotelId) return [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return saasStorage.getSpaAppointments(hotelId);
  }, [hotelId, refreshKey]);

  const guestFeedbacks = useMemo(() => {
    if (!hotelId) return [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return saasStorage.getGuestFeedbacks(hotelId);
  }, [hotelId, refreshKey]);

  const rooms = useMemo(() => {
    if (!hotelId) return [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return saasStorage.getRooms(hotelId);
  }, [hotelId, refreshKey]);

  const filteredGuests = useMemo(() => {
    return guestProfiles.filter((g) => vipTierFilter === 'all' || g.vipTier === vipTierFilter);
  }, [guestProfiles, vipTierFilter]);

  const actor = useMemo(
    () => ({
      email: currentUser?.email || 'admin@seamhotel.com',
      fullName: currentUser?.fullName || 'Hotel Admin',
      role: currentUser?.role || 'hotel_admin',
    }),
    [currentUser]
  );

  if (!activeHotel) return null;

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  const getVipBadge = (tier: VIPTier) => {
    switch (tier) {
      case 'presidential':
        return <StatusBadge label="Presidential VIP" tone="warning" />;
      case 'platinum':
        return <StatusBadge label="Platinum VIP" tone="forest" />;
      case 'gold':
        return <StatusBadge label="Gold VIP" tone="warning" />;
      case 'silver':
        return <StatusBadge label="Silver" tone="neutral" />;
      default:
        return <StatusBadge label="Standard" tone="neutral" />;
    }
  };

  const handleCreateGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestForm.fullName.trim()) return;

    const rand = Math.floor(1000 + Math.random() * 9000);
    const guestCode = `GST-${rand}`;

    const newGuest: GuestProfile = {
      id: 'gst_' + Math.random().toString(36).substring(2, 9),
      hotelId,
      guestCode,
      fullName: newGuestForm.fullName,
      email: newGuestForm.email,
      phone: newGuestForm.phone,
      nationality: newGuestForm.nationality || undefined,
      idOrPassportNumber: newGuestForm.idOrPassportNumber || undefined,
      companyAffiliation: newGuestForm.companyAffiliation || undefined,
      vipTier: newGuestForm.vipTier,
      loyaltyPointsBalance:
        newGuestForm.vipTier === 'platinum' ? 1000 : newGuestForm.vipTier === 'gold' ? 500 : 100,
      lifetimeStaysCount: 1,
      lifetimeSpend: 0,
      currency,
      preferences: {
        roomLocation: newGuestForm.roomLocation,
        pillowType: newGuestForm.pillowType,
        dietaryRestrictions: newGuestForm.dietaryRestrictions
          ? newGuestForm.dietaryRestrictions.split(',').map((s) => s.trim())
          : undefined,
        favoriteDrink: newGuestForm.favoriteDrink || undefined,
        specialNotes: newGuestForm.specialNotes || undefined,
      },
      status:
        newGuestForm.vipTier === 'platinum' || newGuestForm.vipTier === 'presidential'
          ? 'vip_flagged'
          : 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saasStorage.saveGuestProfile(newGuest, actor);
    setIsNewGuestModalOpen(false);
    setNewGuestForm({
      fullName: '',
      email: '',
      phone: '',
      nationality: 'Ethiopian',
      idOrPassportNumber: '',
      companyAffiliation: '',
      vipTier: 'standard',
      roomLocation: 'high_floor',
      pillowType: 'feather',
      dietaryRestrictions: '',
      favoriteDrink: '',
      specialNotes: '',
    });
    triggerRefresh();
    toast(`Created guest profile ${guestCode} for ${newGuest.fullName}`, { variant: 'success' });
  };

  const handleExecuteRedemption = () => {
    if (!selectedRedeemGuestId || !selectedRewardId) return;
    const res = saasStorage.redeemLoyaltyReward(selectedRedeemGuestId, selectedRewardId, actor);
    if (res.success) {
      toast(res.message, { variant: 'success' });
      setIsRedeemModalOpen(false);
      setSelectedRedeemGuestId('');
      setSelectedRewardId('');
    } else {
      toast(res.message, { variant: 'error' });
    }
    triggerRefresh();
  };

  const handleBookSpa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaForm.treatmentId) return;

    const treatment = spaTreatments.find((t) => t.id === newSpaForm.treatmentId);
    if (!treatment) return;

    let guestName = newSpaForm.guestName;
    if (newSpaForm.guestId) {
      const g = guestProfiles.find((gp) => gp.id === newSpaForm.guestId);
      if (g) guestName = g.fullName;
    }

    let roomNum = newSpaForm.roomNumber;
    if (newSpaForm.roomId) {
      const r = rooms.find((rm) => rm.id === newSpaForm.roomId);
      if (r) roomNum = r.roomNumber;
    }

    saasStorage.createSpaAppointment(
      {
        hotelId,
        guestId: newSpaForm.guestId || undefined,
        guestName: guestName || 'Walk-in Spa Guest',
        roomId: newSpaForm.roomId || undefined,
        roomNumber: roomNum || undefined,
        treatmentId: treatment.id,
        treatmentName: treatment.name,
        durationMinutes: treatment.durationMinutes,
        therapistName: newSpaForm.therapistName,
        treatmentRoom: newSpaForm.treatmentRoom,
        date: newSpaForm.date,
        startTime: newSpaForm.startTime,
        endTime: '15:00',
        price: treatment.price,
        currency,
        status: 'scheduled',
        chargeToRoomFolio: newSpaForm.chargeToRoomFolio && !!newSpaForm.roomId,
        paymentStatus: newSpaForm.chargeToRoomFolio && !!newSpaForm.roomId ? 'charged_to_room' : 'pending',
        notes: newSpaForm.notes || undefined,
      },
      actor
    );

    setIsBookSpaModalOpen(false);
    triggerRefresh();
    toast(`Scheduled ${treatment.name} for ${guestName || 'Guest'}`, { variant: 'success' });
  };

  const handleSendFeedbackResponse = (feedbackId: string) => {
    if (!managementReplyText.trim()) return;
    saasStorage.respondToFeedback(feedbackId, managementReplyText, actor);
    setFeedbackReplyModalId(null);
    setManagementReplyText('');
    triggerRefresh();
    toast('Official management response published', { variant: 'success' });
  };

  const promotersCount = guestFeedbacks.filter((f) => f.npsScore >= 9).length;
  const detractorsCount = guestFeedbacks.filter((f) => f.npsScore <= 6).length;
  const npsScore =
    guestFeedbacks.length > 0
      ? Math.round(((promotersCount - detractorsCount) / guestFeedbacks.length) * 100)
      : 0;
  const totalPointsInCirculation = guestProfiles.reduce((sum, g) => sum + g.loyaltyPointsBalance, 0);
  const totalSpaRevenue = spaAppointments.reduce(
    (sum, a) => sum + (a.status === 'completed' ? a.price : 0),
    0
  );

  const guestColumns: DataTableColumn<GuestProfile>[] = [
    {
      key: 'code',
      header: 'Guest & Code',
      sortValue: (g) => g.fullName,
      render: (g) => (
        <div>
          <span className="font-mono text-[11px] font-semibold text-[#78837D]">{g.guestCode}</span>
          <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{g.fullName}</div>
          {g.satisfactionScore && (
            <div className="flex items-center text-[#C6A15B] text-[10px] mt-0.5 font-mono">
              <Star className="w-3 h-3 fill-[#C6A15B] mr-0.5" />
              <span>{g.satisfactionScore} / 5</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact & Affiliation',
      render: (g) => (
        <div>
          <div className="text-[#202B27] dark:text-[#ECF1EE]">{g.email}</div>
          <div className="text-[11px] text-[#78837D] font-mono">
            {g.phone}
            {g.idOrPassportNumber && ` · ID ${maskIdNumber(g.idOrPassportNumber)}`}
          </div>
          {g.companyAffiliation && (
            <div className="text-[11px] font-medium text-[#173F35] dark:text-[#C6A15B] mt-0.5">
              {g.companyAffiliation}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'vip',
      header: 'VIP Tier',
      sortValue: (g) => g.vipTier,
      render: (g) => getVipBadge(g.vipTier),
    },
    {
      key: 'points',
      header: 'Loyalty Pts',
      align: 'right',
      sortValue: (g) => g.loyaltyPointsBalance,
      render: (g) => (
        <span className="font-mono tabular-nums font-semibold text-[#173F35] dark:text-[#C6A15B]">
          {g.loyaltyPointsBalance.toLocaleString()} pts
        </span>
      ),
    },
    {
      key: 'stays',
      header: 'Stays',
      align: 'right',
      sortValue: (g) => g.lifetimeStaysCount,
      render: (g) => (
        <span className="font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE]">
          {g.lifetimeStaysCount}
        </span>
      ),
    },
    {
      key: 'spend',
      header: 'Lifetime Spend',
      align: 'right',
      sortValue: (g) => g.lifetimeSpend,
      render: (g) => (
        <span className="font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE]">
          {formatCurrency(g.lifetimeSpend, currency)}
        </span>
      ),
    },
    {
      key: 'prefs',
      header: 'Key Preferences',
      render: (g) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {g.preferences.roomLocation && (
            <span className="px-1.5 py-0.5 rounded-[5px] bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#78837D] text-[10px] capitalize">
              {g.preferences.roomLocation.replace(/_/g, ' ')}
            </span>
          )}
          {g.preferences.pillowType && (
            <span className="px-1.5 py-0.5 rounded-[5px] bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#78837D] text-[10px] capitalize">
              {g.preferences.pillowType.replace(/_/g, ' ')} pillow
            </span>
          )}
          {g.preferences.dietaryRestrictions?.map((d, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 rounded-[5px] bg-[#EEF5F0] dark:bg-[#15291E] text-[#2F6B48] dark:text-[#66A881] text-[10px]"
            >
              {d}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      render: (g) => (
        <button
          onClick={() => setSelectedGuestForDrawer(g)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[7px] border border-[#E6EBE7] dark:border-[#22322C] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] text-[#173F35] dark:text-[#C6A15B] text-[11px] font-semibold"
        >
          <span>Profile</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      ),
    },
  ];

  const loyaltyTxColumns: DataTableColumn<LoyaltyTransaction>[] = [
    {
      key: 'date',
      header: 'Date',
      sortValue: (tx) => tx.date,
      render: (tx) => (
        <span className="font-mono text-[11px] text-[#78837D]">
          {new Date(tx.date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'guest',
      header: 'Guest Name',
      sortValue: (tx) => tx.guestName,
      render: (tx) => <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{tx.guestName}</span>,
    },
    {
      key: 'desc',
      header: 'Description',
      render: (tx) => <span className="text-[#78837D]">{tx.description}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (tx) => <StatusBadge label={tx.type} tone={tx.points > 0 ? 'success' : 'neutral'} />,
    },
    {
      key: 'delta',
      header: 'Points Delta',
      align: 'right',
      sortValue: (tx) => tx.points,
      render: (tx) => (
        <span
          className={`font-mono tabular-nums font-semibold ${
            tx.points > 0 ? 'text-[#2F6B48] dark:text-[#66A881]' : 'text-[#B6463D] dark:text-[#E27A71]'
          }`}
        >
          {tx.points > 0 ? `+${tx.points}` : tx.points} pts
        </span>
      ),
    },
    {
      key: 'by',
      header: 'Processed By',
      render: (tx) => <span className="text-[#78837D]">{tx.performedBy}</span>,
    },
  ];

  const spaColumns: DataTableColumn<SpaAppointment>[] = [
    {
      key: 'num',
      header: 'Appt #',
      sortValue: (a) => a.appointmentNumber,
      render: (ap) => (
        <span className="font-mono font-semibold text-[#78837D]">{ap.appointmentNumber}</span>
      ),
    },
    {
      key: 'guest',
      header: 'Guest & Room',
      sortValue: (ap) => ap.guestName,
      render: (ap) => (
        <div>
          <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{ap.guestName}</div>
          {ap.roomNumber && (
            <span className="text-[11px] font-mono text-[#2F6B48] dark:text-[#66A881]">
              Room {ap.roomNumber} · Folio Charged
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'treatment',
      header: 'Treatment',
      sortValue: (ap) => ap.treatmentName,
      render: (ap) => <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{ap.treatmentName}</span>,
    },
    {
      key: 'therapist',
      header: 'Therapist & Suite',
      render: (ap) => (
        <div>
          <div className="text-[#202B27] dark:text-[#ECF1EE]">{ap.therapistName}</div>
          <div className="text-[11px] text-[#78837D]">{ap.treatmentRoom}</div>
        </div>
      ),
    },
    {
      key: 'when',
      header: 'Date & Time',
      sortValue: (ap) => `${ap.date} ${ap.startTime}`,
      render: (ap) => (
        <div className="font-mono text-[11px]">
          <div className="text-[#202B27] dark:text-[#ECF1EE]">{ap.date}</div>
          <div className="text-[#78837D]">{ap.startTime}</div>
        </div>
      ),
    },
    {
      key: 'fee',
      header: 'Fee',
      align: 'right',
      sortValue: (ap) => ap.price,
      render: (ap) => (
        <span className="font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE]">
          {formatCurrency(ap.price, currency)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (ap) => (
        <StatusBadge
          label={ap.status}
          tone={ap.status === 'completed' ? 'success' : 'forest'}
        />
      ),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      render: (ap) =>
        ap.status !== 'completed' ? (
          <button
            onClick={() => {
              saasStorage.updateSpaAppointmentStatus(ap.id, 'completed', actor);
              triggerRefresh();
              toast(`Completed spa appointment ${ap.appointmentNumber}`, { variant: 'success' });
            }}
            className="px-2.5 py-1.5 rounded-[7px] bg-[#173F35] hover:bg-[#12322A] text-white text-[11px] font-semibold"
          >
            Mark Completed
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Guest Services', 'Guest CRM, Spa & Loyalty']}
        title="Guest CRM, Loyalty Rewards & Spa Wellness"
        subtitle={`${activeHotel.name} · VIP preference profiles, loyalty voucher redemption, spa scheduling, and post-stay NPS.`}
        meta={<SampleDataBadge />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsNewGuestModalOpen(true)}
              className="px-3.5 py-2 rounded-[10px] bg-[#173F35] hover:bg-[#12322A] text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Guest Profile</span>
            </button>
            <button
              onClick={() => {
                if (spaTreatments.length > 0) {
                  setNewSpaForm((prev) => ({ ...prev, treatmentId: spaTreatments[0].id }));
                }
                setIsBookSpaModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] text-[#202B27] dark:text-[#ECF1EE] text-xs font-semibold flex items-center gap-1.5"
            >
              <Heart className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B]" />
              <span>Book Spa Treatment</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Net Promoter Score"
          value={`+${npsScore}`}
          helper={`${promotersCount} promoters · ${detractorsCount} detractors`}
          deltaTone="positive"
          icon={TrendingUp}
        />
        <KpiCard
          label="VIP Profiles"
          value={guestProfiles.filter((g) => g.vipTier !== 'standard').length}
          helper="Gold, Platinum & Presidential"
          deltaTone="forest"
          icon={Users}
        />
        <KpiCard
          label="Loyalty Points Pool"
          value={`${totalPointsInCirculation.toLocaleString()} pts`}
          helper="Redeemable for upgrades & spa"
          deltaTone="neutral"
          icon={Award}
        />
        <KpiCard
          label="Spa Completed Revenue"
          value={formatCurrency(totalSpaRevenue, currency)}
          helper={`${spaAppointments.length} booked treatments`}
          deltaTone="positive"
          icon={DollarSign}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-[10px] w-fit flex-wrap">
        <button
          onClick={() => setActiveTab('guests')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-[7px] transition-colors flex items-center gap-1.5 ${
            activeTab === 'guests'
              ? 'bg-[#173F35] text-white'
              : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Guest Directory ({guestProfiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('loyalty')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-[7px] transition-colors flex items-center gap-1.5 ${
            activeTab === 'loyalty'
              ? 'bg-[#173F35] text-white'
              : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Loyalty Rewards ({loyaltyRewards.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('spa')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-[7px] transition-colors flex items-center gap-1.5 ${
            activeTab === 'spa'
              ? 'bg-[#173F35] text-white'
              : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Spa &amp; Wellness ({spaAppointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-[7px] transition-colors flex items-center gap-1.5 ${
            activeTab === 'feedback'
              ? 'bg-[#173F35] text-white'
              : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Feedback &amp; NPS (+{npsScore})</span>
        </button>
      </div>

      {/* TAB 1: GUEST DIRECTORY */}
      {activeTab === 'guests' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <select
              value={vipTierFilter}
              onChange={(e) => setVipTierFilter(e.target.value)}
              className="seam-input text-xs"
            >
              <option value="all">All VIP Tiers</option>
              <option value="presidential">Presidential VIP</option>
              <option value="platinum">Platinum</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="standard">Standard</option>
            </select>

            <button
              onClick={() => {
                if (guestProfiles.length > 0 && loyaltyRewards.length > 0) {
                  setSelectedRedeemGuestId(guestProfiles[0].id);
                  setSelectedRewardId(loyaltyRewards[0].id);
                }
                setIsRedeemModalOpen(true);
              }}
              className="inline-flex items-center px-3.5 py-1.5 rounded-[8px] text-xs font-semibold bg-[#C6A15B] hover:bg-[#B28D49] text-[#173F35] gap-1.5"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Redeem Loyalty Reward</span>
            </button>
          </div>

          <DataTable
            data={filteredGuests}
            columns={guestColumns}
            keyExtractor={(g) => g.id}
            searchPlaceholder="Search guest name, code, phone, email, company..."
            searchFilter={(g, q) =>
              g.guestCode.toLowerCase().includes(q) ||
              g.fullName.toLowerCase().includes(q) ||
              g.email.toLowerCase().includes(q) ||
              g.phone.toLowerCase().includes(q) ||
              (g.companyAffiliation || '').toLowerCase().includes(q)
            }
            emptyTitle="No guest profiles found"
            emptyDescription="Add a guest profile or adjust your VIP tier filter."
          />
        </div>
      )}

      {/* TAB 2: LOYALTY REWARDS */}
      {activeTab === 'loyalty' && (
        <div className="space-y-5">
          <div className="seam-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#173F35] rounded-[10px] text-[#C6A15B]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-[#202B27] dark:text-[#ECF1EE] text-sm">
                  {activeHotel.name} Diamond Guest Rewards Catalog
                </h3>
                <p className="text-xs text-[#78837D]">
                  Guests earn 1 Loyalty Point per 10 {currency} spent across rooms, outlets, events, and spa.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (guestProfiles.length > 0 && loyaltyRewards.length > 0) {
                  setSelectedRedeemGuestId(guestProfiles[0].id);
                  setSelectedRewardId(loyaltyRewards[0].id);
                }
                setIsRedeemModalOpen(true);
              }}
              className="px-3.5 py-2 bg-[#C6A15B] hover:bg-[#B28D49] text-[#173F35] rounded-[8px] text-xs font-semibold flex items-center gap-1.5 shrink-0"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Redeem Voucher</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loyaltyRewards.map((reward) => (
              <div
                key={reward.id}
                className="seam-surface p-5 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#78837D] bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] px-2 py-0.5 rounded-[5px]">
                      {reward.category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#173F35] dark:text-[#C6A15B]">
                      {reward.pointsRequired} pts
                    </span>
                  </div>

                  <h4 className="font-semibold text-[#202B27] dark:text-[#ECF1EE] text-sm mt-2.5">
                    {reward.title}
                  </h4>
                  <p className="text-xs text-[#78837D] mt-1">{reward.description}</p>
                </div>

                <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between">
                  <span className="text-[11px] text-[#78837D]">All active tiers</span>
                  <button
                    onClick={() => {
                      setSelectedRewardId(reward.id);
                      if (guestProfiles.length > 0) setSelectedRedeemGuestId(guestProfiles[0].id);
                      setIsRedeemModalOpen(true);
                    }}
                    className="text-xs text-[#173F35] dark:text-[#C6A15B] font-semibold hover:underline"
                  >
                    Select &amp; Redeem
                  </button>
                </div>
              </div>
            ))}
          </div>

          <DataTable
            data={loyaltyTransactions}
            columns={loyaltyTxColumns}
            keyExtractor={(tx) => tx.id}
            searchPlaceholder="Search loyalty transactions..."
            searchFilter={(tx, q) =>
              tx.guestName.toLowerCase().includes(q) || tx.description.toLowerCase().includes(q)
            }
            emptyTitle="No loyalty transactions recorded"
            emptyDescription="Redeem a guest voucher or accrue stay points to view ledger entries."
          />
        </div>
      )}

      {/* TAB 3: SPA & WELLNESS */}
      {activeTab === 'spa' && (
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-[#202B27] dark:text-[#ECF1EE] text-sm">
                Spa Treatment &amp; Wellness Menu
              </h3>
              <button
                onClick={() => {
                  if (spaTreatments.length > 0) {
                    setNewSpaForm((prev) => ({ ...prev, treatmentId: spaTreatments[0].id }));
                  }
                  setIsBookSpaModalOpen(true);
                }}
                className="inline-flex items-center px-3 py-1.5 bg-[#173F35] hover:bg-[#12322A] text-white rounded-[8px] text-xs font-semibold gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book Treatment</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {spaTreatments.map((tr) => (
                <div key={tr.id} className="seam-surface p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[10px] font-semibold text-[#78837D] bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] px-2 py-0.5 rounded-[5px]">
                        {tr.code}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#173F35] dark:text-[#C6A15B] tabular-nums">
                        {formatCurrency(tr.price, currency)}
                      </span>
                    </div>

                    <h4 className="font-semibold text-[#202B27] dark:text-[#ECF1EE] text-sm mt-2">
                      {tr.name}
                    </h4>
                    <p className="text-xs text-[#78837D] mt-1 line-clamp-2">{tr.description}</p>
                    <div className="mt-2 text-[11px] text-[#78837D] flex items-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{tr.durationMinutes} min</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between">
                    <span className="text-[11px] text-[#78837D] capitalize">
                      {tr.category.replace(/_/g, ' ')}
                    </span>
                    <button
                      onClick={() => {
                        setNewSpaForm((prev) => ({ ...prev, treatmentId: tr.id }));
                        setIsBookSpaModalOpen(true);
                      }}
                      className="text-xs text-[#173F35] dark:text-[#C6A15B] font-semibold hover:underline"
                    >
                      Book Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DataTable
            data={spaAppointments}
            columns={spaColumns}
            keyExtractor={(ap) => ap.id}
            searchPlaceholder="Search guest, appointment #, therapist..."
            searchFilter={(ap, q) =>
              ap.guestName.toLowerCase().includes(q) ||
              ap.appointmentNumber.toLowerCase().includes(q) ||
              ap.treatmentName.toLowerCase().includes(q)
            }
            emptyTitle="No spa appointments scheduled"
            emptyDescription="Book a wellness session above to schedule therapists and suites."
          />
        </div>
      )}

      {/* TAB 4: GUEST FEEDBACK & NPS */}
      {activeTab === 'feedback' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <KpiCard label="Net Promoter Score" value={`+${npsScore}`} helper="World class > +70" deltaTone="forest" />
            <KpiCard label="Promoters (9–10)" value={promotersCount} helper="Brand advocates" deltaTone="positive" />
            <KpiCard
              label="Passives (7–8)"
              value={guestFeedbacks.filter((f) => f.npsScore === 7 || f.npsScore === 8).length}
              helper="Satisfied"
              deltaTone="neutral"
            />
            <KpiCard
              label="Detractors (1–6)"
              value={detractorsCount}
              helper="Service recovery priority"
              deltaTone={detractorsCount > 0 ? 'critical' : 'neutral'}
            />
          </div>

          {guestFeedbacks.length === 0 ? (
            <EmptyState title="No post-stay surveys collected" description="Survey responses from checked-out guests appear here." />
          ) : (
            <div className="space-y-3.5">
              {guestFeedbacks.map((fb) => (
                <div key={fb.id} className="seam-surface p-5 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-[#202B27] dark:text-[#ECF1EE] text-sm">{fb.guestName}</strong>
                        {fb.roomNumber && (
                          <span className="text-[11px] font-mono text-[#78837D] bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] px-2 py-0.5 rounded-[5px]">
                            Room {fb.roomNumber}
                          </span>
                        )}
                        <span className="text-[11px] px-2 py-0.5 rounded-[5px] font-mono font-semibold bg-[#FDF7EC] dark:bg-[#2A2012] text-[#9E6B1E] dark:text-[#E5B869]">
                          NPS {fb.npsScore}/10
                        </span>
                      </div>
                      <div className="flex items-center text-[#C6A15B] mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < fb.overallRating ? 'fill-[#C6A15B] text-[#C6A15B]' : 'text-[#E6EBE7] dark:text-[#22322C]'
                            }`}
                          />
                        ))}
                        <span className="text-[11px] font-mono text-[#78837D] ml-2">{fb.date}</span>
                      </div>
                    </div>

                    <StatusBadge
                      label={fb.status}
                      tone={fb.status === 'reviewed' || fb.status === 'resolved' ? 'success' : 'warning'}
                    />
                  </div>

                  <p className="text-xs text-[#202B27] dark:text-[#ECF1EE] bg-[#F6F8F6] dark:bg-[#192622] p-3 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] italic">
                    "{fb.comments}"
                  </p>

                  {fb.managementResponse ? (
                    <div className="bg-[#EEF5F0] dark:bg-[#15291E] border border-[#CDE0D3] dark:border-[#274B36] rounded-[8px] p-3 text-xs space-y-1">
                      <span className="font-semibold text-[#2F6B48] dark:text-[#66A881] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Management Response
                      </span>
                      <p className="text-[#202B27] dark:text-[#ECF1EE]">{fb.managementResponse}</p>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <button
                        onClick={() => setFeedbackReplyModalId(fb.id)}
                        className="inline-flex items-center text-xs font-semibold text-white bg-[#173F35] hover:bg-[#12322A] px-3 py-1.5 rounded-[8px] gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Write Management Reply</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: GUEST PROFILE DRAWER */}
      <Modal
        open={Boolean(selectedGuestForDrawer)}
        onClose={() => setSelectedGuestForDrawer(null)}
        title={selectedGuestForDrawer ? selectedGuestForDrawer.fullName : 'Guest Profile'}
        subtitle={
          selectedGuestForDrawer
            ? `${selectedGuestForDrawer.guestCode} · ${selectedGuestForDrawer.email}`
            : undefined
        }
        maxWidthClass="max-w-lg"
      >
        {selectedGuestForDrawer && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              {getVipBadge(selectedGuestForDrawer.vipTier)}
              <span className="font-mono font-bold text-[#173F35] dark:text-[#C6A15B]">
                {selectedGuestForDrawer.loyaltyPointsBalance.toLocaleString()} pts
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-[10px] bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C]">
              <div>
                <span className="text-[#78837D] block">Phone</span>
                <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  {selectedGuestForDrawer.phone}
                </span>
              </div>
              <div>
                <span className="text-[#78837D] block">Lifetime Spend</span>
                <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  {formatCurrency(selectedGuestForDrawer.lifetimeSpend, currency)} ({selectedGuestForDrawer.lifetimeStaysCount} stays)
                </span>
              </div>
              <div>
                <span className="text-[#78837D] block">Affiliation</span>
                <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                  {selectedGuestForDrawer.companyAffiliation || 'Individual Guest'}
                </span>
              </div>
              <div>
                <span className="text-[#78837D] block">Nationality</span>
                <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                  {selectedGuestForDrawer.nationality || '—'}
                </span>
              </div>
              {selectedGuestForDrawer.idOrPassportNumber && (
                <div>
                  <span className="text-[#78837D] block">National ID / Passport</span>
                  <span className="font-mono font-medium text-[#202B27] dark:text-[#ECF1EE]">
                    {maskIdNumber(selectedGuestForDrawer.idOrPassportNumber)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">Stay Preferences</div>
              <div className="grid grid-cols-2 gap-2 text-[#78837D]">
                <div>Room Location: <strong className="text-[#202B27] dark:text-[#ECF1EE] capitalize">{selectedGuestForDrawer.preferences.roomLocation?.replace(/_/g, ' ') || 'Standard'}</strong></div>
                <div>Pillow Type: <strong className="text-[#202B27] dark:text-[#ECF1EE] capitalize">{selectedGuestForDrawer.preferences.pillowType?.replace(/_/g, ' ') || 'Standard'}</strong></div>
                <div>Welcome Drink: <strong className="text-[#202B27] dark:text-[#ECF1EE]">{selectedGuestForDrawer.preferences.favoriteDrink || '—'}</strong></div>
                <div>Dietary: <strong className="text-[#202B27] dark:text-[#ECF1EE]">{selectedGuestForDrawer.preferences.dietaryRestrictions?.join(', ') || 'None'}</strong></div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 1: NEW GUEST PROFILE */}
      <Modal
        open={isNewGuestModalOpen}
        onClose={() => setIsNewGuestModalOpen(false)}
        title="Add Guest Profile & Preferences"
        subtitle="Record guest details, VIP tier, room layout preferences, and loyalty profile."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreateGuest} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g., Ambassador Solomon Mekonnen"
              value={newGuestForm.fullName}
              onChange={(e) => setNewGuestForm({ ...newGuestForm, fullName: e.target.value })}
              className="seam-input w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Email *</label>
              <input
                type="email"
                required
                placeholder="guest@domain.com"
                value={newGuestForm.email}
                onChange={(e) => setNewGuestForm({ ...newGuestForm, email: e.target.value })}
                className="seam-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Phone Number *</label>
              <input
                type="text"
                required
                placeholder="+251 91 222 3344"
                value={newGuestForm.phone}
                onChange={(e) => setNewGuestForm({ ...newGuestForm, phone: e.target.value })}
                className="seam-input w-full font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">VIP Tier</label>
              <select
                value={newGuestForm.vipTier}
                onChange={(e) => setNewGuestForm({ ...newGuestForm, vipTier: e.target.value as any })}
                className="seam-input w-full"
              >
                <option value="standard">Standard Guest</option>
                <option value="silver">Silver Tier</option>
                <option value="gold">Gold VIP</option>
                <option value="platinum">Platinum VIP</option>
                <option value="presidential">Presidential VIP</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Company / Organization
              </label>
              <input
                type="text"
                placeholder="e.g., Ethiopian Airlines, African Union"
                value={newGuestForm.companyAffiliation}
                onChange={(e) => setNewGuestForm({ ...newGuestForm, companyAffiliation: e.target.value })}
                className="seam-input w-full"
              />
            </div>
          </div>

          <div className="bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-[10px] p-3.5 space-y-3">
            <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block">
              Stay Preferences &amp; Room Customization
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#78837D] mb-1">Room Location</label>
                <select
                  value={newGuestForm.roomLocation}
                  onChange={(e) => setNewGuestForm({ ...newGuestForm, roomLocation: e.target.value as any })}
                  className="seam-input w-full"
                >
                  <option value="high_floor">High Floor (Panorama View)</option>
                  <option value="low_floor">Low Floor / Ground Level</option>
                  <option value="quiet_corner">Quiet Corner Room</option>
                  <option value="near_elevator">Near Elevator</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#78837D] mb-1">Pillow Type</label>
                <select
                  value={newGuestForm.pillowType}
                  onChange={(e) => setNewGuestForm({ ...newGuestForm, pillowType: e.target.value as any })}
                  className="seam-input w-full"
                >
                  <option value="feather">Feather / Down Pillow</option>
                  <option value="memory_foam">Memory Foam Ergonomic</option>
                  <option value="foam">Standard Medium Foam</option>
                  <option value="hypoallergenic">Hypoallergenic Synthetic</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[#78837D] mb-1">
                Dietary Restrictions (Comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g., Gluten-free, No Shellfish, Halal"
                value={newGuestForm.dietaryRestrictions}
                onChange={(e) => setNewGuestForm({ ...newGuestForm, dietaryRestrictions: e.target.value })}
                className="seam-input w-full"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#78837D] mb-1">Favorite Welcome Beverage</label>
              <input
                type="text"
                placeholder="e.g., Iced Hibiscus Tea with Mint"
                value={newGuestForm.favoriteDrink}
                onChange={(e) => setNewGuestForm({ ...newGuestForm, favoriteDrink: e.target.value })}
                className="seam-input w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsNewGuestModalOpen(false)}
              className="px-4 py-1.5 border border-[#E6EBE7] dark:border-[#22322C] rounded-[8px] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#173F35] hover:bg-[#12322A] text-white rounded-[8px] font-semibold"
            >
              Save Guest Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: REDEEM LOYALTY REWARD */}
      <Modal
        open={isRedeemModalOpen}
        onClose={() => setIsRedeemModalOpen(false)}
        title="Redeem Loyalty Reward Voucher"
        subtitle="Deduct points from guest loyalty balance and issue complimentary hotel perk."
        maxWidthClass="max-w-md"
      >
        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Select Guest</label>
            <select
              value={selectedRedeemGuestId}
              onChange={(e) => setSelectedRedeemGuestId(e.target.value)}
              className="seam-input w-full"
            >
              {guestProfiles.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.fullName} — {g.loyaltyPointsBalance} pts ({g.vipTier.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Select Reward</label>
            <select
              value={selectedRewardId}
              onChange={(e) => setSelectedRewardId(e.target.value)}
              className="seam-input w-full"
            >
              {loyaltyRewards.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.pointsRequired} pts)
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsRedeemModalOpen(false)}
              className="px-4 py-1.5 border border-[#E6EBE7] dark:border-[#22322C] rounded-[8px] font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteRedemption}
              className="px-4 py-1.5 bg-[#C6A15B] hover:bg-[#B28D49] text-[#173F35] rounded-[8px] font-semibold"
            >
              Confirm Redemption
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: BOOK SPA APPOINTMENT */}
      <Modal
        open={isBookSpaModalOpen}
        onClose={() => setIsBookSpaModalOpen(false)}
        title="Book Spa Treatment Appointment"
        subtitle="Schedule therapeutic session and optionally bill directly to guest room folio."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleBookSpa} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Select Guest or Walk-in
            </label>
            <select
              value={newSpaForm.guestId}
              onChange={(e) => {
                const g = guestProfiles.find((gp) => gp.id === e.target.value);
                setNewSpaForm({ ...newSpaForm, guestId: e.target.value, guestName: g ? g.fullName : '' });
              }}
              className="seam-input w-full"
            >
              <option value="">Walk-in Non-Resident Guest</option>
              {guestProfiles.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.fullName} ({g.vipTier.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {!newSpaForm.guestId && (
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Walk-in Guest Name *
              </label>
              <input
                type="text"
                required
                placeholder="Guest Name"
                value={newSpaForm.guestName}
                onChange={(e) => setNewSpaForm({ ...newSpaForm, guestName: e.target.value })}
                className="seam-input w-full"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Treatment Service *
              </label>
              <select
                value={newSpaForm.treatmentId}
                onChange={(e) => setNewSpaForm({ ...newSpaForm, treatmentId: e.target.value })}
                className="seam-input w-full"
              >
                {spaTreatments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.durationMinutes}m · {formatCurrency(t.price, currency)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Assigned Therapist
              </label>
              <input
                type="text"
                value={newSpaForm.therapistName}
                onChange={(e) => setNewSpaForm({ ...newSpaForm, therapistName: e.target.value })}
                className="seam-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Treatment Suite
              </label>
              <select
                value={newSpaForm.treatmentRoom}
                onChange={(e) => setNewSpaForm({ ...newSpaForm, treatmentRoom: e.target.value })}
                className="seam-input w-full"
              >
                <option value="Lotus Sanctuary Suite #1">Lotus Sanctuary Suite #1</option>
                <option value="Jasmine Wellness Room #2">Jasmine Wellness Room #2</option>
                <option value="Basalt Hot Stone Suite">Basalt Hot Stone Suite</option>
                <option value="Hydrotherapy Thermal Chamber">Hydrotherapy Thermal Chamber</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Guest Room (Folio Charge)
              </label>
              <select
                value={newSpaForm.roomId}
                onChange={(e) => setNewSpaForm({ ...newSpaForm, roomId: e.target.value })}
                className="seam-input w-full font-mono"
              >
                <option value="">None (Walk-in Cash/Card)</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {newSpaForm.roomId && (
            <label className="bg-[#EEF5F0] dark:bg-[#15291E] border border-[#CDE0D3] dark:border-[#274B36] rounded-[10px] p-3 flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={newSpaForm.chargeToRoomFolio}
                onChange={(e) => setNewSpaForm({ ...newSpaForm, chargeToRoomFolio: e.target.checked })}
                className="rounded accent-[#173F35] mt-0.5"
              />
              <div>
                <span className="font-semibold text-[#2F6B48] dark:text-[#66A881] block">
                  Post Spa Treatment Directly to Guest Folio
                </span>
                <span className="text-[11px] text-[#78837D]">
                  Automatically appends the treatment line item to the active room folio for checkout settlement.
                </span>
              </div>
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Date</label>
              <input
                type="date"
                value={newSpaForm.date}
                onChange={(e) => setNewSpaForm({ ...newSpaForm, date: e.target.value })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Start Time</label>
              <input
                type="time"
                value={newSpaForm.startTime}
                onChange={(e) => setNewSpaForm({ ...newSpaForm, startTime: e.target.value })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsBookSpaModalOpen(false)}
              className="px-4 py-1.5 border border-[#E6EBE7] dark:border-[#22322C] rounded-[8px] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#173F35] hover:bg-[#12322A] text-white rounded-[8px] font-semibold"
            >
              Confirm Spa Appointment
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: MANAGEMENT FEEDBACK REPLY */}
      <Modal
        open={Boolean(feedbackReplyModalId)}
        onClose={() => setFeedbackReplyModalId(null)}
        title="Management Official Response"
        subtitle="Provide an official response to the guest survey feedback."
        maxWidthClass="max-w-lg"
      >
        <div className="space-y-3.5 text-xs">
          <textarea
            rows={4}
            placeholder="Dear Guest, thank you for your feedback..."
            value={managementReplyText}
            onChange={(e) => setManagementReplyText(e.target.value)}
            className="seam-input w-full"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setFeedbackReplyModalId(null)}
              className="px-4 py-1.5 border border-[#E6EBE7] dark:border-[#22322C] rounded-[8px] font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => feedbackReplyModalId && handleSendFeedbackResponse(feedbackReplyModalId)}
              className="px-4 py-1.5 bg-[#173F35] hover:bg-[#12322A] text-white rounded-[8px] font-semibold"
            >
              Publish Management Reply
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
