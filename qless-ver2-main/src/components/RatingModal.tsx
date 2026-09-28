'use client';

import { useState } from 'react';
import { Star, X, Check, Loader2, Sparkles } from 'lucide-react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId?: number | null;
  appointmentId?: number | null;
  officeOrDeptName: string;
  onSuccess?: () => void;
}

export default function RatingModal({
  isOpen,
  onClose,
  ticketId,
  appointmentId,
  officeOrDeptName,
  onSuccess,
}: RatingModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const TAGS = [
    'Fast & Efficient',
    'Helpful Staff',
    'Clear Guidance',
    'Minimal Wait Time',
    'Friendly Service',
    'Easy Process',
  ];

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fullFeedback = [
        selectedTags.length > 0 ? `Tags: ${selectedTags.join(', ')}` : '',
        feedback ? `Comment: ${feedback}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const res = await fetch('/api/student/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticketId || null,
          appointmentId: appointmentId || null,
          officeOrDept: officeOrDeptName,
          rating,
          feedback: fullFeedback || 'Great service',
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Rating submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Thank You!</h3>
            <p className="text-xs text-slate-500">Your rating and feedback have been submitted successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center space-x-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-full mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SERVICE RATING & REVIEW</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">{officeOrDeptName}</h3>
              <p className="text-xs text-slate-500 mt-1">How was your service experience today?</p>
            </div>

            {/* STAR RATING PICKER */}
            <div className="flex justify-center items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= (hoverRating || rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transform hover:scale-110 transition"
                  >
                    <Star
                      className={`w-9 h-9 ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                          : 'text-slate-300 fill-slate-100'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* QUICK TAG CHIPS */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 text-center">
                What went well? (Optional)
              </label>
              <div className="flex flex-wrap justify-center gap-2">
                {TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${
                        isSelected
                          ? 'bg-red-700 text-white border-red-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FEEDBACK TEXTAREA */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Additional Comments
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts to help us improve campus service..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-red-600 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3.5 rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : (
                <span>SUBMIT RATING & REVIEW</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
