import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee,
  Users,
  MapPin,
  Briefcase,
  Calendar,
  Award,
  Shield,
  CheckCircle2,
  Sparkles,
  Save,
  Search,
  RotateCcw,
  UserCheck,
} from 'lucide-react';
import { updateUserProfile } from '../services/api';

const ZONES = [
  { id: 'North Zone', label: 'North Zone', desc: 'Civil Lines, Model Town & Suburbs' },
  { id: 'South Zone', label: 'South Zone', desc: 'South Extension, Saket & Hauz Khas' },
  { id: 'Central Zone', label: 'Central Zone', desc: 'Connaught Place & Old City Market' },
  { id: 'East Zone', label: 'East Zone', desc: 'Mayur Vihar & Laxmi Nagar Belt' },
  { id: 'West Zone', label: 'West Zone', desc: 'Rajouri Garden & Janakpuri Belt' },
];

const OCCUPATIONS = [
  { id: 'Farmer', label: '🌾 Farmer / Agriculture' },
  { id: 'Street Vendor', label: '🛒 Street Vendor / Hawker' },
  { id: 'Student', label: '🎓 Student / Higher Education' },
  { id: 'Daily Wage Worker', label: '🏗️ Daily Wage Worker' },
  { id: 'Homemaker', label: '🏡 Homemaker' },
  { id: 'Self Employed', label: '💼 Small Business / Artisan' },
];

const INCOME_PRESETS = [
  { label: '₹50,000', value: 50000 },
  { label: '₹1.2 Lakh', value: 120000 },
  { label: '₹1.8 Lakh', value: 180000 },
  { label: '₹2.5 Lakh', value: 250000 },
  { label: '₹5 Lakh', value: 500000 },
];

export default function ProfileIntakeView({
  demographics,
  onChangeDemographics,
  onRunMatch,
  user,
  onOpenAuth,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const update = (field, val) => {
    onChangeDemographics({
      ...demographics,
      [field]: val,
    });
    setSaveSuccess(false);
  };

  const handleSaveToDb = async () => {
    if (!user || !user.user_id) {
      onOpenAuth();
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await updateUserProfile(user.user_id, demographics);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const score = [
    demographics.annual_income !== null && demographics.annual_income !== undefined,
    demographics.age !== null && demographics.age !== undefined,
    demographics.family_size !== null && demographics.family_size !== undefined,
    Boolean(demographics.location_zone),
    Boolean(demographics.occupation),
    Boolean(demographics.gender),
  ].filter(Boolean).length;

  const completenessPercentage = Math.round((score / 6) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-5xl space-y-8"
    >
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 p-6 md:p-8 backdrop-blur-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                Citizen Intake Module
              </span>
              {user && (
                <span className="flex items-center gap-1 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-400 ring-1 ring-inset ring-teal-500/20">
                  <UserCheck className="h-3 w-3" />
                  Linked to {user.name}
                </span>
              )}
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
              Citizen Demographic Intake
            </h2>
            <p className="mt-1 text-sm text-slate-400 max-w-xl">
              Provide your household and demographic metrics. Our deterministic relational SQL engine
              evaluates every rule directly from Supabase to find exact matching government welfare schemes.
            </p>
          </div>

          {/* Completeness Badge Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-center md:min-w-[180px]">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Profile Completeness
            </p>
            <div className="mt-1 flex items-baseline justify-center gap-1">
              <span className="text-3xl font-extrabold text-white">{completenessPercentage}%</span>
              <span className="text-xs text-emerald-400 font-bold">Ready</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-500"
                style={{ width: `${completenessPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs font-medium text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Demographics saved to your citizen record in Supabase PostgreSQL!</span>
        </div>
      )}

      {/* Error Banner */}
      {saveError && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs font-medium text-rose-300">
          <span>{saveError}</span>
        </div>
      )}

      {/* Main Intake Form Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Card 1: Financial Standing */}
        <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <IndianRupee className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Annual Household Income</h3>
                <p className="text-[11px] text-slate-400">Total yearly earnings across all members</p>
              </div>
            </div>
            <span className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1 font-mono text-sm font-bold text-emerald-400">
              {demographics.annual_income !== null && demographics.annual_income !== undefined
                ? `₹${Number(demographics.annual_income).toLocaleString('en-IN')}`
                : 'Not Set'}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs text-slate-400">Income Quick Presets:</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {INCOME_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => update('annual_income', preset.value)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      demographics.annual_income === preset.value
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400">Custom Range Slider (₹0 to ₹10 Lakhs):</label>
              <input
                type="range"
                min="0"
                max="1000000"
                step="10000"
                value={demographics.annual_income || 0}
                onChange={(e) => update('annual_income', Number(e.target.value))}
                className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500"
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-500 font-mono">
                <span>₹0 (BPL)</span>
                <span>₹2.5L</span>
                <span>₹5L</span>
                <span>₹10L+</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Household & Age */}
        <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Age & Family Structure</h3>
                <p className="text-[11px] text-slate-400">Demographic parameters for criteria rules</p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {/* Applicant Age */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Applicant Age (Years)</label>
                <span className="font-mono text-xs font-bold text-teal-400">
                  {demographics.age || 0} yrs
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={demographics.age || 0}
                onChange={(e) => update('age', Number(e.target.value))}
                className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500"
              />
            </div>

            {/* Family Members */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Total Family Members</label>
                <span className="font-mono text-xs font-bold text-slate-200">
                  {demographics.family_size || 1} Person(s)
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 8].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => update('family_size', size)}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold transition ${
                      (demographics.family_size || 1) === size
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="text-xs text-slate-300">Applicant Gender</label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {['Male', 'Female', 'Other', 'Any'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => update('gender', g === 'Any' ? null : g)}
                    className={`rounded-xl py-2 text-xs font-semibold transition ${
                      (demographics.gender || 'Any') === g
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Civic Zone Selection */}
        <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Civic Administrative Zone</h3>
                <p className="text-[11px] text-slate-400">Maps you to the closest Seva Kendra facilitation centers</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ZONES.map((z) => {
              const active = demographics.location_zone === z.id;
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => update('location_zone', z.id)}
                  className={`rounded-2xl border p-3.5 text-left transition ${
                    active
                      ? 'border-emerald-500 bg-emerald-950/40 text-white ring-1 ring-emerald-500'
                      : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <p className="text-xs font-bold">{z.label}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{z.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 4: Occupation & Landholding */}
        <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Occupation & Landholding</h3>
                <p className="text-[11px] text-slate-400">For farmer subsidies and street vendor micro-credits</p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs text-slate-300">Select Occupation</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {OCCUPATIONS.map((occ) => {
                  const active = demographics.occupation === occ.id;
                  return (
                    <button
                      key={occ.id}
                      type="button"
                      onClick={() => update('occupation', occ.id)}
                      className={`rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                        active
                          ? 'border-emerald-500 bg-emerald-950/40 text-white ring-1 ring-emerald-500'
                          : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {occ.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Landholding Slider */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Agricultural Land Owned (Acres)</label>
                <span className="font-mono text-xs font-bold text-amber-400">
                  {demographics.landholding_acres || 0} Acres
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={demographics.landholding_acres || 0}
                onChange={(e) => update('landholding_acres', Number(e.target.value))}
                className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500"
              />
            </div>

            {/* Disability Toggle */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-3.5">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-xs font-semibold text-white">Disability Beneficiary</p>
                  <p className="text-[10px] text-slate-500">Unlocks specialized disability welfare pensions</p>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={Boolean(demographics.disability_status)}
                  onChange={(e) => update('disability_status', e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-5 w-9 rounded-full bg-slate-800 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-emerald-500/20 bg-slate-900/80 p-5 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveToDb}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 active:scale-95 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5 text-emerald-400" />
            <span>{isSaving ? 'Saving...' : user ? 'Save to My Profile' : 'Sign In to Save Profile'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onChangeDemographics({
                annual_income: 180000,
                age: 30,
                family_size: 3,
                location_zone: 'North Zone',
                occupation: 'Farmer',
                gender: 'Male',
                social_category: null,
                disability_status: false,
                landholding_acres: 2,
              });
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onRunMatch}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 px-7 py-3 text-xs font-bold text-white shadow-xl shadow-emerald-600/30 transition hover:brightness-110 active:scale-[0.98]"
        >
          <Search className="h-4 w-4" />
          <span>Run Relational Match & View Schemes</span>
        </button>
      </div>
    </motion.div>
  );
}
