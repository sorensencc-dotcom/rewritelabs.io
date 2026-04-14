import React, { useState } from 'react';
import Sidebar from './layout/Sidebar';
import Dashboard from './pages/Dashboard';
import AnalyticsPanel from './components/AnalyticsPanel';

export default function App() {
  const [active, setActive] = useState('dashboard');

  let content = null;
  switch (active) {
    case 'analytics':
      content = <AnalyticsPanel />;
      break;
    case 'dashboard':
    default:
      content = <Dashboard />;
      break;
  }

  return (
    <div className='app-root'>
      <header className='topbar'>
        <div className='topbar-title'>Rewrite Labs Operator Console</div>
        <div className='topbar-meta'>
          <span id='env-label'>ENV: local</span>
          <span id='clock'>{new Date().toLocaleTimeString()}</span>
        </div>
      </header>
      <main className='layout'>
        <Sidebar active={active} onChange={setActive} />
        <section className='column column-main'>
          {content}
        </section>
      </main>
    </div>
  );
}
