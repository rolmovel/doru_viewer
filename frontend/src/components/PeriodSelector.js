import React from 'react';

const PERIODS = [
  { value: '24h', label: 'Last 24h' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom' }
];

function PeriodSelector({ value, onChange }) {
  return (
    <div className="period-selector">
      {PERIODS.map(period => (
        <button
          key={period.value}
          className={value === period.value ? 'active' : ''}
          onClick={() => onChange(period.value)}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

export default PeriodSelector;
