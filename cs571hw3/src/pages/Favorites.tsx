import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EventsGrid } from "@/components/search/EventsGrid";
import { Event } from "@/types/event";

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      // For now, load from localStorage
      // Later, this will fetch from MongoDB via backend
      const stored = localStorage.getItem("favorites");
      if (stored) {
        const favoriteIds = JSON.parse(stored);
        
        // Fetch full event details for each favorite
        const response = await fetch(`http://localhost:3001/api/favorites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: favoriteIds }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setFavorites(data.events || []);
        }
      }
    } catch (error) {
      console.error("Failed to load favorites:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Favorites</h1>
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Favorites</h1>
      
      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl font-semibold mb-2">No favorite events yet.</p>
          <p className="text-muted-foreground">
            Add events to your favorites by clicking the heart icon on any event.
          </p>
        </div>
      ) : (
        <EventsGrid 
          events={favorites} 
          onEventClick={handleEventClick}
          showRemoveButton
        />
      )}
    </div>
  );
};

export default Favorites;
