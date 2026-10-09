import React from 'react';
import { Sliders, RotateCcw, Search, MapPin, IndianRupee, Users, Briefcase, Award, Zap } from 'lucide-react';

const ZONES = ['All Zones', 'North Zone', 'South Zone', 'Central Zone', 'East Zone', 'West Zone'];
const OCCUPATIONS = ['All Occupations', 'Farmer', 'Street Vendor', 'Student', 'Daily Wage Worker'];
const GENDERS = ['Any', 'Male', 'Female', 'Other'];

export default function StructuredFilterPanel({
  demographics,
  onChange,
  onApply,
  onReset,
  isLoading,
  isSyncedFromChat,
}) {
  const updateField = (field, value) => {
    onChange({
      ...demographics,
      [field]: value,
    });
  };

  const formattedIncome = demographics.annual_income !== null && demographics.annual_income !== undefined
    ? `₹${Number(demographics.annual_income).toLocaleString('en-IN')}`
    : 'Not Specified';

  return (
    <div className="flex h-full flex-col rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-5 backdrop-blur-2xl shadow-xl">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-emerald-400" />
          <h2 className="text-xs font-bold tracking-wider text-white uppercase">
            Demographic Controls
          </h2>
        </div>
        {isSyncedFromChat && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/20 animate-pulse">
            <Zap className="h-3 w-3" />
            AI Synced
          </span>
        )}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto pr-1 text-xs">
        {/* Annual Income */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="flex items-center gap-1.5 font-medium text-slate-300">
              <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
              Annual Income (Max)
            </label>
            <span className="font-mono font-bold text-emerald-400">
              {formattedIncome}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1000000"
            step="10000"
            value={demographics.annual_income || 0}
            onChange={(e) => updateField('annual_income', Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500"
          />
          <div className="mt-1 flex justify-between text-[10px] text-slate-500 font-mono">
            <span>₹0</span>
            <span>₹3L</span>
            <span>₹5L</span>
            <span>₹10L+</span>
          </div>
        </div>

        {/* Age Slider */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="font-medium text-slate-300">Applicant Age</label>
            <span className="font-mono font-bold text-teal-300">
              {demographics.age !== null && demographics.age !== undefined ? `${demographics.age} years` : 'Any Age'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={demographics.age || 0}
            onChange={(e) => updateField('age', Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500"
          />
          <div className="mt-1 flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0 yrs (Infant)</span>
            <span>18 (Adult)</span>
            <span>60 (Senior)</span>
            <span>100</span>
          </div>
        </div>

        {/* Family Size */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="flex items-center gap-1.5 font-medium text-slate-300">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              Family Size
            </label>
            <span className="font-mono font-bold text-slate-200">
              {demographics.family_size || 1} member(s)
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={demographics.family_size || 1}
            onChange={(e) => updateField('family_size', Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500"
          />
        </div>

        {/* Location Zone Dropdown */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 font-medium text-slate-300">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            Location Zone
          </label>
          <select
            value={demographics.location_zone || 'All Zones'}
            onChange={(e) => updateField('location_zone', e.target.value === 'All Zones' ? null : e.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {ZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>

        {/* Occupation Dropdown */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 font-medium text-slate-300">
            <Briefcase className="h-3.5 w-3.5 text-slate-400" />
            Occupation
          </label>
          <select
            value={demographics.occupation || 'All Occupations'}
            onChange={(e) => updateField('occupation', e.target.value === 'All Occupations' ? null : e.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {OCCUPATIONS.map((occ) => (
              <option key={occ} value={occ}>
                {occ}
              </option>
            ))}
          </select>
        </div>

        {/* Gender Selector */}
        <div>
          <label className="mb-1.5 block font-medium text-slate-300">Target Gender</label>
          <div className="grid grid-cols-4 gap-1.5">
            {GENDERS.map((g) => {
              const active = (demographics.gender || 'Any') === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => updateField('gender', g === 'Any' ? null : g)}
                  className={`rounded-xl py-1.5 text-center text-[11px] font-semibold transition ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                      : 'border border-slate-800 bg-slate-950/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Landholding */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="font-medium text-slate-300">Agricultural Land (Acres)</label>
            <span className="font-mono text-amber-400 font-bold">
              {demographics.landholding_acres !== null && demographics.landholding_acres !== undefined
                ? `${demographics.landholding_acres} ac`
                : '0 ac'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="15"
            step="0.5"
            value={demographics.landholding_acres || 0}
            onChange={(e) => updateField('landholding_acres', Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500"
          />
        </div>

        {/* Disability Status Toggle */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-400" />
            <div>
              <p className="font-semibold text-slate-200">Disability Benefits</p>
              <p className="text-[10px] text-slate-400">Includes specialized disability schemes</p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={Boolean(demographics.disability_status)}
              onChange={(e) => updateField('disability_status', e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-5 w-9 rounded-full bg-slate-800 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 space-y-2 border-t border-slate-800/80 pt-4">
        <button
          onClick={onApply}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
        >
          <Search className="h-3.5 w-3.5" />
          <span>{isLoading ? 'Querying SQL Engine...' : 'Run Relational Match'}</span>
        </button>

        <button
          onClick={onReset}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-950 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset Defaults</span>
        </button>
      </div>
    </div>
  );
}
