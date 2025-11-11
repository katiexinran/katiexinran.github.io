import React, { useState } from 'react';
import { Search, X, Loader2, MapPin } from 'react-feather';

function SearchForm({ onSearch }) {
  const [formData, setFormData] = useState({
    keyword: '',
    category: 'All',
    distance: 10,
    location: '',
    autoDetect: false
  });
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [backendUrl] = useState('http://localhost:8080'); // Your backend

  const categories = [
    { value: 'All', label: 'All Events' },
    { value: 'Music', label: 'Music' },
    { value: 'Sports', label: 'Sports' },
    { value: 'Arts & Theatre', label: 'Arts & Theatre' },
    { value: 'Film', label: 'Film' },
    { value: 'Miscellaneous', label: 'Miscellaneous' }
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.keyword.trim()) newErrors.keyword = 'Keyword required';
    if (formData.distance < 1 || formData.distance > 100) newErrors.distance = 'Distance 1-100 miles';
    if (!formData.autoDetect && !formData.location.trim()) newErrors.location = 'Location required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleKeywordChange = async (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, keyword: value }));
    
    if (value.length >= 2) {
      setLoading(true);
      try {
        const response = await fetch(`${backendUrl}/api/search/autocomplete?keyword=${encodeURIComponent(value)}`);
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const clearKeyword = () => {
    setFormData(prev => ({ ...prev, keyword: '' }));
    setSuggestions([]);
  };

  const selectSuggestion = (suggestion) => {
    setFormData(prev => ({ ...prev, keyword: suggestion }));
    setSuggestions([]);
  };

  const handleAutoDetect = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/location/auto-detect`);
      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        location: data.fullAddress,
        autoDetect: true,
        latitude: data.latitude,
        longitude: data.longitude
      }));
    } catch {
      alert('Auto-detect failed - using Los Angeles');
      setFormData(prev => ({ ...prev, autoDetect: false }));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const searchData = {
      ...formData,
      latitude: formData.autoDetect ? 34.0522 : 34.0522, // Add real lat/lng from geocoding later
      longitude: formData.autoDetect ? -118.2437 : -118.2437
    };
    onSearch(searchData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg space-y-6">
      {/* Keyword with Autocomplete */}
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Event Keyword *</label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={formData.keyword}
            onChange={handleKeywordChange}
            placeholder="Search concerts, sports, theater..."
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          {formData.keyword && (
            <button type="button" onClick={clearKeyword} className="absolute right-10 top-3 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          )}
          {loading && <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-blue-600" />}
        </div>
        {errors.keyword && <p className="mt-1 text-sm text-red-600">{errors.keyword}</p>}
        
        {suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {suggestions.slice(0, 5).map((suggestion, i) => (
              <div key={i} onClick={() => selectSuggestion(suggestion)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b">
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">Location *</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="Los Angeles, CA"
            disabled={formData.autoDetect}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg disabled:bg-gray-100"
          />
          <button
            type="button"
            onClick={handleAutoDetect}
            disabled={formData.autoDetect}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {formData.autoDetect ? 'Detected' : 'Auto'}
          </button>
        </div>
        {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
      </div>

      {/* Distance */}
      <div className="flex">
        <label className="block text-sm font-semibold text-gray-700 mb-2 w-full">Distance (miles) *</label>
        <div className="flex">
          <input
            type="number"
            value={formData.distance}
            onChange={(e) => setFormData(prev => ({ ...prev, distance: parseInt(e.target.value) || 10 }))}
            min="1"
            max="100"
            className="w-full py-3 px-4 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500"
          />
          <div className="bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg px-4 py-3">miles</div>
        </div>
        {errors.distance && <p className="mt-1 text-sm text-red-600">{errors.distance}</p>}
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700"
      >
        Search Events
      </button>
    </form>
  );
}

export default SearchForm;
