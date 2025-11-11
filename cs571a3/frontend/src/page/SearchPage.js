import React, { useState } from 'react';
import SearchForm from '../components/SearchForm';
import EventCard from '../components/EventCard';

function SearchPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const backendUrl = 'http://localhost:8080';

  const handleSearch = async (data) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        keyword: data.keyword,
        category: data.category,
        distance: data.distance,
        latitude: data.latitude || 34.0522,
        longitude: data.longitude || -118.2437
      });
      
      const response = await fetch(`${backendUrl}/api/search?${params}`);
      if (!response.ok) throw new Error('Search failed');
      
      const result = await response.json();
      setEvents(result.events || []);
    } catch (err) {
      setError('Search failed - check backend connection');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Mock data if backend fails
  const mockEvents = [
    { id: '1', name: 'Sample Concert', category: 'Music', date: '2025-11-15', venueName: 'Venue A', status: 'onsale' },
    { id: '2', name: 'Sample Game', category: 'Sports', date: '2025-11-16', venueName: 'Stadium B', status: 'onsale' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">Find Events Near You</h1>
      
      <SearchForm onSearch={handleSearch} />
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-center">
          <p className="text-red-700">{error}</p>
          <p className="text-sm text-red-600 mt-1">Showing sample data - backend not connected</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {events.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow border">
          <h3 className="text-xl font-medium mb-2">No Events Found</h3>
          <p className="text-gray-500 mb-4">Try different search terms</p>
          <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-4 py-2 rounded">
            Search Again
          </button>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
