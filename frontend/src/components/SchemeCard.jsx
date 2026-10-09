import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  FileText,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  Phone,
  Sparkles,
  IndianRupee,
} from 'lucide-react';

const CATEGORY_STYLES = {
  Agriculture: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30 border-emerald-500/20',
  Housing: 'bg-amber-500/10 text-amber-400 ring-amber-500/30 border-amber-500/20',
  Healthcare: 'bg-rose-500/10 text-rose-400 ring-rose-500/30 border-rose-500/20',
  Education: 'bg-purple-500/10 text-purple-400 ring-purple-500/30 border-purple-500/20',
  'Financial Inclusion': 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/30 border-cyan-500/20',
};

export default function SchemeCard({ scheme, serviceCenters = [], index = 0 }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedBenefit = Number(scheme.total_benefit_value).toLocaleString('en-IN');
  const categoryStyle = CATEGORY_STYLES[scheme.category] || 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30 border-emerald-500/20';

  // Parse required documents into bulleted list
  const docList = scheme.required_documents
    ? scheme.required_documents.split(',').map((d) => d.trim()).filter(Boolean)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition-all duration-300 hover:border-emerald-500/30 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-emerald-500/10"
    >
      {/* Top Bar: Category Pill & Benefit Highlight */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${categoryStyle}`}
          >
            <Sparkles className="h-3 w-3" />
            {scheme.category}
          </span>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
              Max Benefit
            </span>
            <div className="flex items-center justify-end gap-0.5 text-lg font-bold tracking-tight text-emerald-400">
              <IndianRupee className="h-4 w-4" />
              <span>{formattedBenefit}</span>
            </div>
          </div>
        </div>

        {/* Scheme Title & Description */}
        <h3 className="mt-3 text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
          {scheme.scheme_name}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-300 line-clamp-3">
          {scheme.description}
        </p>

        {/* Required Documents Section */}
        {docList.length > 0 && (
          <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/70 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              Required Documentation
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              {docList.map((doc, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Expandable Service Centers Section */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between gap-2">
          {serviceCenters.length > 0 ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-300 transition"
            >
              <MapPin className="h-3.5 w-3.5 text-indigo-400" />
              <span>Facilitation Centers ({serviceCenters.length})</span>
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <span className="text-[11px] text-slate-500">Contact civic center</span>
          )}

          {scheme.official_url && (
            <a
              href={scheme.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600/10 px-2.5 py-1 text-xs font-semibold text-indigo-400 hover:bg-indigo-600/20 transition"
            >
              <span>Official Portal</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Expandable Centers Content */}
        <AnimatePresence>
          {isExpanded && serviceCenters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-3 space-y-2 overflow-hidden"
            >
              {serviceCenters.map((center) => (
                <div
                  key={center.center_id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-[11px] text-slate-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{center.name}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                      {center.location_zone}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-400">{center.address}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                    {center.contact_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-emerald-400" />
                        {center.contact_phone}
                      </span>
                    )}
                    {center.operating_hours && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-indigo-400" />
                        {center.operating_hours}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
