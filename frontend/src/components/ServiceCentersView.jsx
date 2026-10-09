import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, Search, Building2, Loader2, Navigation, AlertCircle } from 'lucide-react';
import { getServiceCenters } from '../services/api';

const ZONES = ['All Zones', 'North Zone', 'South Zone', 'Central Zone', 'East Zone', 'West Zone'];

export default function ServiceCentersView({ defaultZone = 'All Zones' }) {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedZone, setSelectedZone] = useState(defaultZone);

  useEffect(() => {
    fetchCenters(selectedZone);
  }, [selectedZone]);

  const fetchCenters = async (zone) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getServiceCenters(zone);
      setCenters(data.service_centers || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load service centers.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-6xl space-y-6"
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-6 md:p-8 backdrop-blur-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
              Civic Facilitation Centers
            </span>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 ring-1 ring-inset ring-amber-500/20">
              {centers.length} Centers Listed
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Local Seva Kendra Help Desks
          </h2>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            In-person application help, biometric Aadhaar updates, and direct document verification
            across all municipal zones.
          </p>
        </div>

        {/* Zone Selector */}
        <div className="flex flex-wrap gap-2">
          {ZONES.map((z) => (
            <button
              key={z}
              onClick={() => setSelectedZone(z)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                selectedZone === z
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {z}
            </button>
          ))}
        </div>
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
          <p className="mt-3 text-xs text-slate-400">Loading facilitation centers from database...</p>
        </div>
      ) : centers.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {centers.map((center, idx) => (
            <motion.div
              key={center.center_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl shadow-lg hover:border-emerald-500/30 transition"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-400 ring-1 ring-inset ring-amber-500/20">
                    {center.location_zone}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Open
                  </div>
                </div>

                <h3 className="mt-3 text-sm font-bold text-white tracking-tight">
                  {center.name}
                </h3>

                <div className="mt-3 flex items-start gap-2 text-xs text-slate-300">
                  <MapPin className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p>{center.address}</p>
                </div>

                <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-300">
                  <Phone className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                  <a href={`tel:${center.contact_phone}`} className="hover:text-white underline">
                    {center.contact_phone}
                  </a>
                </div>

                <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>{center.operating_hours}</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-end">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(center.name + ' ' + center.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 transition"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Get Directions</span>
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-500 mb-2" />
          <h4 className="text-sm font-semibold text-white">No Centers Found</h4>
          <p className="mt-1 text-xs text-slate-400">No centers listed for this zone.</p>
        </div>
      )}
    </motion.div>
  );
}
