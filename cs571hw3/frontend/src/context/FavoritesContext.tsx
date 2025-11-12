import * as React from 'react';
import { toast } from 'sonner';
import { Event } from '@/types/event';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface FavoriteEventPayload {
  eventId: string;
  name: string;
  venue?: string;
  date?: string;
  image?: string;
  category?: string;
  ticketmasterUrl?: string;
}

interface AddFavoriteOptions {
  insertAtIndex?: number;
  eventData?: Event;
  toastMessage?: string;
}

interface FavoritesContextValue {
  favorites: Event[];
  isLoading: boolean;
  addFavorite: (event: FavoriteEventPayload, options?: AddFavoriteOptions) => Promise<void>;
  removeFavorite: (eventId: string, options?: { silent?: boolean }) => Promise<void>;
  isFavorite: (eventId: string | undefined) => boolean;
  refetch: () => Promise<void>;
}

const FavoritesContext = React.createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = React.useState<Event[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const undoCache = React.useRef<Map<string, { event: Event; index: number }>>(new Map());

  const getEventDetails = React.useCallback(async (eventId: string): Promise<Event | null> => {
    try {
      const response = await fetch(`${API_URL}/api/event_details/${eventId}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      return null;
    }
  }, []);

  const fetchFavorites = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/favorites`);
      const data = await response.json();
      setFavorites(data.favorites ?? []);
    } catch (error) {
      toast.error('Unable to load favorites.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = React.useCallback(
    async (event: FavoriteEventPayload, options?: AddFavoriteOptions) => {
  const { insertAtIndex, eventData, toastMessage } = options ?? {};
      try {
        await fetch(`${API_URL}/api/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: event.eventId,
            eventName: event.name,
            ...event,
          }),
        });

        let eventDetails = eventData;

        if (!eventDetails) {
          eventDetails = await getEventDetails(event.eventId);
        }

        if (!eventDetails) {
          // Fallback to a full refresh if we cannot retrieve details
          await fetchFavorites();
        } else {
          setFavorites((prev: Event[]) => {
            if (prev.some((fav: Event) => fav.id === eventDetails.id)) {
              return prev;
            }

            const updated = [...prev];

            if (
              typeof insertAtIndex === 'number' &&
              insertAtIndex >= 0 &&
              insertAtIndex <= updated.length
            ) {
              updated.splice(insertAtIndex, 0, eventDetails);
              return updated;
            }

            updated.push(eventDetails);
            return updated;
          });
        }

        const message = toastMessage ?? `${event.name} added to favorites!`;

        toast.success(message, {
          description: 'You can view it in the Favorites page.',
          closeButton: false,
          style: {
            background: '#fff',
            color: '#000',
            border: '1px solid #e5e7eb',
          },
        });
      } catch (error) {
        toast.error('Unable to add favorite right now.');
      }
    },
    [fetchFavorites, getEventDetails]
  );

  const removeFavorite = React.useCallback(
    async (eventId: string, options?: { silent?: boolean }) => {
      const currentIndex = favorites.findIndex((favorite: Event) => favorite.id === eventId);
      const current = favorites[currentIndex];
      try {
        await fetch(`${API_URL}/api/favorites/${eventId}`, {
          method: 'DELETE',
        });
        setFavorites((prev: Event[]) =>
          prev.filter((favorite: Event) => favorite.id !== eventId)
        );
        if (!options?.silent && current && currentIndex !== -1) {
          undoCache.current.set(eventId, { event: current, index: currentIndex });
          toast.info(`${current.name} removed from favorites!`, {
            closeButton: false,
            style: {
              background: '#fff',
              color: '#000',
              border: '1px solid #e5e7eb',
            },
            action: {
              label: 'Undo',
              onClick: async () => {
                const cached = undoCache.current.get(eventId);
                if (!cached) return;
                try {
                  await addFavorite(
                    { eventId, name: cached.event.name },
                    {
                      insertAtIndex: cached.index,
                      eventData: cached.event,
                      toastMessage: `${cached.event.name} re-added to favorites!`,
                    }
                  );
                  undoCache.current.delete(eventId);
                } catch (error) {
                  // Error already handled by addFavorite
                }
              },
            },
          });
        }
      } catch (error) {
        toast.error('Unable to remove favorite right now.');
      }
    },
    [favorites, addFavorite]
  );

  const value = React.useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      isLoading,
      addFavorite,
      removeFavorite,
      isFavorite: (eventId: string | undefined) =>
        Boolean(eventId && favorites.some((fav: Event) => fav.id === eventId)),
      refetch: fetchFavorites,
    }),
    [favorites, isLoading, addFavorite, removeFavorite, fetchFavorites]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = React.useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}
