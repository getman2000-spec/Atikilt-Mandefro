/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * F&B Point of Sale (POS), Cashier Sessions & Room Folio Billing
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { OutletMenuItem, CashierShift } from '../../types/saas';
import { PageHeader, StatusBadge, Modal, EmptyState, SampleDataBadge, VerificationNotice } from '../ui';
import { formatCurrency } from '../../utils/formatters';
import { TAX_AND_PAYROLL_CONFIG } from '../../config/taxAndPayrollConfig';
import { calculateHospitalityLevies } from '../../utils/taxAndPayrollCalculator';
import {
  Plus,
  Minus,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Receipt,
  Search,
  BedDouble,
  AlertCircle,
  Printer,
  ChevronRight,
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export const POSOutletCashier: React.FC = () => {
  const { activeHotel, user } = useAuth();
  const { toast } = useToast();
  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings.currency || 'ETB';

  const outlets = useMemo(() => (hotelId ? saasStorage.getOutlets(hotelId) : []), [hotelId]);
  const [selectedOutletId, setSelectedOutletId] = useState<string>('');
  const [menuItems, setMenuItems] = useState<OutletMenuItem[]>([]);
  const [shifts, setShifts] = useState<CashierShift[]>([]);

  const inHouseGuests = useMemo(() => {
    if (!hotelId) return [];
    return saasStorage
      .getReservations(hotelId)
      .filter((r) => r.status === 'checked_in' && r.roomNumber);
  }, [hotelId]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'food' | 'beverage' | 'dessert'>('all');
  const [menuSearch, setMenuSearch] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'telebirr' | 'card' | 'room_charge'>('cash');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>('');
  const [lastReceipt, setLastReceipt] = useState<{
    receiptNumber: string;
    totalAmount: number;
    postedToFolio: boolean;
    roomNumber?: string;
    items: CartItem[];
  } | null>(null);

  const [isOpenShiftOpen, setIsOpenShiftOpen] = useState(false);
  const [openFloatInput, setOpenFloatInput] = useState(1500);

  const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false);
  const [actualCashInput, setActualCashInput] = useState(0);
  const [closeNotes, setCloseNotes] = useState('');

  const refreshShifts = () => {
    if (!hotelId) return;
    setShifts(saasStorage.getCashierShifts(hotelId));
  };

  useEffect(() => {
    if (!hotelId) return;
    const loadedOutlets = saasStorage.getOutlets(hotelId);
    setSelectedOutletId(loadedOutlets[0]?.id || '');
    setMenuItems(saasStorage.getOutletMenuItems(hotelId));
    setShifts(saasStorage.getCashierShifts(hotelId));
    setCart([]);
    setSelectedRoomNumber(inHouseGuests[0]?.roomNumber || '');
  }, [hotelId]);

  if (!activeHotel) return null;

  const activeOutlet = outlets.find((o) => o.id === selectedOutletId) || outlets[0];
  const activeShift = shifts.find(
    (s) => s.status === 'open' && (!selectedOutletId || s.outletId === selectedOutletId)
  );

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const rules = saasStorage.getFinancialRules(hotelId);
  const vatRate = rules?.vatRate ?? TAX_AND_PAYROLL_CONFIG.defaultVatRatePercent;
  const serviceChargeRate =
    rules?.serviceChargeRate ?? TAX_AND_PAYROLL_CONFIG.defaultServiceChargeRatePercent;
  const levies = calculateHospitalityLevies(subtotal, {
    vatRatePercent: vatRate,
    serviceChargeRatePercent: serviceChargeRate,
  });
  const vat = levies.vatAmount;
  const serviceCharge = levies.serviceChargeAmount;
  const grandTotal = levies.total;

  const actor = {
    email: user?.email || 'cashier@hotel.com',
    fullName: user?.fullName || 'POS Cashier',
    role: user?.role || 'staff',
  };

  const handleAddToCart = (item: OutletMenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleClearCart = () => setCart([]);

  const handleCompleteSale = () => {
    if (cart.length === 0 || !activeOutlet) return;

    if (paymentMethod === 'room_charge' && !selectedRoomNumber) {
      toast('Please select an occupied guest room to post this charge.', { variant: 'warning' });
      return;
    }

    const targetGuest = inHouseGuests.find((g) => g.roomNumber === selectedRoomNumber);

    const result = saasStorage.recordPOSSale(
      {
        hotelId: activeHotel.id,
        outletId: activeOutlet.id,
        outletName: activeOutlet.name,
        cashierShiftId: activeShift?.id,
        paymentMethod,
        roomNumber: paymentMethod === 'room_charge' ? selectedRoomNumber : undefined,
        guestName: targetGuest?.guestName,
        items: cart.map((i) => ({ name: i.name, price: i.price, qty: i.qty })),
      },
      actor
    );

    setLastReceipt({
      receiptNumber: result.receiptNumber,
      totalAmount: grandTotal,
      postedToFolio: result.postedToFolio,
      roomNumber: paymentMethod === 'room_charge' ? selectedRoomNumber : undefined,
      items: [...cart],
    });

    handleClearCart();
    refreshShifts();
    toast(
      result.postedToFolio
        ? `Check ${result.receiptNumber} posted to Room ${selectedRoomNumber} folio`
        : `Sale ${result.receiptNumber} settled`,
      { variant: 'success' }
    );
  };

  const handleOpenShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOutlet) return;

    saasStorage.openCashierShift(
      {
        hotelId: activeHotel.id,
        outletId: activeOutlet.id,
        outletName: activeOutlet.name,
        cashierUserId: user?.uid || 'usr_cashier',
        cashierName: user?.fullName || 'Cashier Attendant',
        openingFloat: Number(openFloatInput),
      },
      actor
    );

    refreshShifts();
    setIsOpenShiftOpen(false);
    toast(`Opened cashier session for ${activeOutlet.name}`, { variant: 'success' });
  };

  const handleCloseShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    saasStorage.closeCashierShift(
      activeShift.id,
      Number(actualCashInput),
      closeNotes || undefined,
      actor
    );

    refreshShifts();
    setIsCloseShiftOpen(false);
    toast(`Closed cashier session ${activeShift.shiftNumber}`, { variant: 'success' });
  };

  const filteredMenuItems = menuItems.filter((item) => {
    const matchCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Operations', 'Daily Operations', 'F&B POS & Cashier']}
        title="Point of Sale (POS) & Outlet Cashier"
        subtitle={`${activeHotel.name} · Order tickets, shift drawer reconciliation, and direct room folio posting.`}
        meta={<SampleDataBadge />}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#78837D] font-medium hidden sm:inline">Outlet:</span>
            <select
              value={selectedOutletId}
              onChange={(e) => setSelectedOutletId(e.target.value)}
              className="seam-input font-semibold"
            >
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.code})
                </option>
              ))}
            </select>
          </div>
        }
      />
      <VerificationNotice />

      {/* Cashier Shift Status Banner */}
      <div className="seam-surface p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {activeShift ? (
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <StatusBadge label={`Session Active · ${activeShift.shiftNumber}`} tone="success" />
              <span className="text-[#78837D]">({activeShift.cashierName})</span>
            </div>

            <div className="flex items-center gap-3 text-[#78837D] font-medium">
              <span>
                Float:{' '}
                <strong className="text-[#202B27] dark:text-[#ECF1EE] font-mono tabular-nums">
                  {formatCurrency(activeShift.openingFloat, currency)}
                </strong>
              </span>
              <span>·</span>
              <span>
                Shift Sales:{' '}
                <strong className="text-[#2F6B48] dark:text-[#66A881] font-mono font-bold tabular-nums">
                  {formatCurrency(activeShift.totalRevenue, currency)}
                </strong>
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[#9E6B1E] dark:text-[#E5B869]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              No open cashier session for <strong>{activeOutlet?.name || 'selected outlet'}</strong>. Open a session to track drawer cash.
            </span>
          </div>
        )}

        <div>
          {activeShift ? (
            <button
              onClick={() => {
                setActualCashInput(activeShift.openingFloat + activeShift.cashSales);
                setIsCloseShiftOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-[8px] border border-[#F2C7C5] dark:border-[#4F2625] bg-[#FDF2F2] dark:bg-[#2E1616] text-[#B6463D] dark:text-[#E27A71] font-semibold text-xs transition-colors"
            >
              End / Close Shift Session
            </button>
          ) : (
            <button
              onClick={() => setIsOpenShiftOpen(true)}
              className="px-3.5 py-1.5 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold text-xs"
            >
              Open Cashier Session
            </button>
          )}
        </div>
      </div>

      {/* POS Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Menu Catalog & Categories */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-1 p-1 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-[10px] text-xs font-medium flex-wrap">
              {(
                [
                  { id: 'all', label: 'All Menu' },
                  { id: 'food', label: 'Food / Kitchen' },
                  { id: 'beverage', label: 'Beverages / Bar' },
                  { id: 'dessert', label: 'Dessert & Snacks' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-[7px] transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-[#173F35] text-white'
                      : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-[#78837D] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search food or drinks..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="seam-input w-full pl-8"
              />
            </div>
          </div>

          {filteredMenuItems.length === 0 ? (
            <EmptyState
              title="No menu items found"
              description="Adjust your category filter or search term."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredMenuItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleAddToCart(item)}
                  className="seam-surface p-3.5 hover:border-[#173F35] dark:hover:border-[#C6A15B] cursor-pointer transition-colors flex flex-col justify-between group"
                >
                  <div>
                    <h3 className="font-semibold text-xs text-[#202B27] dark:text-[#ECF1EE] group-hover:text-[#173F35] dark:group-hover:text-[#C6A15B] transition-colors">
                      {item.name}
                    </h3>
                    <span className="text-[10px] uppercase font-semibold text-[#78837D] block mt-1 tracking-wider">
                      {item.category}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between">
                    <span className="font-bold font-mono text-sm text-[#202B27] dark:text-[#ECF1EE] tabular-nums">
                      {formatCurrency(item.price, currency)}
                    </span>
                    <button
                      type="button"
                      className="p-1.5 rounded-[7px] bg-[#173F35]/10 text-[#173F35] dark:bg-[#173F35]/40 dark:text-[#C6A15B] group-hover:bg-[#173F35] group-hover:text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Active Order Ticket */}
        <div className="seam-surface p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EBE7] dark:border-[#22322C]">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B]" />
                <h2 className="font-semibold text-sm text-[#202B27] dark:text-[#ECF1EE]">
                  Active Order Ticket
                </h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-[11px] text-[#B6463D] hover:underline font-medium"
                >
                  Clear Ticket
                </button>
              )}
            </div>

            <div className="my-3 space-y-2 max-h-56 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="p-8 text-center text-[#78837D] text-xs">
                  Select items from the menu catalog to build this order ticket.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs p-2.5 rounded-[8px] bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C]"
                  >
                    <div className="flex-1 pr-2 min-w-0">
                      <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-[#78837D] tabular-nums font-mono">
                        {item.price.toLocaleString()} × {item.qty} = {formatCurrency(item.price * item.qty, currency)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleUpdateQty(item.id, -1)}
                        className="p-1 rounded-[6px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold tabular-nums font-mono px-1 text-[#202B27] dark:text-[#ECF1EE]">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item.id, 1)}
                        className="p-1 rounded-[6px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-[#F6F8F6] dark:bg-[#192622] rounded-[10px] space-y-1.5 text-xs border border-[#E6EBE7] dark:border-[#22322C]">
              <div className="flex justify-between text-[#78837D]">
                <span>Subtotal:</span>
                <span className="font-semibold font-mono tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
                  {formatCurrency(subtotal, currency)}
                </span>
              </div>
              <div className="flex justify-between text-[#78837D]">
                <span>VAT ({vatRate}%):</span>
                <span className="font-semibold font-mono tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
                  {formatCurrency(vat, currency)}
                </span>
              </div>
              <div className="flex justify-between text-[#78837D]">
                <span>Service Charge ({serviceChargeRate}%):</span>
                <span className="font-semibold font-mono tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
                  {formatCurrency(serviceCharge, currency)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E6EBE7] dark:border-[#22322C] flex justify-between font-bold text-sm text-[#202B27] dark:text-[#ECF1EE]">
                <span>Grand Total:</span>
                <span className="tabular-nums font-mono text-[#173F35] dark:text-[#C6A15B]">
                  {formatCurrency(grandTotal, currency)}
                </span>
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div className="mt-4 space-y-2">
              <span className="text-[11px] font-semibold text-[#78837D] uppercase tracking-wider block">
                Settlement Method
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {(
                  [
                    { id: 'cash', label: 'Cash', icon: DollarSign },
                    { id: 'telebirr', label: 'Telebirr / CBE', icon: CreditCard },
                    { id: 'card', label: 'Visa / Master', icon: CreditCard },
                    { id: 'room_charge', label: 'Room Folio', icon: BedDouble },
                  ] as const
                ).map((m) => {
                  const Icon = m.icon;
                  const active = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2 rounded-[8px] border font-medium flex items-center justify-center gap-1.5 transition-colors ${
                        active
                          ? 'bg-[#173F35] text-white border-[#173F35] font-semibold'
                          : 'border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {paymentMethod === 'room_charge' && (
                <div className="p-3 rounded-[10px] bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#202B27] dark:text-[#ECF1EE] block">
                    Charge to In-House Guest Room *
                  </label>
                  <select
                    value={selectedRoomNumber}
                    onChange={(e) => setSelectedRoomNumber(e.target.value)}
                    className="seam-input w-full font-semibold"
                  >
                    {inHouseGuests.length === 0 ? (
                      <option value="">No In-House Guests</option>
                    ) : (
                      inHouseGuests.map((g) => (
                        <option key={g.id} value={g.roomNumber}>
                          Room {g.roomNumber} · {g.guestName}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={handleCompleteSale}
            className="w-full py-2.5 rounded-[10px] bg-[#173F35] hover:bg-[#12322A] disabled:opacity-45 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <span>Complete Settlement</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MODAL 1: LAST RECEIPT */}
      <Modal
        open={Boolean(lastReceipt)}
        onClose={() => setLastReceipt(null)}
        title="Sale Settled"
        subtitle={activeOutlet?.name}
        maxWidthClass="max-w-sm"
      >
        {lastReceipt && (
          <div className="space-y-4 text-xs">
            <div className="text-center font-mono py-2 border-b border-[#E6EBE7] dark:border-[#22322C]">
              <span className="text-[11px] text-[#78837D] uppercase tracking-wider">Official Receipt</span>
              <div className="text-base font-bold text-[#202B27] dark:text-[#ECF1EE] mt-0.5">
                {lastReceipt.receiptNumber}
              </div>
            </div>

            <div className="p-3 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-[10px] space-y-1.5">
              {lastReceipt.items.map((i, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-[#202B27] dark:text-[#ECF1EE]">
                    {i.qty}× {i.name}
                  </span>
                  <span className="font-mono tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
                    {formatCurrency(i.price * i.qty, currency)}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#E6EBE7] dark:border-[#22322C] flex justify-between font-bold text-sm">
                <span>Total Settled:</span>
                <span className="text-[#173F35] dark:text-[#C6A15B] font-mono tabular-nums">
                  {formatCurrency(lastReceipt.totalAmount, currency)}
                </span>
              </div>
            </div>

            {lastReceipt.postedToFolio && (
              <div className="p-2.5 rounded-[8px] bg-[#EEF5F0] dark:bg-[#15291E] border border-[#CDE0D3] dark:border-[#274B36] text-[#2F6B48] dark:text-[#66A881] text-[11px] flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Posted to Guest Room {lastReceipt.roomNumber || selectedRoomNumber} Folio.</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] font-semibold flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill</span>
              </button>
              <button
                onClick={() => setLastReceipt(null)}
                className="px-4 py-1.5 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold"
              >
                Next Customer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: OPEN CASHIER SHIFT */}
      <Modal
        open={isOpenShiftOpen}
        onClose={() => setIsOpenShiftOpen(false)}
        title="Open Cashier Shift Session"
        maxWidthClass="max-w-sm"
      >
        <form onSubmit={handleOpenShiftSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Sales Outlet
            </label>
            <input
              type="text"
              disabled
              value={activeOutlet?.name || ''}
              className="seam-input w-full opacity-75"
            />
          </div>

          <div>
            <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Opening Cash Drawer Float ({currency}) *
            </label>
            <input
              type="number"
              min="0"
              step="100"
              required
              value={openFloatInput}
              onChange={(e) => setOpenFloatInput(parseFloat(e.target.value) || 0)}
              className="seam-input w-full font-mono tabular-nums font-bold text-base"
            />
            <span className="text-[11px] text-[#78837D] mt-1 block">
              Verify physical notes in drawer before opening session.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsOpenShiftOpen(false)}
              className="px-3 py-1.5 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold"
            >
              Start Shift Session
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: END / CLOSE CASHIER SHIFT */}
      <Modal
        open={isCloseShiftOpen && Boolean(activeShift)}
        onClose={() => setIsCloseShiftOpen(false)}
        title={activeShift ? `Close Session · ${activeShift.shiftNumber}` : 'Close Session'}
        maxWidthClass="max-w-md"
      >
        {activeShift && (
          <form onSubmit={handleCloseShiftSubmit} className="space-y-3.5 text-xs">
            <div className="p-3.5 bg-[#F6F8F6] dark:bg-[#192622] rounded-[10px] space-y-1.5 border border-[#E6EBE7] dark:border-[#22322C]">
              <div className="flex justify-between text-[#78837D]">
                <span>Opening Float:</span>
                <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] tabular-nums">
                  {formatCurrency(activeShift.openingFloat, currency)}
                </span>
              </div>
              <div className="flex justify-between text-[#78837D]">
                <span>Cash Sales Recorded:</span>
                <span className="font-mono font-semibold text-[#2F6B48] dark:text-[#66A881] tabular-nums">
                  +{formatCurrency(activeShift.cashSales, currency)}
                </span>
              </div>
              <div className="flex justify-between text-[#78837D]">
                <span>Telebirr / Mobile Money:</span>
                <span className="font-mono text-[#202B27] dark:text-[#ECF1EE] tabular-nums">
                  {formatCurrency(activeShift.telebirrSales, currency)}
                </span>
              </div>
              <div className="flex justify-between text-[#78837D]">
                <span>Room Folio Charges:</span>
                <span className="font-mono text-[#173F35] dark:text-[#C6A15B] font-semibold tabular-nums">
                  {formatCurrency(activeShift.roomChargeSales, currency)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E6EBE7] dark:border-[#22322C] flex justify-between font-bold text-sm text-[#202B27] dark:text-[#ECF1EE]">
                <span>Expected Cash in Drawer:</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(activeShift.openingFloat + activeShift.cashSales, currency)}
                </span>
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Actual Physical Cash Counted ({currency}) *
              </label>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={actualCashInput}
                onChange={(e) => setActualCashInput(parseFloat(e.target.value) || 0)}
                className="seam-input w-full font-mono tabular-nums font-bold text-base"
              />
            </div>

            <div
              className={`p-2.5 rounded-[8px] border flex items-center justify-between font-semibold ${
                actualCashInput - (activeShift.openingFloat + activeShift.cashSales) >= 0
                  ? 'bg-[#EEF5F0] border-[#CDE0D3] text-[#2F6B48] dark:bg-[#15291E] dark:border-[#274B36] dark:text-[#66A881]'
                  : 'bg-[#FDF2F2] border-[#F2C7C5] text-[#B6463D] dark:bg-[#2E1616] dark:border-[#4F2625] dark:text-[#E27A71]'
              }`}
            >
              <span>Till Variance (Over / Short):</span>
              <span className="font-mono tabular-nums">
                {actualCashInput - (activeShift.openingFloat + activeShift.cashSales) >= 0 ? '+' : ''}
                {formatCurrency(actualCashInput - (activeShift.openingFloat + activeShift.cashSales), currency)}
              </span>
            </div>

            <div>
              <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                End of Shift Auditor Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Till balanced, cash handed over to safe"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                className="seam-input w-full"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
              <button
                type="button"
                onClick={() => setIsCloseShiftOpen(false)}
                className="px-3 py-1.5 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-[8px] bg-[#B6463D] hover:bg-[#9C3A32] text-white font-semibold"
              >
                Confirm &amp; Close Shift
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
