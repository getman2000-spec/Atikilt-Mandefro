/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Digital Guest In-Room Tablet, Smart Room Automation & Service Dispatch Hub
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Hotel,
  RoomServiceOrder,
  GuestServiceRequest,
  ExpressCheckOutRequest,
} from '../../types/saas';
import { CurrentUser } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { SeamCipherIcon } from '../common/SeamCipherLogo';
import { PageHeader, KpiCard, StatusBadge, EmptyState, SampleDataBadge } from '../ui';
import { formatCurrency } from '../../utils/formatters';
import { TAX_AND_PAYROLL_CONFIG } from '../../config/taxAndPayrollConfig';
import { calculateHospitalityLevies } from '../../utils/taxAndPayrollCalculator';
import {
  Tablet,
  UtensilsCrossed,
  Bell,
  Moon,
  Sun,
  Wind,
  Sparkles,
  Wifi,
  Info,
  LogOut,
  Plus,
  ShoppingBag,
  Sliders,
  Send,
  BedDouble,
  UserCheck,
  Star,
} from 'lucide-react';

interface DigitalGuestTabletHubProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

const ROOM_SERVICE_MENU = [
  {
    id: 'mi_01',
    name: 'Pan-Seared Lake Chamo Tilapia Fillet',
    category: 'Mains',
    price: 850,
    description: 'Fresh local tilapia served with herb butter, garlic baby potatoes, and grilled asparagus.',
    tags: ['Local Catch', 'Gluten Free'],
  },
  {
    id: 'mi_02',
    name: 'Special Traditional Beyaynetu Fasting Platter',
    category: 'Ethiopian Specialties',
    price: 650,
    description: '12-variety vegan fasting stew array on organic highland Teff injera.',
    tags: ['Vegan', 'Authentic'],
  },
  {
    id: 'mi_03',
    name: 'Prime Grilled Beef Tenderloin Medallions',
    category: 'Mains',
    price: 980,
    description: 'Grass-fed highland beef with red wine reduction sauce and truffle mashed potatoes.',
    tags: ['Chef Signature'],
  },
  {
    id: 'mi_04',
    name: 'Panorama Club Sandwich & Cassava Chips',
    category: 'Light Bites',
    price: 480,
    description: 'Triple-decker smoked chicken breast, beef bacon, free-range egg, and Dijon aioli.',
    tags: ['All-Day'],
  },
  {
    id: 'mi_05',
    name: 'Fresh Passion Fruit & Mango Bavarian Tart',
    category: 'Desserts',
    price: 320,
    description: 'Highland passion fruit curd tart topped with freshly sliced mango and mint leaves.',
    tags: ['Vegetarian'],
  },
  {
    id: 'mi_06',
    name: 'Hibiscus & Ginger Craft Mocktail',
    category: 'Beverages',
    price: 200,
    description: 'Sparkling mineral water infused with wild hibiscus flowers, ginger, and lime.',
    tags: ['Refreshing'],
  },
];

export const DigitalGuestTabletHub: React.FC<DigitalGuestTabletHubProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();
  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings?.currency || 'ETB';

  const [activeTab, setActiveTab] = useState<'tablet_view' | 'staff_dispatch'>('tablet_view');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>('201');
  const [selectedGuestName, setSelectedGuestName] = useState<string>('Sample Guest A');

  const [isDndActive, setIsDndActive] = useState<boolean>(true);
  const [isMurActive, setIsMurActive] = useState<boolean>(false);
  const [roomTemp, setRoomTemp] = useState<number>(21);
  const [activeLightingScene, setActiveLightingScene] = useState<'relax' | 'bright' | 'night' | 'sunset'>('relax');

  const [cart, setCart] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const [dietaryNotes, setDietaryNotes] = useState<string>('');

  const [orders, setOrders] = useState<RoomServiceOrder[]>([]);
  const [serviceRequests, setServiceRequests] = useState<GuestServiceRequest[]>([]);
  const [checkouts, setCheckouts] = useState<ExpressCheckOutRequest[]>([]);

  const [ecoForm, setEcoForm] = useState({
    departureTime: '11:30 AM',
    paymentMethod: 'telebirr' as 'card_on_file' | 'telebirr' | 'desk_settlement',
    luggageAssistance: true,
    flightTransfer: true,
    notes: '',
  });

  const inHouseOptions = useMemo(() => {
    if (!hotelId) return [];
    const activeRes = saasStorage
      .getReservations(hotelId)
      .filter((r) => r.status === 'checked_in' && r.roomNumber);
    if (activeRes.length > 0) {
      return activeRes.map((r) => ({
        roomNumber: r.roomNumber as string,
        guestName: r.guestName,
        label: `Room ${r.roomNumber} · ${r.guestName} (${r.roomTypeName})`,
      }));
    }
    return [
      { roomNumber: '201', guestName: 'Sample Guest A', label: 'Suite 201 · Sample Guest A' },
      { roomNumber: '101', guestName: 'Sample Guest B', label: 'Room 101 · Sample Guest B' },
      { roomNumber: '302', guestName: 'Sample Guest C', label: 'Room 302 · Sample Guest C' },
    ];
  }, [hotelId]);

  useEffect(() => {
    if (!hotelId) return;
    setOrders(saasStorage.getRoomServiceOrders(hotelId));
    setServiceRequests(saasStorage.getGuestServiceRequests(hotelId));
    setCheckouts(saasStorage.getExpressCheckOuts(hotelId));
    setCart([]);
    if (inHouseOptions.length > 0) {
      setSelectedRoomNumber(inHouseOptions[0].roomNumber);
      setSelectedGuestName(inHouseOptions[0].guestName);
    }
  }, [hotelId]);

  const cartCalculations = useMemo(() => {
    const subtotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const rules = hotelId ? saasStorage.getFinancialRules(hotelId) : undefined;
    const levies = calculateHospitalityLevies(subtotal, {
      vatRatePercent: rules?.vatRate ?? TAX_AND_PAYROLL_CONFIG.defaultVatRatePercent,
      serviceChargeRatePercent:
        rules?.serviceChargeRate ?? TAX_AND_PAYROLL_CONFIG.defaultServiceChargeRatePercent,
    });
    return {
      subtotal,
      serviceCharge: levies.serviceChargeAmount,
      vat: levies.vatAmount,
      total: levies.total,
    };
  }, [cart, hotelId]);

  if (!activeHotel) return null;

  const openRequestsCount = serviceRequests.filter((r) => r.status !== 'completed').length;

  const addToCart = (item: (typeof ROOM_SERVICE_MENU)[number]) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
    toast(`Added ${item.name} to dining tray`, { variant: 'info' });
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const newQ = i.quantity + delta;
            return newQ > 0 ? { ...i, quantity: newQ } : null;
          }
          return i;
        })
        .filter(Boolean) as { id: string; name: string; price: number; quantity: number }[]
    );
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;

    const actor = {
      email: currentUser?.email || 'inroom.tablet@seam.com',
      fullName: `Guest In-Room Tablet (${selectedGuestName})`,
      role: 'guest',
    };

    const newOrder = saasStorage.createRoomServiceOrder(
      {
        hotelId,
        roomNumber: selectedRoomNumber,
        guestName: selectedGuestName,
        items: cart.map((c) => ({
          menuItemId: c.id,
          name: c.name,
          quantity: c.quantity,
          unitPrice: c.price,
        })),
        subtotal: cartCalculations.subtotal,
        serviceCharge: cartCalculations.serviceCharge,
        vat: cartCalculations.vat,
        totalPrice: cartCalculations.total,
        currency,
        orderStatus: 'preparing',
        estimatedDeliveryMinutes: 25,
        specialDietaryNotes: dietaryNotes || undefined,
        postedToFolio: true,
      },
      actor
    );

    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    setDietaryNotes('');
    toast(
      `Order #${newOrder.id.toUpperCase()} dispatched to Kitchen · ${formatCurrency(newOrder.totalPrice, currency)} posted to Room ${selectedRoomNumber}`,
      { variant: 'success' }
    );
  };

  const handleSendQuickRequest = (type: GuestServiceRequest['requestType'], details: string) => {
    const actor = {
      email: currentUser?.email || 'inroom.tablet@seam.com',
      fullName: `Guest In-Room Tablet (${selectedGuestName})`,
      role: 'guest',
    };

    const created = saasStorage.createGuestServiceRequest(
      {
        hotelId,
        roomNumber: selectedRoomNumber,
        guestName: selectedGuestName,
        requestType: type,
        details,
        status: 'requested',
      },
      actor
    );

    setServiceRequests((prev) => [created, ...prev]);
    toast(`Request "${details}" dispatched to Housekeeping & Butler Desk`, { variant: 'success' });
  };

  const handleExpressCheckOut = (e: React.FormEvent) => {
    e.preventDefault();

    const actor = {
      email: currentUser?.email || 'inroom.tablet@seam.com',
      fullName: `Guest In-Room Tablet (${selectedGuestName})`,
      role: 'guest',
    };

    const created = saasStorage.submitExpressCheckOut(
      {
        hotelId,
        roomNumber: selectedRoomNumber,
        guestName: selectedGuestName,
        folioId: `fol_${selectedRoomNumber}`,
        outstandingBalance: 3420,
        preferredPaymentMethod: ecoForm.paymentMethod,
        departureTime: ecoForm.departureTime,
        luggageAssistanceNeeded: ecoForm.luggageAssistance,
        flightTransferNeeded: ecoForm.flightTransfer,
        status: 'pending_review',
        guestNotes: ecoForm.notes || undefined,
      },
      actor
    );

    setCheckouts((prev) => [created, ...prev]);
    toast(`Express check-out scheduled for ${ecoForm.departureTime} · Front Office notified`, { variant: 'success' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Guest Services', 'Digital In-Room Hub']}
        title="Digital In-Room Tablet & Guest Dispatch"
        subtitle={`${activeHotel.name} · Contactless dining, smart room privacy controls, and live butler fulfillment.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SampleDataBadge label="Sample data & Simulator" />
            <BedDouble className="w-4 h-4 text-[#78837D]" />
            <select
              value={selectedRoomNumber}
              onChange={(e) => {
                const match = inHouseOptions.find((opt) => opt.roomNumber === e.target.value);
                setSelectedRoomNumber(e.target.value);
                if (match) setSelectedGuestName(match.guestName);
              }}
              className="seam-input font-semibold text-xs"
            >
              {inHouseOptions.map((opt) => (
                <option key={opt.roomNumber} value={opt.roomNumber}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="In-Room Dining Orders"
          value={orders.length}
          helper="Kitchen KDS synced"
          deltaTone="forest"
          icon={UtensilsCrossed}
        />
        <KpiCard
          label="Open Butler Requests"
          value={openRequestsCount}
          helper="Housekeeping queue"
          deltaTone={openRequestsCount > 0 ? 'warning' : 'neutral'}
          icon={Bell}
        />
        <KpiCard
          label="Express Check-Outs"
          value={checkouts.length}
          helper="Folio review scheduled"
          deltaTone="neutral"
          icon={LogOut}
        />
        <KpiCard
          label="Contactless CSAT"
          value="4.9 / 5.0"
          helper="Sample in-suite rating"
          deltaTone="positive"
          icon={Star}
        />
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-[10px] w-fit flex-wrap">
        <button
          onClick={() => setActiveTab('tablet_view')}
          className={`px-3.5 py-1.5 rounded-[7px] text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'tablet_view'
              ? 'bg-[#173F35] text-white'
              : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <Tablet className="w-3.5 h-3.5" />
          <span>In-Room Tablet Preview (Room {selectedRoomNumber})</span>
        </button>

        <button
          onClick={() => setActiveTab('staff_dispatch')}
          className={`px-3.5 py-1.5 rounded-[7px] text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'staff_dispatch'
              ? 'bg-[#173F35] text-white'
              : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Staff Dispatch Queue ({orders.length + serviceRequests.length})</span>
        </button>
      </div>

      {/* TAB 1: In-Room Tablet Simulator */}
      {activeTab === 'tablet_view' && (
        <div className="max-w-5xl mx-auto">
          <div className="rounded-[20px] border-[6px] border-[#202B27] dark:border-[#22322C] bg-[#0D1412] p-5 sm:p-6 text-[#ECF1EE]">
            {/* Tablet Top Status Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-[#22322C] text-xs text-[#9AA6A0]">
              <div className="flex items-center gap-2.5">
                <SeamCipherIcon size={18} />
                <span className="font-mono text-[#C6A15B] font-semibold uppercase tracking-wider">
                  {activeHotel.name}
                </span>
                <span className="text-[#22322C]">|</span>
                <span className="font-mono">Room {selectedRoomNumber}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-[11px] text-[#66A881] font-mono">
                  <Wifi className="w-3.5 h-3.5" />
                  Connected
                </span>
                <span className="font-mono">In-Room OS</span>
              </div>
            </div>

            {/* Welcome Greeting Banner */}
            <div className="mt-4 p-4 sm:p-5 rounded-[12px] bg-[#131D1A] border border-[#22322C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-[10px] bg-[#173F35] border border-[#22322C] flex items-center justify-center shrink-0">
                  <SeamCipherIcon size={24} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-[#C6A15B]">
                    Welcome to {activeHotel.name}
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5">
                    Good Day, {selectedGuestName}
                  </h2>
                  <p className="text-xs text-[#9AA6A0]">
                    Suite {selectedRoomNumber} · Connected hospitality &amp; 24/7 digital concierge.
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0 bg-[#192622] px-3.5 py-2.5 rounded-[10px] border border-[#22322C] text-xs">
                <div className="flex items-center gap-1.5 text-[#C6A15B] font-semibold sm:justify-end">
                  <Sun className="w-4 h-4" />
                  <span className="font-mono">27°C Clear</span>
                </div>
                <span className="text-[11px] text-[#9AA6A0]">{activeHotel.address?.city || 'Local'} Weather</span>
              </div>
            </div>

            {/* Smart Room Automation Controls */}
            <div className="mt-4 p-4 rounded-[12px] bg-[#131D1A] border border-[#22322C]">
              <div className="text-[11px] font-semibold text-[#9AA6A0] uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Suite Environment &amp; Privacy</span>
                <span className="text-[#66A881] font-normal">Synced with Housekeeping Board</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => {
                    const next = !isDndActive;
                    setIsDndActive(next);
                    if (next) setIsMurActive(false);
                    handleSendQuickRequest('dnd_toggle', next ? 'Do Not Disturb activated' : 'Do Not Disturb cleared');
                  }}
                  className={`p-3 rounded-[10px] border transition-colors text-left flex flex-col justify-between ${
                    isDndActive
                      ? 'bg-[#2E1616] border-[#B6463D] text-[#E27A71]'
                      : 'bg-[#192622] border-[#22322C] text-[#9AA6A0] hover:border-[#354B43]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Moon className="w-4 h-4" />
                    <span className="text-[10px] font-mono font-bold uppercase">{isDndActive ? 'Active' : 'Off'}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white">Do Not Disturb</div>
                    <span className="text-[10px] text-[#9AA6A0]">Privacy indicator</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    const next = !isMurActive;
                    setIsMurActive(next);
                    if (next) setIsDndActive(false);
                    handleSendQuickRequest('mur_toggle', next ? 'Make Up Room requested' : 'Make Up Room cleared');
                  }}
                  className={`p-3 rounded-[10px] border transition-colors text-left flex flex-col justify-between ${
                    isMurActive
                      ? 'bg-[#15291E] border-[#2F6B48] text-[#66A881]'
                      : 'bg-[#192622] border-[#22322C] text-[#9AA6A0] hover:border-[#354B43]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-mono font-bold uppercase">{isMurActive ? 'Active' : 'Off'}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white">Make Up Room</div>
                    <span className="text-[10px] text-[#9AA6A0]">Request turnover</span>
                  </div>
                </button>

                <div className="p-3 rounded-[10px] bg-[#192622] border border-[#22322C] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <Wind className="w-4 h-4 text-[#C6A15B]" />
                    <span className="text-xs font-mono font-bold text-[#C6A15B]">{roomTemp}°C</span>
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white">Suite Climate</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <button
                        onClick={() => setRoomTemp((t) => Math.max(18, t - 1))}
                        className="w-6 h-6 rounded-[6px] bg-[#131D1A] border border-[#22322C] hover:border-[#C6A15B] text-white flex items-center justify-center font-mono text-xs"
                      >
                        -
                      </button>
                      <button
                        onClick={() => setRoomTemp((t) => Math.min(26, t + 1))}
                        className="w-6 h-6 rounded-[6px] bg-[#131D1A] border border-[#22322C] hover:border-[#C6A15B] text-white flex items-center justify-center font-mono text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-[10px] bg-[#192622] border border-[#22322C] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <Sliders className="w-4 h-4 text-[#C6A15B]" />
                    <span className="text-[10px] capitalize font-semibold text-[#C6A15B]">{activeLightingScene}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white">Lighting Scene</div>
                    <div className="grid grid-cols-2 gap-1.5 mt-1.5 text-[10px]">
                      <button
                        onClick={() => setActiveLightingScene('relax')}
                        className={`px-1.5 py-0.5 rounded-[5px] ${
                          activeLightingScene === 'relax' ? 'bg-[#C6A15B] text-[#173F35] font-semibold' : 'bg-[#131D1A] text-[#9AA6A0]'
                        }`}
                      >
                        Relax
                      </button>
                      <button
                        onClick={() => setActiveLightingScene('night')}
                        className={`px-1.5 py-0.5 rounded-[5px] ${
                          activeLightingScene === 'night' ? 'bg-[#C6A15B] text-[#173F35] font-semibold' : 'bg-[#131D1A] text-[#9AA6A0]'
                        }`}
                      >
                        Night
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* In-Room Dining & Cart Grid */}
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-[#C6A15B]" />
                    <span>In-Room Dining Menu</span>
                  </h3>
                  <span className="text-[11px] text-[#9AA6A0]">24/7 Room Delivery</span>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {ROOM_SERVICE_MENU.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-[10px] bg-[#131D1A] border border-[#22322C] hover:border-[#354B43] transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white">{item.name}</span>
                          {item.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded-[5px] text-[10px] bg-[#192622] border border-[#22322C] text-[#9AA6A0]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-[#9AA6A0] mt-0.5">{item.description}</p>
                        <div className="text-[#C6A15B] font-semibold font-mono tabular-nums mt-1">
                          {formatCurrency(item.price, currency)}
                        </div>
                      </div>

                      <button
                        onClick={() => addToCart(item)}
                        className="px-3 py-1.5 rounded-[8px] bg-[#C6A15B] hover:bg-[#B28D49] text-[#173F35] font-semibold text-xs flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#131D1A] rounded-[12px] p-4 border border-[#22322C] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#22322C]">
                    <div className="flex items-center gap-2 font-semibold text-white text-xs">
                      <ShoppingBag className="w-4 h-4 text-[#C6A15B]" />
                      <span>Dining Tray</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-[6px] text-[10px] bg-[#192622] border border-[#22322C] text-[#9AA6A0] font-mono">
                      {cart.reduce((acc, i) => acc + i.quantity, 0)} items
                    </span>
                  </div>

                  {cart.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#9AA6A0]">
                      Your dining tray is empty. Select items to order.
                    </div>
                  ) : (
                    <div className="space-y-2.5 my-3 max-h-[180px] overflow-y-auto pr-1 text-xs">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex-1 pr-2">
                            <span className="font-medium text-white">{item.name}</span>
                            <div className="text-[10px] text-[#9AA6A0] font-mono tabular-nums">
                              {item.price} × {item.quantity} = {formatCurrency(item.price * item.quantity, currency)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => updateCartQuantity(item.id, -1)}
                              className="w-5 h-5 rounded bg-[#192622] border border-[#22322C] text-white flex items-center justify-center font-mono"
                            >
                              -
                            </button>
                            <span className="w-4 text-center font-mono font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.id, 1)}
                              className="w-5 h-5 rounded bg-[#192622] border border-[#22322C] text-white flex items-center justify-center font-mono"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {cart.length > 0 && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Dietary notes (e.g. dressing on side)..."
                        value={dietaryNotes}
                        onChange={(e) => setDietaryNotes(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-[8px] border border-[#22322C] bg-[#192622] text-white text-[11px] placeholder-[#78837D]"
                      />
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="pt-3 border-t border-[#22322C] space-y-1 text-xs">
                    <div className="flex justify-between text-[#9AA6A0] text-[11px]">
                      <span>Subtotal:</span>
                      <span className="font-mono tabular-nums">{formatCurrency(cartCalculations.subtotal, currency)}</span>
                    </div>
                    <div className="flex justify-between text-[#9AA6A0] text-[11px]">
                      <span>Service Charge (10%):</span>
                      <span className="font-mono tabular-nums">{formatCurrency(cartCalculations.serviceCharge, currency)}</span>
                    </div>
                    <div className="flex justify-between text-[#9AA6A0] text-[11px]">
                      <span>VAT (15%):</span>
                      <span className="font-mono tabular-nums">{formatCurrency(cartCalculations.vat, currency)}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold text-sm pt-1.5 border-t border-[#22322C]">
                      <span>Total Room Charge:</span>
                      <span className="font-mono tabular-nums text-[#C6A15B]">
                        {formatCurrency(cartCalculations.total, currency)}
                      </span>
                    </div>

                    <button
                      onClick={handlePlaceOrder}
                      className="w-full mt-3 py-2 rounded-[8px] bg-[#C6A15B] hover:bg-[#B28D49] text-[#173F35] font-semibold text-xs flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send to Kitchen (Charge Folio)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Instant Butler Service Buttons Strip */}
            <div className="mt-4 p-4 rounded-[12px] bg-[#131D1A] border border-[#22322C]">
              <div className="text-[11px] font-semibold text-[#9AA6A0] uppercase tracking-wider mb-3">
                1-Tap Butler &amp; Housekeeping Requests
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <button
                  onClick={() => handleSendQuickRequest('extra_amenities', 'Extra Feather Pillows (2)')}
                  className="p-2.5 rounded-[8px] bg-[#192622] hover:border-[#C6A15B] border border-[#22322C] text-[#ECF1EE] font-medium flex items-center gap-2"
                >
                  <BedDouble className="w-4 h-4 text-[#C6A15B] shrink-0" />
                  <span>Extra Pillows</span>
                </button>

                <button
                  onClick={() => handleSendQuickRequest('extra_amenities', 'Fresh Egyptian Cotton Towels')}
                  className="p-2.5 rounded-[8px] bg-[#192622] hover:border-[#C6A15B] border border-[#22322C] text-[#ECF1EE] font-medium flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#66A881] shrink-0" />
                  <span>Fresh Towels</span>
                </button>

                <button
                  onClick={() => handleSendQuickRequest('extra_amenities', 'Universal Power Adapter & Cable')}
                  className="p-2.5 rounded-[8px] bg-[#192622] hover:border-[#C6A15B] border border-[#22322C] text-[#ECF1EE] font-medium flex items-center gap-2"
                >
                  <Info className="w-4 h-4 text-[#C6A15B] shrink-0" />
                  <span>Power Adapter</span>
                </button>

                <button
                  onClick={() => handleSendQuickRequest('luggage_assistance', 'Porter Luggage Assistance')}
                  className="p-2.5 rounded-[8px] bg-[#192622] hover:border-[#C6A15B] border border-[#22322C] text-[#ECF1EE] font-medium flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4 text-[#66A881] shrink-0" />
                  <span>Luggage Porter</span>
                </button>
              </div>
            </div>

            {/* Express Mobile Check-Out */}
            <div className="mt-4 p-4 rounded-[12px] bg-[#173F35]/40 border border-[#22322C]">
              <h4 className="text-xs font-semibold text-[#C6A15B] uppercase tracking-wider flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span>Express Mobile Check-Out</span>
              </h4>
              <p className="text-[11px] text-[#9AA6A0] mt-0.5">
                Schedule folio review and departure luggage support without waiting at reception.
              </p>

              <form onSubmit={handleExpressCheckOut} className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[#9AA6A0] text-[11px] mb-1">Departure Time</label>
                  <input
                    type="text"
                    value={ecoForm.departureTime}
                    onChange={(e) => setEcoForm({ ...ecoForm, departureTime: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-[8px] border border-[#22322C] bg-[#131D1A] text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#9AA6A0] text-[11px] mb-1">Payment Method</label>
                  <select
                    value={ecoForm.paymentMethod}
                    onChange={(e) => setEcoForm({ ...ecoForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-[8px] border border-[#22322C] bg-[#131D1A] text-white"
                  >
                    <option value="card_on_file">Pre-Authorized Card on File</option>
                    <option value="telebirr">Telebirr Mobile Payment</option>
                    <option value="desk_settlement">Pay at Front Desk</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 rounded-[8px] bg-[#C6A15B] hover:bg-[#B28D49] text-[#173F35] font-semibold text-xs"
                  >
                    Confirm Express Check-Out
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Staff Butler & Dining Dispatch Queue */}
      {activeTab === 'staff_dispatch' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Dining Orders Queue */}
          <div className="seam-surface p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B]" />
              <span>Kitchen In-Room Dining Orders ({orders.length})</span>
            </h3>

            {orders.length === 0 ? (
              <EmptyState title="No active room service orders" description="Orders placed from guest tablets appear here immediately." />
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="p-4 rounded-[10px] bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                        Room {o.roomNumber} · {o.guestName}
                      </span>
                      <StatusBadge
                        label={o.orderStatus.replace(/_/g, ' ')}
                        tone={o.orderStatus === 'delivered' ? 'success' : 'warning'}
                      />
                    </div>

                    <div className="text-[11px] text-[#78837D] space-y-1 border-t border-b border-[#E6EBE7] dark:border-[#22322C] py-2">
                      {o.items.map((i, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-[#202B27] dark:text-[#ECF1EE]">
                            {i.quantity}× {i.name}
                          </span>
                          <span className="font-mono tabular-nums">
                            {formatCurrency(i.unitPrice * i.quantity, o.currency || currency)}
                          </span>
                        </div>
                      ))}
                      {o.specialDietaryNotes && (
                        <div className="text-[11px] text-[#B6463D] dark:text-[#E27A71] font-medium pt-1">
                          Note: {o.specialDietaryNotes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <span className="font-semibold font-mono tabular-nums text-[#173F35] dark:text-[#C6A15B]">
                        Total: {formatCurrency(o.totalPrice, o.currency || currency)} (Folio Posted)
                      </span>
                      {o.orderStatus !== 'delivered' && (
                        <button
                          onClick={() => {
                            const actor = {
                              email: currentUser?.email || 'admin@seam.com',
                              fullName: currentUser?.fullName || 'Staff Member',
                              role: currentUser?.role || 'staff',
                            };
                            saasStorage.updateRoomServiceOrderStatus(o.id, 'delivered', actor);
                            setOrders(saasStorage.getRoomServiceOrders(hotelId));
                            toast(`Order #${o.id.toUpperCase()} delivered to Room ${o.roomNumber}`, { variant: 'success' });
                          }}
                          className="px-2.5 py-1 rounded-[7px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold text-[11px]"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Butler & Housekeeping Requests Queue */}
          <div className="seam-surface p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B]" />
              <span>Housekeeping &amp; Butler Requests ({serviceRequests.length})</span>
            </h3>

            {serviceRequests.length === 0 ? (
              <EmptyState title="No pending butler requests" description="DND/MUR toggles and amenity dispatches appear here." />
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {serviceRequests.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-[10px] bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                        Room {r.roomNumber} · {r.guestName}
                      </span>
                      <StatusBadge
                        label={r.status}
                        tone={r.status === 'completed' ? 'success' : 'forest'}
                      />
                    </div>

                    <p className="text-[#202B27] dark:text-[#ECF1EE] font-medium">{r.details}</p>

                    <div className="flex items-center justify-between text-[11px] text-[#78837D] pt-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
                      <span className="font-mono">Requested: {new Date(r.requestedAt).toLocaleTimeString()}</span>
                      {r.status !== 'completed' && (
                        <button
                          onClick={() => {
                            const actor = {
                              email: currentUser?.email || 'admin@seam.com',
                              fullName: currentUser?.fullName || 'Housekeeping',
                              role: currentUser?.role || 'staff',
                            };
                            saasStorage.updateGuestServiceRequestStatus(
                              r.id,
                              'completed',
                              currentUser?.fullName || 'Housekeeping Staff',
                              actor
                            );
                            setServiceRequests(saasStorage.getGuestServiceRequests(hotelId));
                            toast(`Completed butler request for Room ${r.roomNumber}`, { variant: 'success' });
                          }}
                          className="px-2.5 py-1 rounded-[7px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold text-[11px]"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
