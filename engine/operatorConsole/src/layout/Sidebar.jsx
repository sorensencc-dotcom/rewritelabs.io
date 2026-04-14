import React from 'react';

export default function Sidebar({ active, onChange }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'analytics', label: 'Analytics' }
  ];

  return (
    <section className='column sidebar'>
      <nav className='nav'>
        {items.map(item => (
          <div
            key={item.id}
            className={'nav-item' + (active === item.id ? ' active' : '')}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </div>
        ))}
      </nav>
    </section>
  );
}
