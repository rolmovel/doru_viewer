import React, { useState, useEffect } from 'react';
import './App.css';
import PeriodSelector from './components/PeriodSelector';
import IncidentMap from './components/IncidentMap';
import IncidentTable from './components/IncidentTable';
import { fetchMapAggregates, fetchReports } from './utils/api';

function App() {
  const [period, setPeriod] = useState('24h');
  const [aggregates, setAggregates] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);

  useEffect(() => {
    loadData();
  }, [period, selectedCountry]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [aggData, reportsData] = await Promise.all([
        fetchMapAggregates(),
        fetchReports({ period, country: selectedCountry })
      ]);
      setAggregates(aggData);
      setReports(reportsData.reports || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCountryClick = (country) => {
    setSelectedCountry(country === selectedCountry ? null : country);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>DORU - Security Incident Analytics</h1>
        <PeriodSelector value={period} onChange={setPeriod} />
      </header>
      
      <main className="App-main">
        <div className="map-section">
          <IncidentMap 
            data={aggregates} 
            onCountryClick={handleCountryClick}
            selectedCountry={selectedCountry}
          />
        </div>
        
        <div className="table-section">
          <h2>Incident Reports {selectedCountry && `- ${selectedCountry}`}</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <IncidentTable reports={reports} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
