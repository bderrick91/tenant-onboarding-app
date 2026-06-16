import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase, getCurrentUser, signOut } from './utils/supabaseClient';
import { initEmailJS } from './utils/emailService';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import OnboardingPage from './components/OnboardingPage';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedOnboarding, setSelectedOnboarding] = useState(null);

  // Initialize EmailJS on app load
  useEffect(() => {
    initEmailJS();
  }, []);

  // Check if user is logged in
  useEffect(() => {
    const checkUser = async () => {
      const user = await getCurrentUser();
      setUser(user);
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user || null;
      setUser(user);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setCurrentPage('dashboard');
    setSelectedOnboarding(null);
  };

  const handleSelectOnboarding = (onboarding) => {
    setSelectedOnboarding(onboarding);
    setCurrentPage('onboarding');
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
    setSelectedOnboarding(null);
  };

  if (loading) {
    return (
      <div className="app loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={setUser} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Tenant Onboarding</h1>
        </div>
        <div className="header-right">
          <span className="user-info">{user.email}</span>
          <button onClick={handleLogout} className="btn btn-secondary">
            Sign Out
          </button>
        </div>
      </header>

      <main className="app-main">
        {currentPage === 'dashboard' && (
          <DashboardPage onSelectOnboarding={handleSelectOnboarding} user={user} />
        )}
        {currentPage === 'onboarding' && selectedOnboarding && (
          <OnboardingPage onboarding={selectedOnboarding} onBack={handleBackToDashboard} user={user} />
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Hornbeam Park. Tenant Onboarding System.</p>
      </footer>
    </div>
  );
}

export default App;
