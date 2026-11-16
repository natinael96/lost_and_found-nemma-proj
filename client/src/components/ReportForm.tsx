import React, { useState } from "react";
import { CreateReportFormData, MetadataResponse } from "../types";
import { Send, CheckCircle2 } from "lucide-react";

interface ReportFormProps {
  type: "lost" | "found";
  metadata: MetadataResponse | null;
  onSubmit: (data: CreateReportFormData) => Promise<void>;
  onCancel?: () => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({
  type,
  metadata,
  onSubmit,
  onCancel,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("electronics");
  const [subcategory, setSubcategory] = useState("wireless_earbuds");
  const [color, setColor] = useState("");
  const [location, setLocation] = useState("library");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [eventTime, setEventTime] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [distinguishingFeatures, setDistinguishingFeatures] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Available subcategories based on chosen category
  const availableSubcategories = React.useMemo(() => {
    if (!metadata) return [];
    const catGroup = metadata.categories[category];
    if (!catGroup) return [];

    const subs: { key: string; label: string }[] = [];
    for (const group of Object.values(catGroup)) {
      for (const sub of group) {
        subs.push({
          key: sub,
          label: formatLabel(sub),
        });
      }
    }
    return subs;
  }, [metadata, category]);

  // When category changes, default subcategory to first available
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCat = e.target.value;
    setCategory(newCat);
    if (metadata && metadata.categories[newCat]) {
      const firstGroup = Object.values(metadata.categories[newCat])[0];
      if (firstGroup && firstGroup[0]) {
        setSubcategory(firstGroup[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Item name is required.");
      return;
    }

    if (!eventDate) {
      setError("Date lost/found is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        type,
        title: title.trim(),
        category,
        subcategory,
        color: color ? color.trim() : undefined,
        location,
        event_date: eventDate,
        event_time: eventTime ? eventTime.trim() : undefined,
        brand: brand ? brand.trim() : undefined,
        description: description ? description.trim() : undefined,
        distinguishing_features: distinguishingFeatures
          ? distinguishingFeatures.trim()
          : undefined,
      });

      setSuccess(true);
      // Reset form
      setTitle("");
      setBrand("");
      setDescription("");
      setDistinguishingFeatures("");
      setColor("");
      setEventTime("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLost = type === "lost";
  const idPrefix = isLost ? "lost" : "found";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={`p-5 border-b border-slate-100 ${isLost ? "bg-amber-50/40" : "bg-emerald-50/40"}`}>
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
              isLost
                ? "bg-amber-100/70 text-amber-900 border-amber-200"
                : "bg-emerald-100/70 text-emerald-900 border-emerald-200"
            }`}
          >
            {isLost ? "Missing Property" : "Found Property"}
          </span>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {isLost ? "Report a Lost Item" : "Report a Found Item"}
          </h2>
        </div>
        <p className="text-xs text-slate-600 mt-0.5">
          {isLost
            ? "Submit details of an item you misplaced on campus."
            : "Turn in details for an item discovered on campus."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {error && (
          <div role="alert" className="p-3 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="p-3 text-xs rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Report submitted successfully! New matches are being evaluated.
          </div>
        )}

        {/* Item Name */}
        <div>
          <label htmlFor={`${idPrefix}-title`} className="block text-xs font-semibold text-slate-700 mb-1">
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            id={`${idPrefix}-title`}
            type="text"
            required
            aria-required="true"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isLost ? "e.g., Black AirPods Pro Case" : "e.g., Apple Charging Case found on table"}
            className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
        </div>

        {/* Category & Subcategory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${idPrefix}-category`} className="block text-xs font-semibold text-slate-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id={`${idPrefix}-category`}
              aria-required="true"
              value={category}
              onChange={handleCategoryChange}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white"
            >
              {metadata &&
                Object.keys(metadata.categories).map((cat) => (
                  <option key={cat} value={cat}>
                    {formatLabel(cat)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor={`${idPrefix}-subcategory`} className="block text-xs font-semibold text-slate-700 mb-1">
              Subcategory <span className="text-red-500">*</span>
            </label>
            <select
              id={`${idPrefix}-subcategory`}
              aria-required="true"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white"
            >
              {availableSubcategories.map((sub) => (
                <option key={sub.key} value={sub.key}>
                  {sub.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location & Color */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${idPrefix}-location`} className="block text-xs font-semibold text-slate-700 mb-1">
              Campus Location <span className="text-red-500">*</span>
            </label>
            <select
              id={`${idPrefix}-location`}
              aria-required="true"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white"
            >
              {metadata &&
                Object.keys(metadata.campusLocations).map((loc) => (
                  <option key={loc} value={loc}>
                    {formatLabel(loc)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor={`${idPrefix}-color`} className="block text-xs font-semibold text-slate-700 mb-1">
              Color <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <select
              id={`${idPrefix}-color`}
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white"
            >
              <option value="">-- Not specified / Unknown --</option>
              {metadata &&
                Object.keys(metadata.colorGroups).map((col) => (
                  <option key={col} value={col}>
                    {formatLabel(col)}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${idPrefix}-date`} className="block text-xs font-semibold text-slate-700 mb-1">
              Date {isLost ? "Lost" : "Found"} <span className="text-red-500">*</span>
            </label>
            <input
              id={`${idPrefix}-date`}
              type="date"
              required
              aria-required="true"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white"
            />
          </div>

          <div>
            <label htmlFor={`${idPrefix}-time`} className="block text-xs font-semibold text-slate-700 mb-1">
              Approximate Time <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              id={`${idPrefix}-time`}
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white"
            />
          </div>
        </div>

        {/* Brand */}
        <div>
          <label htmlFor={`${idPrefix}-brand`} className="block text-xs font-semibold text-slate-700 mb-1">
            Brand / Model <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <input
            id={`${idPrefix}-brand`}
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g., Apple, The North Face, Dell"
            className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor={`${idPrefix}-description`} className="block text-xs font-semibold text-slate-700 mb-1">
            Description <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <textarea
            id={`${idPrefix}-description`}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="General appearance, where it was left or found..."
            className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
        </div>

        {/* Distinguishing Features */}
        <div>
          <label htmlFor={`${idPrefix}-features`} className="block text-xs font-semibold text-slate-700 mb-1">
            Distinguishing Features <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <textarea
            id={`${idPrefix}-features`}
            rows={2}
            value={distinguishingFeatures}
            onChange={(e) => setDistinguishingFeatures(e.target.value)}
            placeholder="Scratches, stickers, keychains, engravings..."
            className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[44px] px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition flex items-center"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 ${
              isLost
                ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
                : "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
            }`}
          >
            <Send className="w-4 h-4" />
            {isSubmitting
              ? "Submitting..."
              : isLost
              ? "Submit Lost Item"
              : "Submit Found Item"}
          </button>
        </div>
      </form>
    </div>
  );
};

function formatLabel(str: string): string {
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
