import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  eventId: string;
}

export const FavoriteButton = ({ eventId }: FavoriteButtonProps) => {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    checkFavorite();
  }, [eventId]);

  const checkFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    setIsFavorite(favorites.includes(eventId));
  };

  const toggleFavorite = async () => {
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    
    if (isFavorite) {
      const newFavorites = favorites.filter((id: string) => id !== eventId);
      localStorage.setItem("favorites", JSON.stringify(newFavorites));
      setIsFavorite(false);
      
      toast("Event removed from favorites!", {
        action: {
          label: "Undo",
          onClick: () => {
            const currentFavorites = JSON.parse(localStorage.getItem("favorites") || "[]");
            currentFavorites.push(eventId);
            localStorage.setItem("favorites", JSON.stringify(currentFavorites));
            setIsFavorite(true);
            toast("Event re-added to favorites!");
          },
        },
      });
    } else {
      favorites.push(eventId);
      localStorage.setItem("favorites", JSON.stringify(favorites));
      setIsFavorite(true);
      toast("Event added to favorites!", {
        description: "You can view it in the Favorites page.",
      });
    }

    // In production, also sync with backend/MongoDB
    try {
      await fetch("http://localhost:3001/api/favorites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, action: isFavorite ? "remove" : "add" }),
      });
    } catch (error) {
      console.error("Failed to sync favorite:", error);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite();
      }}
      className={cn(
        "rounded-full bg-white/80 hover:bg-white",
        isFavorite && "text-red-500"
      )}
    >
      <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
    </Button>
  );
};
