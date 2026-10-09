import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Search,
  IndianRupee,
  FileText,
  ExternalLink,
  Shield,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { getAllSchemes } from '../services/api';

const CATEGORIES = ['All Categories', 'Agriculture', 'Healthcare', 'Housing', 'Social Welfare', 'Education'];

export default function SchemeCatalogView({ onSelectSchemeForMatch }) {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllSchemes();
      setSchemes(data.schemes || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load schemes catalog.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSchemes = schemes.filter((s) => {
    const matchesCategory =
      selectedCategory === 'All Categories' ||
      s.category?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      search.trim() === '' ||
      s.scheme_name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      (s.category && s.category.toLowerCase().includes(search.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-6xl space-y-6"
    >
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-6 md:p-8 backdrop-blur-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
              PostgreSQL Verified Catalog
            </span>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 ring-1 ring-inset ring-amber-500/20">
              {schemes.length} Active Schemes
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Government Welfare Schemes Directory
          </h2>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Browse all codified welfare programs, their specific eligibility thresholds, financial benefit
            values, and mandatory documentation checklists.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schemes or criteria..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                active
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'border border-slate-800 bg-slate-900/70 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="mt-3 text-xs text-slate-400">Loading schemes from Supabase PostgreSQL...</p>
        </div>
      ) : filteredSchemes.length > 0 ? (
        /* Grid of Schemes */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredSchemes.map((scheme, idx) => (
            <motion.div
              key={scheme.scheme_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl shadow-lg hover:border-emerald-500/30 transition"
            >
              <div>
                {/* Category & Benefit Value */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                    {scheme.category}
                  </span>
                  <div className="flex items-center gap-1 rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-3 py-1 font-mono text-xs font-bold text-emerald-400">
                    <IndianRupee className="h-3 w-3" />
                    <span>{Number(scheme.total_benefit_value).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Scheme Name & Description */}
                <h3 className="mt-3 text-base font-bold text-white tracking-tight">
                  {scheme.scheme_name}
                </h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  {scheme.description}
                </p>

                {/* Eligibility Criteria Breakdown */}
                <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3.5 space-y-2 text-[11px]">
                  <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                    Relational Constraints:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono">
                    <div>
                      <span className="text-slate-500">Max Income: </span>
                      {scheme.max_income ? `₹${Number(scheme.max_income).toLocaleString('en-IN')}` : 'No Limit'}
                    </div>
                    <div>
                      <span className="text-slate-500">Age: </span>
                      {scheme.min_age || 0} - {scheme.max_age || 120} yrs
                    </div>
                    <div>
                      <span className="text-slate-500">Target: </span>
                      {scheme.target_occupation || 'All Occupations'}
                    </div>
                    <div>
                      <span className="text-slate-500">Disability: </span>
                      {scheme.requires_disability ? 'Required' : 'Not Required'}
                    </div>
                  </div>
                </div>

                {/* Required Documents */}
                {scheme.required_documents && (
                  <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-400">
                    <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <p>
                      <strong className="text-slate-300">Required: </strong>
                      {scheme.required_documents}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Links */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                {scheme.official_url ? (
                  <a
                    href={scheme.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-500">Direct Civic Center Apply</span>
                )}

                <button
                  onClick={() => onSelectSchemeForMatch && onSelectSchemeForMatch(scheme)}
                  className="rounded-xl border border-emerald-500/30 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-emerald-600 hover:text-white transition"
                >
                  Check My Eligibility
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-500 mb-2" />
          <h4 className="text-sm font-semibold text-white">No Schemes Found</h4>
          <p className="mt-1 text-xs text-slate-400">No programs match the search or category filter.</p>
        </div>
      )}
    </motion.div>
  );
}
