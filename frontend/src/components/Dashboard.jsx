import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StructuredFilterPanel from './StructuredFilterPanel';
import ChatInterface from './ChatInterface';
import SchemeCard from './SchemeCard';
import SkeletonLoader from './SkeletonLoader';
import ProfileIntakeView from './ProfileIntakeView';
import SchemeCatalogView from './SchemeCatalogView';
import ServiceCentersView from './ServiceCentersView';
import HomeView from './HomeView';
import LoginView from './LoginView';
import { sendChatMessage, loginUser } from '../services/api';
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Layers,
  MapPin,
  IndianRupee,
  Lock,
  ArrowRight,
  User,
} from 'lucide-react';

const INITIAL_DEMOGRAPHICS = {
  annual_income: 180000,
  age: 30,
  family_size: 3,
  location_zone: 'North Zone',
  occupation: 'Farmer',
  gender: 'Male',
  social_category: null,
  disability_status: false,
  landholding_acres: 2,
};

const WELCOME_MESSAGES = {
  English:
    'Namaste! I am your Intelligent Civic Eligibility Assistant. I can help identify government welfare subsidies, healthcare schemes, and financial aid tailored specifically to your family. You can share your story or background, or enter your demographics directly.',
  Hindi:
    'नमस्ते! मैं आपका नागरिक पात्रता सहायक हूँ। मैं आपके परिवार के लिए उपयुक्त सरकारी कल्याणकारी योजनाएँ, कृषि सब्सिडी और वित्तीय सहायता खोजने में आपकी मदद करूँगा। कृपया अपनी स्थिति साझा करें।',
};

export default function Dashboard({
  activeTab,
  setActiveTab,
  user,
  onAuthSuccess,
  language = 'English',
}) {
  const [demographics, setDemographics] = useState(INITIAL_DEMOGRAPHICS);
  const [schemes, setSchemes] = useState([]);
  const [serviceCenters, setServiceCenters] = useState([]);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: WELCOME_MESSAGES[language] || WELCOME_MESSAGES.English,
      extracted: null,
      matchedCount: undefined,
    },
  ]);
  const [extractedPayload, setExtractedPayload] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncedFromChat, setIsSyncedFromChat] = useState(false);
  const [error, setError] = useState(null);

  // When language changes, update the initial welcome message if only 1 message exists
  useEffect(() => {
    if (messages.length === 1) {
      setMessages([
        {
          role: 'assistant',
          content: WELCOME_MESSAGES[language] || WELCOME_MESSAGES.English,
          extracted: null,
          matchedCount: undefined,
        },
      ]);
    }
  }, [language]);

  // If user has saved demographics in DB, load them on mount or user change
  useEffect(() => {
    if (user) {
      setDemographics((prev) => ({
        ...prev,
        annual_income: user.annual_income !== null && user.annual_income !== undefined ? Number(user.annual_income) : prev.annual_income,
        age: user.age !== null && user.age !== undefined ? Number(user.age) : prev.age,
        family_size: user.family_size !== null && user.family_size !== undefined ? Number(user.family_size) : prev.family_size,
        location_zone: user.location_zone || prev.location_zone,
        occupation: user.occupation || prev.occupation,
        gender: user.gender || prev.gender,
        social_category: user.social_category || prev.social_category,
        disability_status: Boolean(user.disability_status),
        landholding_acres: user.landholding_acres !== null && user.landholding_acres !== undefined ? Number(user.landholding_acres) : prev.landholding_acres,
      }));
    }
  }, [user]);

  // Initial match on mount
  useEffect(() => {
    handleRunStructuredMatch();
  }, []);

  // One-click quick login from Home demo cards
  const handleQuickLogin = async (email, password) => {
    try {
      setIsLoading(true);
      const data = await loginUser({ email, password });
      if (data.status === 'success') {
        localStorage.setItem('civic_auth_token', data.token);
        localStorage.setItem('civic_user', JSON.stringify(data.user));
        onAuthSuccess(data.user);
        setActiveTab('/chat/ai');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Multi-turn conversational handler
  const handleSendMessage = async (text) => {
    setIsLoading(true);
    setError(null);

    const updatedMessages = [...messages, { role: 'user', content: text }];
    setMessages(updatedMessages);

    try {
      const history = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const result = await sendChatMessage({
        query: text,
        history,
        demographics,
        userId: user?.user_id,
        language,
      });

      setSchemes(result.schemes || []);
      setServiceCenters(result.service_centers || []);
      setExtractedPayload(result.extracted_params || null);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.conversational_reply || result.summary || 'Based on your criteria, here are your matching schemes.',
          extracted: result.extracted_params || null,
          matchedCount: result.matched_count,
        },
      ]);

      if (result.extracted_params) {
        setDemographics((prev) => ({
          ...prev,
          annual_income: result.extracted_params.annual_income !== null && result.extracted_params.annual_income !== undefined
            ? result.extracted_params.annual_income
            : prev.annual_income,
          age: result.extracted_params.age !== null && result.extracted_params.age !== undefined
            ? result.extracted_params.age
            : prev.age,
          family_size: result.extracted_params.family_size !== null && result.extracted_params.family_size !== undefined
            ? result.extracted_params.family_size
            : prev.family_size,
          location_zone: result.extracted_params.location_zone || prev.location_zone,
          occupation: result.extracted_params.occupation || prev.occupation,
          gender: result.extracted_params.gender || prev.gender,
          social_category: result.extracted_params.social_category || prev.social_category,
          disability_status: Boolean(result.extracted_params.disability_status),
          landholding_acres: result.extracted_params.landholding_acres !== null && result.extracted_params.landholding_acres !== undefined
            ? result.extracted_params.landholding_acres
            : prev.landholding_acres,
        }));
        setIsSyncedFromChat(true);
      }
    } catch (err) {
      console.error('Failed to process message:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to connect to matching engine.';
      setError(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Encountered an error: ${errMsg}. Please retry or refine your parameters.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunStructuredMatch = async () => {
    setIsLoading(true);
    setError(null);
    setIsSyncedFromChat(false);
    try {
      const result = await sendChatMessage({
        demographics,
        userId: user?.user_id,
        language,
      });

      setSchemes(result.schemes || []);
      setServiceCenters(result.service_centers || []);
      setExtractedPayload(demographics);

      if (activeTab === '/citizen/intake' || activeTab === 'intake') {
        setActiveTab('/chat/ai');
      }
    } catch (err) {
      console.error('Failed to run structured match:', err);
      setError(err.response?.data?.message || err.message || 'Failed to connect to matching engine.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setDemographics(INITIAL_DEMOGRAPHICS);
    setIsSyncedFromChat(false);
  };

  const totalPotentialBenefit = schemes.reduce(
    (acc, curr) => acc + (Number(curr.total_benefit_value) || 0),
    0
  );

  // Helper to render Auth Required Guard Card
  const renderAuthGuard = (targetFeature) => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-lg rounded-3xl border border-amber-500/30 bg-slate-900/80 p-8 text-center backdrop-blur-2xl shadow-2xl"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <Lock className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-bold text-white">Authentication Required</h3>
      <p className="mt-2 text-xs text-slate-300 leading-relaxed">
        Access to <code className="text-emerald-400">{targetFeature}</code> requires a verified citizen account.
        Please sign in or create an account with email OTP verification to unlock personalized eligibility calculation.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => setActiveTab('login')}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:brightness-110 active:scale-95"
        >
          <User className="h-4 w-4" />
          <span>Login / Register with OTP</span>
        </button>

        <button
          onClick={() => handleQuickLogin('citizen@example.com', 'Citizen@123')}
          className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
        >
          <span>Use 1-Click Demo Login</span>
          <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
        </button>
      </div>
    </motion.div>
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Global Error Notice */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-950/30 p-4 text-xs text-rose-300">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
          <p>{error}</p>
        </div>
      )}

      {/* Tab: Home Landing View */}
      {activeTab === 'home' && (
        <HomeView
          onNavigate={(target) => setActiveTab(target)}
          onQuickLogin={handleQuickLogin}
          user={user}
        />
      )}

      {/* Tab: Dedicated Open Login View */}
      {activeTab === 'login' && (
        <LoginView
          onAuthSuccess={(authUser) => {
            onAuthSuccess(authUser);
            setActiveTab('/chat/ai');
          }}
          onNavigateToHome={() => setActiveTab('home')}
        />
      )}

      {/* Tab: Citizen Intake View (/citizen/intake) */}
      {(activeTab === '/citizen/intake' || activeTab === 'intake') && (
        user ? (
          <ProfileIntakeView
            demographics={demographics}
            onChangeDemographics={setDemographics}
            onRunMatch={handleRunStructuredMatch}
            user={user}
            onOpenAuth={() => setActiveTab('login')}
          />
        ) : (
          renderAuthGuard('/citizen/intake')
        )
      )}

      {/* Tab: All Schemes Directory (/allschemes) */}
      {(activeTab === '/allschemes' || activeTab === 'schemes') && (
        <SchemeCatalogView
          onSelectSchemeForMatch={(scheme) => {
            setActiveTab('/chat/ai');
          }}
        />
      )}

      {/* Tab: Service Centers Directory (/servicecenters) */}
      {(activeTab === '/servicecenters' || activeTab === 'centers') && (
        <ServiceCentersView defaultZone={demographics.location_zone || 'All Zones'} />
      )}

      {/* Tab: Chat AI Assistant & Relational Dual Panel (/chat/ai) */}
      {(activeTab === '/chat/ai' || activeTab === 'chat_ai') && (
        user ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Panel: Structured Controls */}
            <div className="lg:col-span-4">
              <StructuredFilterPanel
                demographics={demographics}
                onChange={(newVal) => {
                  setDemographics(newVal);
                  setIsSyncedFromChat(false);
                }}
                onApply={handleRunStructuredMatch}
                onReset={handleReset}
                isLoading={isLoading}
                isSyncedFromChat={isSyncedFromChat}
              />
            </div>

            {/* Right Panel: Chat Assistant + Relational Schemes Grid */}
            <div className="space-y-6 lg:col-span-8">
              {/* Multi-turn Chat Interface */}
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                extractedPayload={extractedPayload}
                onSwitchToIntake={() => setActiveTab('/citizen/intake')}
                language={language}
              />

              {/* Results Header Stats */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-5 backdrop-blur-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">
                      Eligible Welfare Schemes ({schemes.length})
                    </h3>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Deterministic relational matches verified from Supabase PostgreSQL
                  </p>
                </div>

                {schemes.length > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-3.5 py-1.5 text-right">
                      <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
                        Total Potential Aid
                      </span>
                      <div className="flex items-center justify-end text-sm font-extrabold text-emerald-400">
                        <IndianRupee className="h-3.5 w-3.5" />
                        <span>{totalPotentialBenefit.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {serviceCenters.length > 0 && (
                      <button
                        onClick={() => setActiveTab('/servicecenters')}
                        className="hidden sm:flex items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-300 hover:border-emerald-500/40 hover:text-white transition"
                      >
                        <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{serviceCenters.length} Centers in {demographics.location_zone || 'Zone'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Schemes Cards Grid or Skeleton Loader */}
              {isLoading ? (
                <SkeletonLoader count={3} />
              ) : schemes.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {schemes.map((scheme, idx) => (
                    <SchemeCard
                      key={scheme.scheme_id}
                      scheme={scheme}
                      serviceCenters={serviceCenters}
                      index={idx}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/20 p-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400 mb-3">
                    <Layers className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">No Matching Schemes Found</h4>
                  <p className="mt-1 max-w-sm text-xs text-slate-400">
                    Try adjusting the demographic sliders on the left or switch to the Citizen Intake form to enter broader criteria.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          renderAuthGuard('/chat/ai')
        )
      )}
    </main>
  );
}
