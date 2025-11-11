import React from 'react';
import { Link } from 'react-router-dom';

function EventCard({ event }) {
  const formatDate = (date) => {
    if (!date) return 'Date TBD';
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  return (
    <Link to={`/event/${event.id}`} className="block bg-white rounded-xl shadow-md hover:shadow-lg overflow-hidden">
      <div className="h-48 bg-blue-500 flex items-center justify-center">
        <span className="text-4xl text-white opacity-80">{event.category === 'Music' ? '🎵' : event.category === 'Sports' ? '⚽' : '🎭'}</span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{event.name}</h3>
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <span className="mr-2">📅</span>
          {formatDate(event.date)}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <span className="mr-2">📍</span>
          <span className="font-medium">{event.venueName}</span>
        </div>
        <div className="mt-3 inline-flex px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          {event.status || 'On Sale'}
        </div>
      </div>
    </Link>
  );
}

export default EventCard;
