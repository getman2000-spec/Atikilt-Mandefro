/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contextual Help Documentation Overlay
 * Slide-over guides, step-by-step workflows, searchable FAQs, and module index
 * dynamically bound to the currently active SEAM tab or operational module.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  HELP_DOCUMENTATION,
  ModuleHelpDoc,
  getHelpDocForTab,
} from '../../constants/helpDocumentation';
import { SUPER_ADMIN_NAV_GROUPS, HOTEL_NAV_GROUPS, NavItem } from '../../constants/navigation';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  RotateCcw,
  Search,
  X,
  ArrowUpRight,
} from 'lucide-react';

interface ContextualHelpOverlayProps {
  open: boolean;
  currentTab: string;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
}

type HelpSectionTab = 'guide' | 'faqs' | 'directory';

export const ContextualHelpOverlay: React.FC<ContextualHelpOverlayProps> = ({
  open,
  currentTab,
  onClose,
  onNavigateTab,
}) => {
  const { user, activeHotel, hasPermission, language } = useAuth();
  const isAm = language === 'am';
  const isSuperAdmin = user?.role === 'super_admin';

  const [inspectedTabId, setInspectedTabId] = useState<string>(currentTab);
  const [sectionTab, setSectionTab] = useState<HelpSectionTab>('guide');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndices, setOpenFaqIndices] = useState<Record<number, boolean>>({ 0: true });

  // Re-bind contextual help automatically when the active module changes or overlay opens
  useEffect(() => {
    if (open) {
      setInspectedTabId(currentTab);
      setSectionTab('guide');
      setSearchQuery('');
      setOpenFaqIndices({ 0: true });
    }
  }, [open, currentTab]);

  // Close cleanly on Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const canAccessNavItem = (item: NavItem): boolean => {
    if (isSuperAdmin) return true;
    if (!item.requiredModule) return true;
    if (
      user?.role === 'hotel_admin' ||
      user?.role === 'gm' ||
      user?.role === 'owner' ||
      user?.role === 'deputy_gm'
    ) {
      return activeHotel ? activeHotel.enabledModules.includes(item.requiredModule) : true;
    }
    return hasPermission(item.requiredModule, 'view');
  };

  const accessibleNavGroups = useMemo(() => {
    const groups = isSuperAdmin ? SUPER_ADMIN_NAV_GROUPS : HOTEL_NAV_GROUPS;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter(canAccessNavItem),
      }))
      .filter((g) => g.items.length > 0);
  }, [isSuperAdmin, user?.role, activeHotel, hasPermission]);

  const accessibleTabIds = useMemo(() => {
    const set = new Set<string>();
    accessibleNavGroups.forEach((g) => g.items.forEach((item) => set.add(item.id)));
    return set;
  }, [accessibleNavGroups]);

  const activeDoc: ModuleHelpDoc = useMemo(
    () => getHelpDocForTab(inspectedTabId, isSuperAdmin),
    [inspectedTabId, isSuperAdmin]
  );

  const isViewingActiveModule = inspectedTabId === currentTab;

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: Array<{ doc: ModuleHelpDoc; matchType: 'module' | 'step' | 'faq'; snippet: string }> = [];

    for (const tabId of accessibleTabIds) {
      const doc = HELP_DOCUMENTATION[tabId];
      if (!doc) continue;

      const titleText = `${doc.title} ${doc.titleAm} ${doc.category} ${doc.categoryAm}`.toLowerCase();
      const summaryText = `${doc.summary} ${doc.summaryAm}`.toLowerCase();

      if (titleText.includes(q) || summaryText.includes(q)) {
        results.push({
          doc,
          matchType: 'module',
          snippet: isAm ? doc.summaryAm : doc.summary,
        });
        continue;
      }

      const matchedFaq = doc.faqs.find(
        (f) =>
          `${f.question} ${f.questionAm} ${f.answer} ${f.answerAm}`.toLowerCase().includes(q)
      );
      if (matchedFaq) {
        results.push({
          doc,
          matchType: 'faq',
          snippet: isAm ? matchedFaq.questionAm : matchedFaq.question,
        });
        continue;
      }

      const matchedStep = doc.steps.find(
        (s) => `${s.title} ${s.titleAm} ${s.detail} ${s.detailAm}`.toLowerCase().includes(q)
      );
      if (matchedStep) {
        results.push({
          doc,
          matchType: 'step',
          snippet: isAm ? matchedStep.titleAm : matchedStep.title,
        });
      }
    }

    return results;
  }, [searchQuery, accessibleTabIds, isAm]);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndices((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSelectGuide = (tabId: string, preferredSection: HelpSectionTab = 'guide') => {
    setInspectedTabId(tabId);
    setSectionTab(preferredSection);
    setSearchQuery('');
    setOpenFaqIndices({ 0: true });
  };

  const handleJumpToModule = (tabId: string) => {
    if (!accessibleTabIds.has(tabId)) return;
    onNavigateTab(tabId);
    onClose();
  };

  if (!open) return null;

  const docTitle = isAm ? activeDoc.titleAm : activeDoc.title;
  const docCategory = isAm ? activeDoc.categoryAm : activeDoc.category;
  const docSummary = isAm ? activeDoc.summaryAm : activeDoc.summary;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#0D1412]/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contextual-help-title"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-xl h-full bg-white dark:bg-[#131D1A] border-l border-[#E6EBE7] dark:border-[#22322C] shadow-2xl flex flex-col text-[#202B27] dark:text-[#ECF1EE]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Overlay Header */}
        <div className="px-5 py-4 border-b border-[#E6EBE7] dark:border-[#22322C] flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#78837D] dark:text-[#92A199]">
              <span>{docCategory}</span>
              <span aria-hidden="true">·</span>
              <span>
                {isViewingActiveModule
                  ? isAm
                    ? 'ንቁ ገጽ መመሪያ'
                    : 'Active Module Guide'
                  : isAm
                  ? 'የተመረጠ መመሪያ'
                  : 'Guide Preview'}
              </span>
              {!isViewingActiveModule && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => handleSelectGuide(currentTab, 'guide')}
                    className="inline-flex items-center gap-1 font-medium text-[#173F35] dark:text-[#C6A15B] hover:underline whitespace-nowrap"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{isAm ? 'ወደ ንቁው ገጽ ተመለስ' : 'Back to current view'}</span>
                  </button>
                </>
              )}
            </div>

            <h2
              id="contextual-help-title"
              className="text-base sm:text-lg font-semibold tracking-tight text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B] shrink-0" />
              <span className="truncate">{docTitle}</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#78837D] hover:text-[#202B27] dark:hover:text-white hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors shrink-0"
            aria-label={isAm ? 'የእገዛ መመሪያውን ዝጋ' : 'Close help documentation'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Segmented Navigation */}
        <div className="px-5 py-3.5 border-b border-[#E6EBE7] dark:border-[#22322C] space-y-3 shrink-0 bg-[#F6F8F6]/60 dark:bg-[#0D1412]/40">
          <div className="relative">
            <Search className="w-4 h-4 text-[#78837D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAm
                  ? 'በሁሉም መመሪያዎች እና ጥያቄዎች ውስጥ ይፈልጉ...'
                  : 'Search guides, workflows, or FAQs across modules...'
              }
              aria-label={isAm ? 'መመሪያ ፈልግ' : 'Search help documentation'}
              className="w-full pl-9 pr-8 py-2 text-xs seam-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78837D] hover:text-[#202B27] dark:hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!searchQuery && (
            <div
              className="flex items-center gap-1 p-1 rounded-lg bg-[#E6EBE7]/70 dark:bg-[#192622]"
              role="tablist"
              aria-label={isAm ? 'የእገዛ ክፍሎች' : 'Help sections'}
            >
              <button
                type="button"
                role="tab"
                aria-selected={sectionTab === 'guide'}
                onClick={() => setSectionTab('guide')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  sectionTab === 'guide'
                    ? 'bg-white dark:bg-[#131D1A] text-[#173F35] dark:text-[#ECF1EE] shadow-xs'
                    : 'text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
                }`}
              >
                {isAm ? 'የአጠቃቀም መመሪያ' : 'Guide'}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sectionTab === 'faqs'}
                onClick={() => setSectionTab('faqs')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap tabular-nums ${
                  sectionTab === 'faqs'
                    ? 'bg-white dark:bg-[#131D1A] text-[#173F35] dark:text-[#ECF1EE] shadow-xs'
                    : 'text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
                }`}
              >
                {isAm ? `ጥያቄዎች (${activeDoc.faqs.length})` : `FAQs (${activeDoc.faqs.length})`}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sectionTab === 'directory'}
                onClick={() => setSectionTab('directory')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap tabular-nums ${
                  sectionTab === 'directory'
                    ? 'bg-white dark:bg-[#131D1A] text-[#173F35] dark:text-[#ECF1EE] shadow-xs'
                    : 'text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
                }`}
              >
                {isAm
                  ? `ሁሉም ሞጁሎች (${accessibleTabIds.size})`
                  : `All Modules (${accessibleTabIds.size})`}
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Content Viewport */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {searchQuery ? (
            <div className="space-y-3">
              <div className="text-xs text-[#78837D] dark:text-[#92A199] tabular-nums">
                {isAm
                  ? `${searchResults.length} ውጤት(ቶች) ለ "${searchQuery}"`
                  : `${searchResults.length} matching topic(s) for "${searchQuery}"`}
              </div>

              {searchResults.length === 0 ? (
                <div className="py-12 text-center space-y-1.5">
                  <p className="text-sm font-medium text-[#202B27] dark:text-[#ECF1EE]">
                    {isAm ? 'ምንም ተዛማጅ መመሪያ አልተገኘም' : 'No matching documentation found'}
                  </p>
                  <p className="text-xs text-[#78837D] dark:text-[#92A199]">
                    {isAm
                      ? 'ሌላ ቁልፍ ቃል ይሞክሩ ወይም ሁሉንም ሞጁሎች ይመልከቱ።'
                      : 'Try another keyword such as VAT, folio, payroll, or night audit.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#E6EBE7] dark:divide-[#22322C]">
                  {searchResults.map(({ doc, matchType, snippet }) => (
                    <button
                      key={`${doc.tabId}_${matchType}`}
                      type="button"
                      onClick={() =>
                        handleSelectGuide(doc.tabId, matchType === 'faq' ? 'faqs' : 'guide')
                      }
                      className="w-full py-3.5 text-left flex items-start justify-between gap-3 hover:bg-[#F6F8F6] dark:hover:bg-[#192622] px-2 -mx-2 rounded-lg transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="text-xs text-[#78837D] dark:text-[#92A199]">
                          <span>{isAm ? doc.categoryAm : doc.category}</span>
                          <span aria-hidden="true"> · </span>
                          <span className="capitalize">
                            {matchType === 'faq'
                              ? isAm
                                ? 'ጥያቄ'
                                : 'FAQ'
                              : matchType === 'step'
                              ? isAm
                                ? 'ደረጃ'
                                : 'Step'
                              : isAm
                              ? 'መመሪያ'
                              : 'Overview'}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                          {isAm ? doc.titleAm : doc.title}
                        </div>
                        <p className="text-xs text-[#78837D] dark:text-[#92A199] line-clamp-2 leading-relaxed">
                          {snippet}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#78837D] shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : sectionTab === 'guide' ? (
            <div className="space-y-6">
              {/* Overview Prose */}
              <section className="space-y-2">
                <p className="text-sm leading-relaxed text-[#202B27] dark:text-[#ECF1EE]/95">
                  {docSummary}
                </p>
                {!isViewingActiveModule && accessibleTabIds.has(activeDoc.tabId) && (
                  <button
                    type="button"
                    onClick={() => handleJumpToModule(activeDoc.tabId)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#173F35] dark:text-[#C6A15B] hover:underline pt-1"
                  >
                    <span>{isAm ? 'ይህን ሞጁል ክፈት' : `Open ${docTitle}`}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </section>

              {/* Editorial Numbered Workflow Steps */}
              <section className="space-y-2">
                <h3 className="text-xs font-semibold text-[#78837D] dark:text-[#92A199]">
                  {isAm ? 'የሥራ ቅደም ተከተል' : 'Operational Workflow'}
                </h3>
                <ol className="divide-y divide-[#E6EBE7] dark:divide-[#22322C] border-t border-b border-[#E6EBE7] dark:border-[#22322C]">
                  {activeDoc.steps.map((step, index) => (
                    <li key={step.title} className="py-3.5 flex items-start gap-3.5">
                      <span className="font-mono tabular-nums text-xs font-semibold text-[#173F35] dark:text-[#C6A15B] pt-0.5 shrink-0">
                        {String(index + 1).padStart(2, '0')}.
                      </span>
                      <div className="space-y-1 min-w-0">
                        <div className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                          {isAm ? step.titleAm : step.title}
                        </div>
                        <p className="text-xs leading-relaxed text-[#78837D] dark:text-[#92A199]">
                          {isAm ? step.detailAm : step.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {/* Related Modules */}
              {activeDoc.relatedTabs && activeDoc.relatedTabs.length > 0 && (
                <section className="space-y-2.5">
                  <h3 className="text-xs font-semibold text-[#78837D] dark:text-[#92A199]">
                    {isAm ? 'ተዛማጅ ሞጁሎች' : 'Related Workflows'}
                  </h3>
                  <div className="divide-y divide-[#E6EBE7] dark:divide-[#22322C] border-t border-b border-[#E6EBE7] dark:border-[#22322C]">
                    {activeDoc.relatedTabs
                      .filter((relId) => accessibleTabIds.has(relId) && HELP_DOCUMENTATION[relId])
                      .map((relId) => {
                        const relDoc = HELP_DOCUMENTATION[relId];
                        return (
                          <div
                            key={relId}
                            className="py-2.5 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-[#202B27] dark:text-[#ECF1EE] truncate">
                                {isAm ? relDoc.titleAm : relDoc.title}
                              </div>
                              <div className="text-[11px] text-[#78837D] dark:text-[#92A199] truncate">
                                {isAm ? relDoc.categoryAm : relDoc.category}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleSelectGuide(relId, 'guide')}
                                className="inline-flex items-center gap-1 text-xs font-medium text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE] whitespace-nowrap"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>{isAm ? 'መመሪያ' : 'Read guide'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleJumpToModule(relId)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#173F35] dark:text-[#C6A15B] hover:underline whitespace-nowrap"
                              >
                                <span>{isAm ? 'ክፈት' : 'Open'}</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </section>
              )}

              {/* Keyboard Shortcuts */}
              <section className="pt-1 space-y-2">
                <h3 className="text-xs font-semibold text-[#78837D] dark:text-[#92A199]">
                  {isAm ? 'ፈጣን የቁልፍ ሰሌዳ መንገዶች' : 'Keyboard Shortcuts'}
                </h3>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#78837D] dark:text-[#92A199]">
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded text-[#202B27] dark:text-[#ECF1EE]">
                      ?
                    </kbd>
                    <span>{isAm ? 'እገዛ ክፈት / ዝጋ' : 'Toggle help'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded text-[#202B27] dark:text-[#ECF1EE]">
                      Ctrl K
                    </kbd>
                    <span>{isAm ? 'ወደ ሞጁል ዝለል' : 'Jump to module'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded text-[#202B27] dark:text-[#ECF1EE]">
                      Esc
                    </kbd>
                    <span>{isAm ? 'መስኮት ዝጋ' : 'Close overlay'}</span>
                  </div>
                </div>
              </section>
            </div>
          ) : sectionTab === 'faqs' ? (
            <div className="space-y-4">
              <p className="text-xs text-[#78837D] dark:text-[#92A199]">
                {isAm
                  ? `ለ "${docTitle}" ተደጋጋሚ ጥያቄዎች እና መልሶች`
                  : `Frequently asked questions for ${docTitle}`}
              </p>

              <div className="divide-y divide-[#E6EBE7] dark:divide-[#22322C] border-t border-b border-[#E6EBE7] dark:border-[#22322C]">
                {activeDoc.faqs.map((faq, idx) => {
                  const isExpanded = Boolean(openFaqIndices[idx]);
                  return (
                    <div key={faq.question} className="py-1">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => toggleFaq(idx)}
                        className="w-full py-3 flex items-start justify-between gap-3 text-left"
                      >
                        <span className="text-sm font-medium text-[#202B27] dark:text-[#ECF1EE]">
                          {isAm ? faq.questionAm : faq.question}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-[#78837D] shrink-0 mt-0.5 transition-transform duration-150 ${
                            isExpanded ? 'rotate-180 text-[#173F35] dark:text-[#C6A15B]' : ''
                          }`}
                        />
                      </button>
                      {isExpanded && (
                        <p className="pb-3.5 text-xs leading-relaxed text-[#78837D] dark:text-[#92A199]">
                          {isAm ? faq.answerAm : faq.answer}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {accessibleNavGroups.map((group) => (
                <section key={group.id} className="space-y-2">
                  <h3 className="text-xs font-semibold text-[#78837D] dark:text-[#92A199]">
                    {isAm ? group.labelAm : group.label}
                  </h3>
                  <div className="divide-y divide-[#E6EBE7] dark:divide-[#22322C] border-t border-b border-[#E6EBE7] dark:border-[#22322C]">
                    {group.items.map((item) => {
                      const doc = HELP_DOCUMENTATION[item.id];
                      const isCurrent = item.id === currentTab;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectGuide(item.id, 'guide')}
                          className="w-full py-2.5 px-2 -mx-2 rounded-lg flex items-center justify-between gap-3 text-left hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-2">
                              <span className="truncate">{isAm ? item.labelAm : item.label}</span>
                              {isCurrent && (
                                <span className="text-[11px] font-normal text-[#173F35] dark:text-[#C6A15B]">
                                  · {isAm ? 'አሁን ያሉበት' : 'Current'}
                                </span>
                              )}
                            </div>
                            {doc && (
                              <p className="text-[11px] text-[#78837D] dark:text-[#92A199] truncate mt-0.5">
                                {isAm ? doc.summaryAm : doc.summary}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-[#78837D] shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#E6EBE7] dark:border-[#22322C] bg-[#F6F8F6]/60 dark:bg-[#0D1412]/40 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#78837D] dark:text-[#92A199] truncate">
            <span>{user?.role.replace(/_/g, ' ')}</span>
            <span aria-hidden="true"> · </span>
            <span>{isSuperAdmin ? 'SEAM Platform' : activeHotel?.name || 'Property'}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            {isAm ? 'ዝጋ' : 'Done'}
          </button>
        </div>
      </aside>
    </div>
  );
};
