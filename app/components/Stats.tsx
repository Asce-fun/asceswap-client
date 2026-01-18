
import React from 'react';

export const Stats: React.FC = () => {
  const stats = [
    { label: 'Total Notional Volume', value: '$2.4B+' },
    { label: 'Open Interest', value: '$450M' },
    { label: 'Total Users', value: '12,500' },
    { label: 'Supported Assets', value: '15+' },
  ];

  return (
    <section className="border-y border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i}>
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">{stat.label}</div>
            <div className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">{stat.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
};
