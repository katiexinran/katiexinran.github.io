import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface FavoriteButtonProps {
  eventId: string;
  eventName?: string;
}

// Create a global favorites state that can be shared across components
let globalFavorites = new Set<string>();
const favoriteCallbacks = new Set<() => void>();

export const FavoriteButton = ({ eventId, eventName = "" }: FavoriteButtonProps) => {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // Load favorites on mount
    loadFavorites();
    
    // Register callback for updates from other components
    const updateFavorite = () => {
      setIsFavorite(globalFavorites.has(eventId));
    };
    favoriteCallbacks.add(updateFavorite);
    
    return () => {
      favoriteCallbacks.delete(updateFavorite);
    };
  }, [eventId]);

  const loadFavorites = async () => {
    try {
      const response = await fetch(`${API_URL}/api/favorites`);
      if (response.ok) {
        const data = await response.json();
        globalFavorites = new Set(data.favorites.map((f: any) => f.id));
        setIsFavorite(globalFavorites.has(eventId));
      }
    } catch (error) {
      console.error("Failed to load favorites:", error);
    }
  };

  const notifyAll = () => {
    favoriteCallbacks.forEach(cb => cb());
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wasFavorite = isFavorite;
    
    try {
      if (isFavorite) {
        // Remove from favorites
        const response = await fetch(`${API_URL}/api/favorites/${eventId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          globalFavorites.delete(eventId);
          notifyAll();
          
          toast.info(`${eventName || "Event"} removed from favorites!`, {
            description: "You can view it in the Favorites page.",
            action: {
              label: "Undo",
              onClick: async () => {
                // Re-add the event
                const addResponse = await fetch(`${API_URL}/api/favorites`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ eventId, eventName }),
                });
                
                if (addResponse.ok) {
                  globalFavorites.add(eventId);
                  notifyAll();
                  toast.success(`${eventName || "Event"} re-added to favorites!`, {
                    description: "You can view it in the Favorites page.",
                  });
                }
              },
            },
          });
        }
      } else {
        // Add to favorites
        const response = await fetch(`${API_URL}/api/favorites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, eventName }),
        });

        if (response.ok) {
          globalFavorites.add(eventId);
          notifyAll();
          
          toast.success(`${eventName || "Event"} added to favorites!`, {
            description: "You can view it in the Favorites page.",
          });
        }
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error("Failed to update favorites. Please try again.");
      // Revert state on error
      if (wasFavorite) {
        globalFavorites.add(eventId);
      } else {
        globalFavorites.delete(eventId);
      }
      notifyAll();
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart 
        className={`h-5 w-5 transition-colors ${
          isFavorite 
            ? "fill-red-500 stroke-red-500" 
            : "stroke-gray-600 hover:stroke-red-500"
        }`}
      />
    </button>
  );
};
