/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Online Reputation, Guest Reviews, Sentiment Analytics & Survey Engine
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Star,
  MessageSquareQuote,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Send,
  MessageCircle,
  BarChart3,
  Mail,
  Smartphone,
  Search,
  Plus,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  Clock,
  UserCheck,
} from 'lucide-react';
import {
  Hotel,
  GuestReview,
  ReviewChannel,
  DepartmentSentimentCategory,
  ReviewSentimentPolarity,
} from '../../types/saas';
import { CurrentUser } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { storageService } from '../../services/storage';
import { PageHeader, KpiCard, StatusBadge, Modal, EmptyState, SampleDataBadge } from '../ui';

interface ReputationAndReviewHubProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

export const ReputationAndReviewHub: React.FC<ReputationAndReviewHubProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();
  const hotelId = activeHotel?.id || '';
  const hotelName = activeHotel?.name || 'Property';

  const [activeTab, setActiveTab] = useState<'stream' | 'sentiment' | 'surveys'>('stream');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedReviewForResponse, setSelectedReviewForResponse] = useState<GuestReview | null>(null);
  const [responseText, setResponseText] = useState('');
  const [publishToChannel, setPublishToChannel] = useState(true);

  const [selectedReviewForEscalation, setSelectedReviewForEscalation] = useState<GuestReview | null>(null);
  const [hodDepartment, setHodDepartment] = useState('Front Office & Engineering');
  const [escalationNotes, setEscalationNotes] = useState('');

  const [selectedReviewForResolution, setSelectedReviewForResolution] = useState<GuestReview | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [showIngestModal, setShowIngestModal] = useState(false);
  const [newReviewData, setNewReviewData] = useState({
    channel: 'google_reviews' as ReviewChannel,
    guestName: '',
    roomNumber: '',
    rating: 5,
    title: '',
    comment: '',
    stayDate: new Date().toISOString().slice(0, 10),
    sentimentCategory: 'front_desk' as DepartmentSentimentCategory,
    sentimentPolarity: 'positive' as ReviewSentimentPolarity,
    sentimentScore: 0.9,
    isVerifiedStay: true,
  });

  const [surveySimName, setSurveySimName] = useState('Abel Kebede');
  const [surveySimRoom, setSurveySimRoom] = useState('214');
  const [surveySimNps, setSurveySimNps] = useState(10);
  const [surveySimCsat, setSurveySimCsat] = useState(5);
  const [surveySimFeedback, setSurveySimFeedback] = useState(
    'Exceptional stay, smooth express checkout, and memorable breakfast service.'
  );
  const [surveySimCampaignId, setSurveySimCampaignId] = useState('camp_01');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setChannelFilter('all');
    setSentimentFilter('all');
    setSearchQuery('');
    setSelectedReviewForResponse(null);
    setSelectedReviewForEscalation(null);
    setSelectedReviewForResolution(null);
    setRefreshKey((k) => k + 1);
  }, [hotelId]);

  const reviews = useMemo(() => {
    if (!hotelId) return [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return storageService.getGuestReviews(hotelId);
  }, [hotelId, refreshKey]);

  const campaigns = useMemo(() => {
    if (!hotelId) return [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return storageService.getSurveyCampaigns(hotelId);
  }, [hotelId, refreshKey]);

  const surveyResponses = useMemo(() => {
    if (!hotelId) return [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return storageService.getSurveyResponses(hotelId);
  }, [hotelId, refreshKey]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (channelFilter !== 'all' && r.channel !== channelFilter) return false;
      if (sentimentFilter !== 'all' && r.sentimentPolarity !== sentimentFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesGuest = r.guestName.toLowerCase().includes(query);
        const matchesTitle = r.title.toLowerCase().includes(query);
        const matchesComment = r.comment.toLowerCase().includes(query);
        const matchesRoom = r.roomNumber && r.roomNumber.toLowerCase().includes(query);
        if (!matchesGuest && !matchesTitle && !matchesComment && !matchesRoom) return false;
      }
      return true;
    });
  }, [reviews, channelFilter, sentimentFilter, searchQuery]);

  const metrics = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return {
        avgRating: 5.0,
        positiveCount: 0,
        neutralCount: 0,
        negativeCount: 0,
        pendingEscalations: 0,
        npsScore: 0,
        promoterPct: 0,
        passivePct: 0,
        detractorPct: 0,
      };
    }

    const sumRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Math.round((sumRating / total) * 10) / 10;

    const positiveCount = reviews.filter((r) => r.sentimentPolarity === 'positive').length;
    const neutralCount = reviews.filter((r) => r.sentimentPolarity === 'neutral').length;
    const negativeCount = reviews.filter((r) => r.sentimentPolarity === 'negative').length;
    const pendingEscalations = reviews.filter(
      (r) => r.isEscalatedToHOD && r.hodEscalationStatus !== 'resolved'
    ).length;

    let calculatedNps = 0;
    let promoterPct = 0;
    let passivePct = 0;
    let detractorPct = 0;
    if (surveyResponses.length > 0) {
      const promoters = surveyResponses.filter((s) => s.npsScore >= 9).length;
      const passives = surveyResponses.filter((s) => s.npsScore >= 7 && s.npsScore <= 8).length;
      const detractors = surveyResponses.filter((s) => s.npsScore <= 6).length;
      calculatedNps = Math.round(((promoters - detractors) / surveyResponses.length) * 100);
      promoterPct = Math.round((promoters / surveyResponses.length) * 100);
      passivePct = Math.round((passives / surveyResponses.length) * 100);
      detractorPct = Math.round((detractors / surveyResponses.length) * 100);
    }

    return {
      avgRating,
      positiveCount,
      neutralCount,
      negativeCount,
      pendingEscalations,
      npsScore: calculatedNps,
      promoterPct,
      passivePct,
      detractorPct,
    };
  }, [reviews, surveyResponses]);

  const departmentStats = useMemo(() => {
    const depts: Record<
      DepartmentSentimentCategory,
      { label: string; count: number; totalScore: number; positive: number; negative: number }
    > = {
      front_desk: { label: 'Front Desk & Concierge', count: 0, totalScore: 0, positive: 0, negative: 0 },
      housekeeping: { label: 'Housekeeping & Linen Care', count: 0, totalScore: 0, positive: 0, negative: 0 },
      fnb_dining: { label: 'F&B Dining, Bar & Banquets', count: 0, totalScore: 0, positive: 0, negative: 0 },
      room_comfort: { label: 'Room Comfort, Climate & Quietude', count: 0, totalScore: 0, positive: 0, negative: 0 },
      value_service: { label: 'Value Perception & Billing', count: 0, totalScore: 0, positive: 0, negative: 0 },
    };

    reviews.forEach((r) => {
      const target = depts[r.sentimentCategory];
      if (target) {
        target.count += 1;
        target.totalScore += r.rating;
        if (r.sentimentPolarity === 'positive') target.positive += 1;
        if (r.sentimentPolarity === 'negative') target.negative += 1;
      }
    });

    return Object.entries(depts).map(([cat, data]) => ({
      category: cat as DepartmentSentimentCategory,
      label: data.label,
      count: data.count,
      avgRating: data.count > 0 ? (data.totalScore / data.count).toFixed(1) : '5.0',
      positivePct: data.count > 0 ? Math.round((data.positive / data.count) * 100) : 100,
      negativePct: data.count > 0 ? Math.round((data.negative / data.count) * 100) : 0,
    }));
  }, [reviews]);

  if (!activeHotel) return null;

  const applyTemplate = (type: 'diplomatic' | 'apology' | 'family') => {
    if (!selectedReviewForResponse) return;
    const guest = selectedReviewForResponse.guestName;
    if (type === 'diplomatic') {
      setResponseText(
        `Dear ${guest},\n\nOn behalf of the executive leadership at ${hotelName}, thank you for your esteemed patronage and feedback. We are honored by your gracious remarks regarding our service standards and look forward to welcoming you back soon.\n\nWarm regards,\nGeneral Manager`
      );
    } else if (type === 'apology') {
      setResponseText(
        `Dear ${guest},\n\nThank you for sharing your feedback. We sincerely apologize for the inconvenience experienced during your stay at ${hotelName}. Our Department Head and Chief Engineer have reviewed the matter and corrective protocols are underway.\n\nSincerely,\nDirector of Guest Experience`
      );
    } else {
      setResponseText(
        `Dear ${guest},\n\nThank you so much for your wonderful review! Our entire team at ${hotelName} is delighted that you enjoyed your stay. We look forward to welcoming you back soon!\n\nBest regards,\nGuest Relations Team`
      );
    }
  };

  const currentActor = {
    email: currentUser?.email || 'admin@seamhotel.com',
    fullName: currentUser?.fullName || 'General Manager',
    role: currentUser?.role || 'hotel_admin',
  };

  const handleSaveResponse = () => {
    if (!selectedReviewForResponse || !responseText.trim()) return;
    storageService.addManagementResponse(
      selectedReviewForResponse.id,
      responseText,
      publishToChannel,
      currentActor
    );
    setSelectedReviewForResponse(null);
    setResponseText('');
    setRefreshKey((k) => k + 1);
    toast('Official management response published', { variant: 'success' });
  };

  const handleSaveEscalation = () => {
    if (!selectedReviewForEscalation) return;
    storageService.escalateReviewToHOD(
      selectedReviewForEscalation.id,
      hodDepartment,
      escalationNotes,
      currentActor
    );
    setSelectedReviewForEscalation(null);
    setEscalationNotes('');
    setRefreshKey((k) => k + 1);
    toast(`Escalation dispatched to ${hodDepartment}`, { variant: 'warning' });
  };

  const handleSaveResolution = () => {
    if (!selectedReviewForResolution || !resolutionNotes.trim()) return;
    storageService.resolveHODReviewEscalation(
      selectedReviewForResolution.id,
      resolutionNotes,
      currentActor
    );
    setSelectedReviewForResolution(null);
    setResolutionNotes('');
    setRefreshKey((k) => k + 1);
    toast('HOD escalation marked resolved', { variant: 'success' });
  };

  const handleIngestReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewData.guestName.trim() || !newReviewData.title.trim() || !newReviewData.comment.trim()) return;

    storageService.createGuestReview(
      {
        hotelId,
        channel: newReviewData.channel,
        guestName: newReviewData.guestName,
        roomNumber: newReviewData.roomNumber || undefined,
        rating: Number(newReviewData.rating),
        title: newReviewData.title,
        comment: newReviewData.comment,
        reviewDate: new Date().toISOString().slice(0, 10),
        stayDate: newReviewData.stayDate,
        sentimentCategory: newReviewData.sentimentCategory,
        sentimentPolarity: newReviewData.sentimentPolarity,
        sentimentScore:
          newReviewData.sentimentPolarity === 'positive'
            ? 0.9
            : newReviewData.sentimentPolarity === 'negative'
            ? -0.8
            : 0.0,
        isVerifiedStay: newReviewData.isVerifiedStay,
        isEscalatedToHOD: newReviewData.sentimentPolarity === 'negative',
        hodDepartment: newReviewData.sentimentPolarity === 'negative' ? 'Front Office & Guest Services' : undefined,
        hodEscalationStatus: newReviewData.sentimentPolarity === 'negative' ? 'investigating' : undefined,
      },
      currentActor
    );

    setShowIngestModal(false);
    setNewReviewData({
      channel: 'google_reviews',
      guestName: '',
      roomNumber: '',
      rating: 5,
      title: '',
      comment: '',
      stayDate: new Date().toISOString().slice(0, 10),
      sentimentCategory: 'front_desk',
      sentimentPolarity: 'positive',
      sentimentScore: 0.9,
      isVerifiedStay: true,
    });
    setRefreshKey((k) => k + 1);
    toast('External guest review ingested into reputation stream', { variant: 'success' });
  };

  const handleSimulateSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveySimName.trim() || !surveySimFeedback.trim()) return;

    storageService.submitSurveyResponse({
      hotelId,
      campaignId: surveySimCampaignId,
      guestName: surveySimName,
      roomNumber: surveySimRoom,
      npsScore: Number(surveySimNps),
      csatRating: Number(surveySimCsat),
      feedback: surveySimFeedback,
    });

    setRefreshKey((k) => k + 1);
    toast('Post-stay survey response recorded in live NPS metrics', { variant: 'success' });
  };

  const getChannelLabel = (channel: ReviewChannel) => {
    switch (channel) {
      case 'google_reviews':
        return 'Review Platform A';
      case 'tripadvisor':
        return 'Review Platform B';
      case 'booking_com':
        return 'OTA Channel A';
      case 'expedia':
        return 'OTA Channel B';
      default:
        return 'Direct Survey';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Guest Services', 'Reputation & Reviews']}
        title="Online Reputation & Guest Satisfaction Hub"
        subtitle={`${hotelName} · Multi-channel guest reviews, GM response drafting, HOD escalations, and post-stay NPS analytics.`}
        meta={<SampleDataBadge label="Sample data & Simulator" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="p-2 rounded-[10px] border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]"
              title="Refresh review feeds"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowIngestModal(true)}
              className="px-3.5 py-2 rounded-[10px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Ingest Review</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <KpiCard
          label="Aggregate Rating"
          value={`${metrics.avgRating} / 5.0`}
          helper={`${reviews.length} verified reviews`}
          deltaTone="positive"
          icon={Star}
        />
        <KpiCard
          label="Net Promoter Score"
          value={metrics.npsScore >= 0 ? `+${metrics.npsScore}` : String(metrics.npsScore)}
          helper={`${surveyResponses.length} survey responses`}
          deltaTone="forest"
          icon={Sparkles}
        />
        <KpiCard
          label="Positive Ratio"
          value={`${Math.round((metrics.positiveCount / (reviews.length || 1)) * 100)}%`}
          helper={`${metrics.positiveCount} pos · ${metrics.negativeCount} neg`}
          deltaTone="positive"
          icon={ThumbsUp}
        />
        <KpiCard
          label="Pending Escalations"
          value={metrics.pendingEscalations}
          helper="HOD recovery queue"
          deltaTone={metrics.pendingEscalations > 0 ? 'warning' : 'neutral'}
          icon={AlertTriangle}
        />
        <KpiCard
          label="Active Campaigns"
          value={campaigns.length}
          helper="Automated post-checkout"
          deltaTone="neutral"
          icon={Smartphone}
        />
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-[10px] w-fit flex-wrap">
        <button
          onClick={() => setActiveTab('stream')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
            activeTab === 'stream'
              ? 'bg-[#173F35] text-white'
              : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <MessageSquareQuote className="w-3.5 h-3.5" />
          <span>Review Stream ({reviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sentiment')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
            activeTab === 'sentiment'
              ? 'bg-[#173F35] text-white'
              : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Department Sentiment &amp; Escalations</span>
        </button>

        <button
          onClick={() => setActiveTab('surveys')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
            activeTab === 'surveys'
              ? 'bg-[#173F35] text-white'
              : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Post-Stay Surveys ({campaigns.length})</span>
        </button>
      </div>

      {/* TAB 1: REVIEW STREAM */}
      {activeTab === 'stream' && (
        <div className="space-y-4">
          <div className="seam-surface p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  'all',
                  'google_reviews',
                  'tripadvisor',
                  'booking_com',
                  'expedia',
                  'direct_post_stay_survey',
                ] as const
              ).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  className={`px-2.5 py-1.5 rounded-[7px] font-medium border transition-colors ${
                    channelFilter === ch
                      ? 'bg-[#173F35] text-white border-[#173F35]'
                      : 'bg-white dark:bg-[#131D1A] text-[#78837D] border-[#E6EBE7] dark:border-[#22322C] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
                  }`}
                >
                  {ch === 'all' ? 'All Channels' : getChannelLabel(ch)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={sentimentFilter}
                onChange={(e) => setSentimentFilter(e.target.value)}
                className="seam-input"
              >
                <option value="all">All Sentiments</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>

              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-[#78837D] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search reviews, guests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="seam-input w-full pl-8"
                />
              </div>
            </div>
          </div>

          {filteredReviews.length === 0 ? (
            <EmptyState
              title="No reviews match filters"
              description="Reset filters or ingest a new external guest review."
            />
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div key={review.id} className="seam-surface p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge label={getChannelLabel(review.channel)} tone="neutral" />
                      <div className="flex items-center text-[#C6A15B]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating ? 'fill-[#C6A15B] text-[#C6A15B]' : 'text-[#E6EBE7] dark:text-[#22322C]'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-mono text-xs font-bold text-[#202B27] dark:text-[#ECF1EE]">
                        {review.rating}.0
                      </span>
                      <StatusBadge
                        label={`${review.sentimentPolarity} (${Math.round(review.sentimentScore * 100)}%)`}
                        tone={
                          review.sentimentPolarity === 'positive'
                            ? 'success'
                            : review.sentimentPolarity === 'negative'
                            ? 'critical'
                            : 'warning'
                        }
                      />
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-[#78837D]">
                      <span>Stay: {review.stayDate}</span>
                      <span>Reviewed: {review.reviewDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE] text-sm">
                      {review.guestName}
                    </span>
                    {review.roomNumber && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-[5px] bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B]">
                        Room {review.roomNumber}
                      </span>
                    )}
                    {review.isVerifiedStay && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#2F6B48] dark:text-[#66A881] font-medium">
                        <UserCheck className="w-3.5 h-3.5" /> Verified Stay
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-[#202B27] dark:text-[#ECF1EE]">{review.title}</h4>
                    <p className="text-xs text-[#78837D] mt-1 leading-relaxed bg-[#F6F8F6] dark:bg-[#192622] p-3 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C]">
                      "{review.comment}"
                    </p>
                  </div>

                  {review.isEscalatedToHOD && (
                    <div
                      className={`p-3 rounded-[8px] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                        review.hodEscalationStatus === 'resolved'
                          ? 'bg-[#EEF5F0] dark:bg-[#15291E] border-[#CDE0D3] dark:border-[#274B36]'
                          : 'bg-[#FDF7EC] dark:bg-[#2A2012] border-[#E9D6B0] dark:border-[#4A381D]'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#9E6B1E] dark:text-[#E5B869]" />
                          <span>Escalated to {review.hodDepartment}</span>
                          <StatusBadge
                            label={review.hodEscalationStatus || 'Investigating'}
                            tone={review.hodEscalationStatus === 'resolved' ? 'success' : 'warning'}
                          />
                        </div>
                        {review.hodResolutionNotes && (
                          <p className="text-[11px] text-[#78837D]">Action: {review.hodResolutionNotes}</p>
                        )}
                      </div>

                      {review.hodEscalationStatus !== 'resolved' && (
                        <button
                          onClick={() => {
                            setSelectedReviewForResolution(review);
                            setResolutionNotes(review.hodResolutionNotes || '');
                          }}
                          className="px-3 py-1.5 bg-[#173F35] hover:bg-[#12322A] text-white font-semibold rounded-[7px] text-[11px] shrink-0"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  )}

                  {review.managementResponse ? (
                    <div className="bg-[#F6F8F6] dark:bg-[#192622] p-3.5 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[#173F35] dark:text-[#C6A15B] flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5" />
                          Management Response · {review.managementResponse.respondedBy}
                        </span>
                        {review.managementResponse.publishedToChannel && (
                          <span className="inline-flex items-center gap-1 text-[#2F6B48] dark:text-[#66A881]">
                            <CheckCircle className="w-3 h-3" /> Published
                          </span>
                        )}
                      </div>
                      <p className="text-[#202B27] dark:text-[#ECF1EE] whitespace-pre-line">
                        {review.managementResponse.responseText}
                      </p>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-[#E6EBE7] dark:border-[#22322C] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedReviewForResponse(review);
                            setResponseText('');
                          }}
                          className="px-3 py-1.5 bg-[#173F35] hover:bg-[#12322A] text-white rounded-[7px] text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Draft GM Response</span>
                        </button>

                        {!review.isEscalatedToHOD && (
                          <button
                            onClick={() => {
                              setSelectedReviewForEscalation(review);
                              setEscalationNotes('');
                            }}
                            className="px-3 py-1.5 border border-[#E6EBE7] dark:border-[#22322C] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] text-[#9E6B1E] dark:text-[#E5B869] rounded-[7px] text-xs font-medium flex items-center gap-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Escalate to HOD</span>
                          </button>
                        )}
                      </div>

                      <span className="text-[11px] text-[#78837D] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Awaiting response
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SENTIMENT */}
      {activeTab === 'sentiment' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="seam-surface p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  Net Promoter Score (NPS) Breakdown
                </h3>
                <p className="text-xs text-[#78837D] mt-0.5">
                  Calculated from verified post-checkout guest survey responses.
                </p>
              </div>

              <div className="flex items-center justify-center gap-10 py-3">
                <div className="text-center">
                  <div className="text-4xl font-bold font-mono tabular-nums text-[#173F35] dark:text-[#C6A15B]">
                    {metrics.npsScore >= 0 ? `+${metrics.npsScore}` : metrics.npsScore}
                  </div>
                  <div className="text-[11px] font-semibold text-[#78837D] uppercase tracking-wider mt-1">
                    Property NPS
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-[#2F6B48] dark:text-[#66A881] font-medium">Promoters (9–10):</span>
                    <span className="font-mono font-bold text-[#202B27] dark:text-[#ECF1EE]">
                      {metrics.promoterPct}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-[#9E6B1E] dark:text-[#E5B869] font-medium">Passives (7–8):</span>
                    <span className="font-mono font-bold text-[#202B27] dark:text-[#ECF1EE]">
                      {metrics.passivePct}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-[#B6463D] dark:text-[#E27A71] font-medium">Detractors (0–6):</span>
                    <span className="font-mono font-bold text-[#202B27] dark:text-[#ECF1EE]">
                      {metrics.detractorPct}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="seam-surface p-5 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  Departmental CSAT Polarity
                </h3>
                <p className="text-xs text-[#78837D] mt-0.5">
                  Sentiment mapping across hotel operational clusters.
                </p>
              </div>

              <div className="space-y-3">
                {departmentStats.map((dept) => (
                  <div key={dept.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#202B27] dark:text-[#ECF1EE] font-medium">{dept.label}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-semibold text-[#173F35] dark:text-[#C6A15B]">{dept.avgRating} ★</span>
                        <span className="text-[11px] text-[#78837D]">({dept.count})</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#E6EBE7] dark:bg-[#22322C] overflow-hidden flex">
                      <div className="bg-[#2F6B48] h-full" style={{ width: `${dept.positivePct}%` }} />
                      <div className="bg-[#B6463D] h-full" style={{ width: `${dept.negativePct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="seam-surface p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2F6B48] dark:text-[#66A881]" />
              <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                HOD Service Recovery &amp; Root-Cause Register
              </h3>
            </div>

            <div className="divide-y divide-[#E6EBE7] dark:divide-[#22322C]">
              {reviews.filter((r) => r.isEscalatedToHOD).length === 0 ? (
                <div className="py-6 text-center text-xs text-[#78837D]">No escalated reviews recorded.</div>
              ) : (
                reviews
                  .filter((r) => r.isEscalatedToHOD)
                  .map((esc) => (
                    <div key={esc.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{esc.guestName}</span>
                          <span className="font-mono text-[11px] text-[#78837D]">
                            Room {esc.roomNumber || 'N/A'} · {getChannelLabel(esc.channel)}
                          </span>
                        </div>
                        <StatusBadge
                          label={esc.hodEscalationStatus || 'investigating'}
                          tone={esc.hodEscalationStatus === 'resolved' ? 'success' : 'warning'}
                        />
                      </div>
                      <p className="text-[#78837D] italic">"{esc.comment}"</p>
                      <div className="bg-[#F6F8F6] dark:bg-[#192622] p-2.5 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C]">
                        <span className="font-semibold text-[#173F35] dark:text-[#C6A15B]">
                          {esc.hodDepartment}:
                        </span>{' '}
                        <span className="text-[#202B27] dark:text-[#ECF1EE]">
                          {esc.hodResolutionNotes || 'Investigation underway by department head.'}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SURVEYS */}
      {activeTab === 'surveys' && (
        <div className="space-y-5">
          <div className="seam-surface p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Automated Post-Departure Survey Channels
              </h3>
              <p className="text-xs text-[#78837D]">
                Configured triggers dispatching post-checkout via Telebirr SMS &amp; Email.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="bg-[#F6F8F6] dark:bg-[#192622] rounded-[10px] p-4 border border-[#E6EBE7] dark:border-[#22322C] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#173F35] dark:text-[#C6A15B] flex items-center gap-1.5">
                      {camp.channel === 'sms_telebirr' ? (
                        <Smartphone className="w-3.5 h-3.5" />
                      ) : (
                        <Mail className="w-3.5 h-3.5" />
                      )}
                      {camp.channel === 'sms_telebirr' ? 'SMS & Telebirr' : 'VIP Email'}
                    </span>
                    <StatusBadge label="Active" tone="success" />
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                      {camp.campaignName}
                    </h4>
                    <p className="text-xs text-[#78837D] mt-1 line-clamp-2">"{camp.questionPrompt}"</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] text-center text-xs">
                    <div>
                      <div className="text-[11px] text-[#78837D]">Trigger Delay</div>
                      <div className="font-mono font-bold text-[#202B27] dark:text-[#ECF1EE] mt-0.5">
                        {camp.triggerHoursAfterCheckout}h
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#78837D]">Dispatched</div>
                      <div className="font-mono font-bold text-[#202B27] dark:text-[#ECF1EE] mt-0.5">
                        {camp.sentCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#78837D]">Avg NPS</div>
                      <div className="font-mono font-bold text-[#173F35] dark:text-[#C6A15B] mt-0.5">
                        +{camp.avgNpsScore}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="seam-surface p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Record Guest Post-Stay Survey Response
              </h3>
              <p className="text-xs text-[#78837D]">
                Submit a mobile or kiosk survey entry to update live property NPS &amp; CSAT metrics.
              </p>
            </div>

            <form onSubmit={handleSimulateSurveySubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Guest Name</label>
                  <input
                    type="text"
                    value={surveySimName}
                    onChange={(e) => setSurveySimName(e.target.value)}
                    required
                    className="seam-input w-full"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Room #</label>
                  <input
                    type="text"
                    value={surveySimRoom}
                    onChange={(e) => setSurveySimRoom(e.target.value)}
                    required
                    className="seam-input w-full font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">
                    Campaign Channel
                  </label>
                  <select
                    value={surveySimCampaignId}
                    onChange={(e) => setSurveySimCampaignId(e.target.value)}
                    className="seam-input w-full"
                  >
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.campaignName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">
                    NPS Likelihood (0–10)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={surveySimNps}
                      onChange={(e) => setSurveySimNps(Number(e.target.value))}
                      className="w-full accent-[#173F35]"
                    />
                    <span className="font-mono font-bold text-[#173F35] dark:text-[#C6A15B] w-8 text-right">
                      {surveySimNps}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">
                    CSAT Rating (1–5 Stars)
                  </label>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setSurveySimCsat(star)}
                        className="p-0.5"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= surveySimCsat
                              ? 'fill-[#C6A15B] text-[#C6A15B]'
                              : 'text-[#E6EBE7] dark:text-[#22322C]'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] ml-2">
                      {surveySimCsat}★
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Guest Comment</label>
                <textarea
                  rows={2}
                  value={surveySimFeedback}
                  onChange={(e) => setSurveySimFeedback(e.target.value)}
                  required
                  className="seam-input w-full"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-[#173F35] hover:bg-[#12322A] text-white font-semibold rounded-[8px] text-xs inline-flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Survey Response</span>
              </button>
            </form>
          </div>

          <div className="seam-surface p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
              Recent Guest Survey Submissions
            </h3>
            <div className="divide-y divide-[#E6EBE7] dark:divide-[#22322C]">
              {surveyResponses.map((res) => (
                <div key={res.id} className="py-3 first:pt-0 last:pb-0 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{res.guestName}</span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded-[5px] bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#78837D]">
                        Room {res.roomNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="font-bold text-[#173F35] dark:text-[#C6A15B]">NPS {res.npsScore}/10</span>
                      <span className="text-[#78837D]">{new Date(res.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-[#78837D] italic">"{res.feedback}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DRAFT RESPONSE */}
      <Modal
        open={Boolean(selectedReviewForResponse)}
        onClose={() => setSelectedReviewForResponse(null)}
        title={selectedReviewForResponse ? `Respond to ${selectedReviewForResponse.guestName}` : 'Draft Response'}
        subtitle={
          selectedReviewForResponse
            ? `${getChannelLabel(selectedReviewForResponse.channel)} · ${selectedReviewForResponse.rating}★`
            : undefined
        }
        maxWidthClass="max-w-xl"
      >
        {selectedReviewForResponse && (
          <div className="space-y-3.5 text-xs">
            <div className="bg-[#F6F8F6] dark:bg-[#192622] p-3 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] text-[#78837D] italic">
              "{selectedReviewForResponse.comment}"
            </div>

            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1.5">
                Executive Templates
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyTemplate('diplomatic')}
                  className="px-2.5 py-1.5 border border-[#E6EBE7] dark:border-[#22322C] rounded-[7px] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] flex items-center gap-1 font-medium"
                >
                  <Sparkles className="w-3 h-3 text-[#C6A15B]" /> Diplomatic / VIP
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('apology')}
                  className="px-2.5 py-1.5 border border-[#E6EBE7] dark:border-[#22322C] rounded-[7px] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] flex items-center gap-1 font-medium text-[#B6463D] dark:text-[#E27A71]"
                >
                  <HeartHandshake className="w-3 h-3" /> Service Recovery
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('family')}
                  className="px-2.5 py-1.5 border border-[#E6EBE7] dark:border-[#22322C] rounded-[7px] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] flex items-center gap-1 font-medium text-[#2F6B48] dark:text-[#66A881]"
                >
                  <Star className="w-3 h-3" /> Warm Leisure
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Official Response Message
              </label>
              <textarea
                rows={5}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Compose management response..."
                className="seam-input w-full"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={publishToChannel}
                onChange={(e) => setPublishToChannel(e.target.checked)}
                className="accent-[#173F35]"
              />
              <span className="text-[#78837D]">
                Publish directly to {getChannelLabel(selectedReviewForResponse.channel)}
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
              <button
                type="button"
                onClick={() => setSelectedReviewForResponse(null)}
                className="px-4 py-1.5 border border-[#E6EBE7] dark:border-[#22322C] rounded-[8px] font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveResponse}
                disabled={!responseText.trim()}
                className="px-4 py-1.5 bg-[#173F35] hover:bg-[#12322A] disabled:opacity-45 text-white rounded-[8px] font-semibold"
              >
                Publish Response
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: ESCALATE TO HOD */}
      <Modal
        open={Boolean(selectedReviewForEscalation)}
        onClose={() => setSelectedReviewForEscalation(null)}
        title="Escalate Review to Head of Department"
        maxWidthClass="max-w-lg"
      >
        {selectedReviewForEscalation && (
          <div className="space-y-3.5 text-xs">
            <div className="bg-[#F6F8F6] dark:bg-[#192622] p-3 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] text-[#78837D] italic">
              "{selectedReviewForEscalation.comment}"
            </div>

            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Assign to Department Head
              </label>
              <select
                value={hodDepartment}
                onChange={(e) => setHodDepartment(e.target.value)}
                className="seam-input w-full"
              >
                <option value="Front Office & Guest Services">Front Office &amp; Guest Services</option>
                <option value="Engineering & Maintenance">Engineering &amp; Maintenance</option>
                <option value="Housekeeping & Laundry">Housekeeping &amp; Laundry</option>
                <option value="F&B Service & Culinary">F&amp;B Service &amp; Culinary</option>
                <option value="Security & Night Audit">Security &amp; Night Audit</option>
                <option value="Spa & Recreation">Spa &amp; Recreation</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Investigation Request &amp; Remedial Actions
              </label>
              <textarea
                rows={3}
                value={escalationNotes}
                onChange={(e) => setEscalationNotes(e.target.value)}
                placeholder="Specify root-cause investigation or guest recovery steps..."
                className="seam-input w-full"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
              <button
                type="button"
                onClick={() => setSelectedReviewForEscalation(null)}
                className="px-4 py-1.5 border border-[#E6EBE7] dark:border-[#22322C] rounded-[8px] font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEscalation}
                className="px-4 py-1.5 bg-[#B6463D] hover:bg-[#9C3A32] text-white rounded-[8px] font-semibold"
              >
                Dispatch Escalation
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: RESOLVE ESCALATION */}
      <Modal
        open={Boolean(selectedReviewForResolution)}
        onClose={() => setSelectedReviewForResolution(null)}
        title={
          selectedReviewForResolution
            ? `Resolve Escalation · ${selectedReviewForResolution.guestName}`
            : 'Resolve Escalation'
        }
        maxWidthClass="max-w-lg"
      >
        {selectedReviewForResolution && (
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Corrective Actions &amp; Root-Cause Elimination *
              </label>
              <textarea
                rows={4}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Replaced thermostat relay, credited guest folio..."
                className="seam-input w-full"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
              <button
                type="button"
                onClick={() => setSelectedReviewForResolution(null)}
                className="px-4 py-1.5 border border-[#E6EBE7] dark:border-[#22322C] rounded-[8px] font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveResolution}
                disabled={!resolutionNotes.trim()}
                className="px-4 py-1.5 bg-[#173F35] hover:bg-[#12322A] disabled:opacity-45 text-white rounded-[8px] font-semibold"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: INGEST REVIEW */}
      <Modal
        open={showIngestModal}
        onClose={() => setShowIngestModal(false)}
        title="Ingest External Guest Review"
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleIngestReview} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Channel Source</label>
              <select
                value={newReviewData.channel}
                onChange={(e) => setNewReviewData({ ...newReviewData, channel: e.target.value as ReviewChannel })}
                className="seam-input w-full"
              >
                <option value="google_reviews">Review Platform A</option>
                <option value="tripadvisor">Review Platform B</option>
                <option value="booking_com">OTA Channel A</option>
                <option value="expedia">OTA Channel B</option>
                <option value="direct_post_stay_survey">Direct Survey</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Star Rating</label>
              <select
                value={newReviewData.rating}
                onChange={(e) => setNewReviewData({ ...newReviewData, rating: Number(e.target.value) })}
                className="seam-input w-full"
              >
                <option value={5}>5 Stars - Excellent</option>
                <option value={4}>4 Stars - Very Good</option>
                <option value={3}>3 Stars - Average</option>
                <option value={2}>2 Stars - Poor</option>
                <option value={1}>1 Star - Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Guest Full Name *</label>
              <input
                type="text"
                required
                value={newReviewData.guestName}
                onChange={(e) => setNewReviewData({ ...newReviewData, guestName: e.target.value })}
                className="seam-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Room #</label>
              <input
                type="text"
                value={newReviewData.roomNumber}
                onChange={(e) => setNewReviewData({ ...newReviewData, roomNumber: e.target.value })}
                className="seam-input w-full font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Department Cluster</label>
              <select
                value={newReviewData.sentimentCategory}
                onChange={(e) =>
                  setNewReviewData({ ...newReviewData, sentimentCategory: e.target.value as DepartmentSentimentCategory })
                }
                className="seam-input w-full"
              >
                <option value="front_desk">Front Desk &amp; Concierge</option>
                <option value="fnb_dining">F&amp;B Dining &amp; Banquets</option>
                <option value="housekeeping">Housekeeping &amp; Linen</option>
                <option value="room_comfort">Room Comfort &amp; AC</option>
                <option value="value_service">Value &amp; Billing</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Sentiment Polarity</label>
              <select
                value={newReviewData.sentimentPolarity}
                onChange={(e) =>
                  setNewReviewData({ ...newReviewData, sentimentPolarity: e.target.value as ReviewSentimentPolarity })
                }
                className="seam-input w-full"
              >
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Review Headline *</label>
            <input
              type="text"
              required
              value={newReviewData.title}
              onChange={(e) => setNewReviewData({ ...newReviewData, title: e.target.value })}
              className="seam-input w-full"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Review Comment *</label>
            <textarea
              rows={3}
              required
              value={newReviewData.comment}
              onChange={(e) => setNewReviewData({ ...newReviewData, comment: e.target.value })}
              className="seam-input w-full"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowIngestModal(false)}
              className="px-4 py-1.5 border border-[#E6EBE7] dark:border-[#22322C] rounded-[8px] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#173F35] hover:bg-[#12322A] text-white rounded-[8px] font-semibold"
            >
              Ingest Review
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
