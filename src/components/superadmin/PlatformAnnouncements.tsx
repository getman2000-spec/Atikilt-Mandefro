/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Platform Announcements Broadcast Manager for Super Admin
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { PlatformAnnouncement } from '../../types/saas';
import { PageHeader, StatusBadge, EmptyState, Modal } from '../ui';
import { Megaphone, PlusCircle } from 'lucide-react';

export const PlatformAnnouncements: React.FC = () => {
  const { user, language } = useAuth();
  const isAm = language === 'am';
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>(() =>
    saasStorage.getAnnouncements()
  );

  useEffect(() => {
    setAnnouncements(saasStorage.getAnnouncements());
  }, [language]);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    titleAm: '',
    content: '',
    contentAm: '',
    severity: 'info' as 'info' | 'important' | 'critical',
    expiresAtDays: 30,
  });

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return;

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + form.expiresAtDays);

    saasStorage.saveAnnouncement(
      {
        title: form.title,
        titleAm: form.titleAm.trim() || undefined,
        content: form.content,
        contentAm: form.contentAm.trim() || undefined,
        severity: form.severity,
        createdBy: user?.fullName || 'Super Admin',
        expiresAt: expiry.toISOString(),
        active: true,
      },
      {
        email: user?.email || 'admin@seam.io',
        fullName: user?.fullName || 'Super Admin',
        role: 'super_admin',
      }
    );

    setAnnouncements(saasStorage.getAnnouncements());
    setIsComposeOpen(false);
    setForm({ title: '', titleAm: '', content: '', contentAm: '', severity: 'info', expiresAtDays: 30 });
    toast('Platform announcement published', {
      description: 'Broadcast is now active across subscribing properties.',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Platform Administration', 'Announcements']}
        title="Platform Announcements"
        subtitle="Broadcast system upgrades, maintenance windows, and policy notices to subscribing properties."
        actions={
          <button
            type="button"
            onClick={() => setIsComposeOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white text-xs font-semibold transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>New Broadcast</span>
          </button>
        }
      />

      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No platform announcements"
          description="Publish an operational notice or maintenance window to notify property administrators."
          action={
            <button
              type="button"
              onClick={() => setIsComposeOpen(true)}
              className="px-4 py-2 rounded-lg bg-[#173F35] text-white text-xs font-medium"
            >
              Create First Broadcast
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  {isAm && ann.titleAm ? ann.titleAm : ann.title}
                </h2>
                <StatusBadge
                  label={ann.severity}
                  tone={ann.severity === 'critical' ? 'critical' : ann.severity === 'important' ? 'warning' : 'forest'}
                />
              </div>
              <p className="text-xs text-[#78837D] dark:text-[#92A199] leading-relaxed">
                {isAm && ann.contentAm ? ann.contentAm : ann.content}
              </p>
              <div className="pt-2 border-t border-[#E6EBE7]/70 dark:border-[#22322C]/70 flex flex-wrap items-center gap-2 text-[11px] text-[#78837D] dark:text-[#92A199]">
                <span>Issued by {ann.createdBy}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">Published {ann.createdAt.split('T')[0]}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">Expires {ann.expiresAt.split('T')[0]}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        title="Broadcast Platform Announcement"
        subtitle="Visible to hotel administrators upon workspace login."
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Announcement Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Scheduled Platform Maintenance"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Amharic Title (Optional / አማርኛ ርዕስ)
            </label>
            <input
              type="text"
              placeholder="ለምሳሌ፡ የታቀደ የሥርዓት ጥገና"
              value={form.titleAm}
              onChange={(e) => setForm({ ...form, titleAm: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Message Body *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Detailed announcement displayed to hotel operators..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Amharic Message Body (Optional / የአማርኛ መልእክት)
            </label>
            <textarea
              rows={2}
              placeholder="ለሆቴል አስተዳዳሪዎች የሚታይ ዝርዝር መልእክት..."
              value={form.contentAm}
              onChange={(e) => setForm({ ...form, contentAm: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Severity Level
              </label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value as any })}
                className="w-full px-3 py-2 seam-input"
              >
                <option value="info">Info / General Update</option>
                <option value="important">Important / Action Required</option>
                <option value="critical">Critical / Service Window</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Display Duration
              </label>
              <select
                value={form.expiresAtDays}
                onChange={(e) => setForm({ ...form, expiresAtDays: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 seam-input"
              >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsComposeOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white font-semibold"
            >
              Publish Broadcast
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
