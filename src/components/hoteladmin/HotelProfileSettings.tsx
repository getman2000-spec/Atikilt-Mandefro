/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hotel Admin Organization Profile & Financial Configuration
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { PageHeader } from '../ui';
import { Building2, Save, Globe, DollarSign } from 'lucide-react';

export const HotelProfileSettings: React.FC = () => {
  const { activeHotel, refreshHotels, user, setLanguage } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: activeHotel?.name || '',
    legalName: activeHotel?.legalName || '',
    logoUrl: activeHotel?.logoUrl || '',
    street: activeHotel?.address.street || '',
    city: activeHotel?.address.city || '',
    stateRegion: activeHotel?.address.stateRegion || '',
    country: activeHotel?.address.country || '',
    phone: activeHotel?.contact.phone || '',
    email: activeHotel?.contact.email || '',
    website: activeHotel?.contact.website || '',
    emergencyPhone: activeHotel?.contact.emergencyPhone || '',
    currency: activeHotel?.operationalSettings.currency || 'ETB',
    currencySymbol: activeHotel?.operationalSettings.currencySymbol || 'Br',
    timeZone: activeHotel?.operationalSettings.timeZone || 'Africa/Addis_Ababa',
    defaultLanguage: (activeHotel?.operationalSettings.defaultLanguage || 'en') as 'en' | 'am',
    totalRooms: activeHotel?.operationalSettings.totalRooms || 30,
    vatRate: activeHotel?.operationalSettings.vatRate ?? 15,
    serviceChargeRate: activeHotel?.operationalSettings.serviceChargeRate ?? 10,
    fiscalYearStartMonth: activeHotel?.operationalSettings.fiscalYearStartMonth ?? 7,
  });

  useEffect(() => {
    if (!activeHotel) return;
    setForm({
      name: activeHotel.name,
      legalName: activeHotel.legalName,
      logoUrl: activeHotel.logoUrl || '',
      street: activeHotel.address.street,
      city: activeHotel.address.city,
      stateRegion: activeHotel.address.stateRegion || '',
      country: activeHotel.address.country,
      phone: activeHotel.contact.phone,
      email: activeHotel.contact.email,
      website: activeHotel.contact.website || '',
      emergencyPhone: activeHotel.contact.emergencyPhone || '',
      currency: activeHotel.operationalSettings.currency,
      currencySymbol: activeHotel.operationalSettings.currencySymbol,
      timeZone: activeHotel.operationalSettings.timeZone,
      defaultLanguage: activeHotel.operationalSettings.defaultLanguage || 'en',
      totalRooms: activeHotel.operationalSettings.totalRooms,
      vatRate: activeHotel.operationalSettings.vatRate ?? 15,
      serviceChargeRate: activeHotel.operationalSettings.serviceChargeRate ?? 10,
      fiscalYearStartMonth: activeHotel.operationalSettings.fiscalYearStartMonth ?? 7,
    });
  }, [activeHotel]);

  if (!activeHotel) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedHotel = {
      ...activeHotel,
      name: form.name.trim(),
      legalName: form.legalName.trim() || form.name.trim(),
      logoUrl: form.logoUrl.trim() || undefined,
      address: {
        ...activeHotel.address,
        street: form.street.trim(),
        city: form.city.trim(),
        stateRegion: form.stateRegion.trim(),
        country: form.country.trim(),
      },
      contact: {
        ...activeHotel.contact,
        phone: form.phone.trim(),
        email: form.email.trim(),
        website: form.website.trim() || undefined,
        emergencyPhone: form.emergencyPhone.trim() || undefined,
      },
      operationalSettings: {
        ...activeHotel.operationalSettings,
        currency: form.currency,
        currencySymbol: form.currencySymbol,
        timeZone: form.timeZone,
        defaultLanguage: form.defaultLanguage,
        totalRooms: Number(form.totalRooms),
        vatRate: Number(form.vatRate),
        serviceChargeRate: Number(form.serviceChargeRate),
        fiscalYearStartMonth: Number(form.fiscalYearStartMonth),
      },
    };

    saasStorage.saveHotel(updatedHotel, {
      email: user?.email || 'admin@hotel.com',
      fullName: user?.fullName || 'Hotel Admin',
      role: user?.role || 'hotel_admin',
    });

    setLanguage(form.defaultLanguage);
    refreshHotels();
    toast('Organization profile updated', {
      description: `${updatedHotel.name} settings, currency, and tax calibration saved.`,
      variant: 'success',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        breadcrumbs={['Property Configuration', 'Hotel Profile']}
        title="Organization Profile & Operational Settings"
        subtitle="Configure property identity, room inventory limits, base currency, VAT/service charge rates, and fiscal calendar."
        meta={
          <>
            <span className="font-mono">Code: {activeHotel.code}</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">Plan: {activeHotel.subscriptionPlan}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">Max Rooms: {activeHotel.limits.maxRooms}</span>
          </>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Section 1: Hotel Identity */}
        <section className="p-5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#E6EBE7] dark:border-[#22322C]">
            <Building2 className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B]" />
            <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">General Property Identity</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Hotel Commercial Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Legal Registered Entity Name
              </label>
              <input
                type="text"
                value={form.legalName}
                onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Logo Image URL
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
            {form.logoUrl && (
              <div className="mt-2.5 flex items-center gap-3">
                <img
                  src={form.logoUrl}
                  alt="Logo preview"
                  className="w-10 h-10 rounded-lg object-cover border border-[#E6EBE7] dark:border-[#22322C]"
                />
                <span className="text-[11px] text-[#78837D]">Configured property emblem preview</span>
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Contact & Address */}
        <section className="p-5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#E6EBE7] dark:border-[#22322C]">
            <Globe className="w-4 h-4 text-[#647B52]" />
            <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">Location &amp; Contact Directory</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Street Address</label>
              <input
                type="text"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">City / Town *</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Country *</label>
              <input
                type="text"
                required
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Telephone *</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Primary Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          </div>
        </section>

        {/* Section 3: Operational & Financial Calibration */}
        <section className="p-5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#E6EBE7] dark:border-[#22322C]">
            <DollarSign className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B]" />
            <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
              Financial Calibration, Rooms &amp; Tax Rates
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Base Currency *</label>
              <select
                value={form.currency}
                onChange={(e) => {
                  const curr = e.target.value;
                  const sym = curr === 'ETB' ? 'Br' : curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr;
                  setForm({ ...form, currency: curr, currencySymbol: sym });
                }}
                className="w-full px-3 py-2 seam-input"
              >
                <option value="ETB">Ethiopian Birr (ETB - Br)</option>
                <option value="USD">US Dollar (USD - $)</option>
                <option value="EUR">Euro (EUR - €)</option>
                <option value="KES">Kenyan Shilling (KES)</option>
                <option value="GBP">British Pound (GBP - £)</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Currency Symbol</label>
              <input
                type="text"
                value={form.currencySymbol}
                onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Total Guest Rooms *</label>
              <input
                type="number"
                min="1"
                max={activeHotel.limits.maxRooms}
                required
                value={form.totalRooms}
                onChange={(e) => setForm({ ...form, totalRooms: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 seam-input font-mono tabular-nums"
              />
              <span className="text-[11px] text-[#78837D] mt-1 block">
                Contract limit: {activeHotel.limits.maxRooms} rooms
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">VAT / Sales Tax %</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={form.vatRate}
                onChange={(e) => setForm({ ...form, vatRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 seam-input font-mono tabular-nums"
              />
              <span className="text-[11px] text-[#78837D] mt-1 block">Standard Ethiopia: 15%</span>
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Service Charge %</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={form.serviceChargeRate}
                onChange={(e) => setForm({ ...form, serviceChargeRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 seam-input font-mono tabular-nums"
              />
              <span className="text-[11px] text-[#78837D] mt-1 block">Standard hospitality: 10%</span>
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Fiscal Year Start Month</label>
              <select
                value={form.fiscalYearStartMonth}
                onChange={(e) => setForm({ ...form, fiscalYearStartMonth: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 seam-input"
              >
                <option value={1}>January (Gregorian Standard)</option>
                <option value={7}>July (Ethiopian Hamle / Fiscal)</option>
                <option value={4}>April</option>
                <option value={10}>October</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Default Language</label>
              <select
                value={form.defaultLanguage}
                onChange={(e) => setForm({ ...form, defaultLanguage: e.target.value as 'en' | 'am' })}
                className="w-full px-3 py-2 seam-input"
              >
                <option value="en">English</option>
                <option value="am">Amharic (አማርኛ)</option>
              </select>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white font-semibold rounded-lg transition-colors text-xs"
          >
            <Save className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>Save Profile Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
