import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Upload from './components/Upload';
import { Page } from './types';
import { auth, signInWithGoogle } from './services/firebase.ts';
import firebase from 'firebase/app';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.UPLOAD);
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const renderContent = () => {
    switch (currentPage) {
      case Page.DASHBOARD:
        return <Dashboard />;
      case Page.UPLOAD:
        return <Upload />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-textMuted">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Coming Soon</h2>
              <p>This module is under development.</p>
            </div>
          </div>
        );
    }
  };

  if (loading) return <div className="h-screen bg-background flex items-center justify-center text-primary">Loading...</div>;

  if (!user) {
    return (
      <div className="h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface border border-border p-8 rounded-2xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3V21H21" stroke="#Eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 9L14 14L10 10L7 13" stroke="#Eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-textMain mb-2">TradeLedger AI</h1>
          <p className="text-textMuted mb-8">Sign in to sync your contract notes across devices securely.</p>
          <button 
            onClick={signInWithGoogle}
            className="w-full bg-white text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" />
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background text-textMain font-sans overflow-hidden">
      <Sidebar activePage={currentPage} setPage={setCurrentPage} />
      <main className="flex-1 min-w-0 bg-background relative">
        <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 rounded-b-[100px] blur-3xl pointer-events-none opacity-20"></div>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;