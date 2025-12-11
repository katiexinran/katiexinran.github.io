import { useNavigate } from "react-router-dom";
import { EventsGrid } from "@/components/search/EventsGrid";
import { useFavorites } from "@/context/FavoritesContext";

const Favorites = () => {
  const navigate = useNavigate();
  const { favorites, isLoading } = useFavorites();

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`, {
      state: { from: "favorites" }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Favorites</h1>
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Favorites</h1>
      
      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl font-semibold text-red-500">No favorite events to show</p>
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
