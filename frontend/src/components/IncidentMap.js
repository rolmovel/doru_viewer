import React from 'react';

function IncidentMap({ data, onCountryClick, selectedCountry }) {
  if (!data || !data.features) {
    return <div className="map-placeholder">Loading map...</div>;
  }

  // Simplified map visualization using country data
  return (
    <div className="incident-map">
      <h3>Geographic Distribution</h3>
      <div className="country-grid">
        {data.features.map((feature, index) => (
          <div
            key={index}
            className={`country-card ${selectedCountry === feature.properties.country_iso ? 'selected' : ''}`}
            onClick={() => onCountryClick(feature.properties.country_iso)}
          >
            <h4>{feature.properties.country_name}</h4>
            <p>Category: {feature.properties.category}</p>
            <p>Count: {feature.properties.incident_count}</p>
            <p>Records: {feature.properties.total_records}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IncidentMap;
