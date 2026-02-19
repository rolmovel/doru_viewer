const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.example.com';

export async function fetchMapAggregates() {
  const response = await fetch(`${API_BASE_URL}/map-aggregates`);
  if (!response.ok) throw new Error('Failed to fetch aggregates');
  return response.json();
}

export async function fetchReports(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/reports?${queryParams}`);
  if (!response.ok) throw new Error('Failed to fetch reports');
  return response.json();
}

export async function getDocumentUrl(reportId) {
  const response = await fetch(`${API_BASE_URL}/documents/${reportId}`);
  if (!response.ok) throw new Error('Failed to get document URL');
  return response.json();
}
