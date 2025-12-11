import * as React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/context/FavoritesContext';

interface FavoriteButtonProps {
  eventId: string;
  eventName?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const FavoriteButton = ({ eventId, eventName = "", size = 'md', className }: FavoriteButtonProps) => {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const favorited = isFavorite(eventId);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (favorited) {
        await removeFavorite(eventId);
      } else {
        await addFavorite({ eventId, name: eventName });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size={size === 'sm' ? 'sm' : 'icon'}
      className={className}
      aria-pressed={favorited}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      onClick={handleClick}
      disabled={isProcessing}
    >
      <Heart className={`h-5 w-5 ${favorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
    </Button>
  );
};
