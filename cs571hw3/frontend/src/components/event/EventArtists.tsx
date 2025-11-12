import { useState, useEffect } from "react";
import { Event } from "@/types/event";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { formatNumberWithCommas } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface EventArtistsProps {
  event: Event;
}

interface SpotifyArtist {
  name: string;
  followers: { total: number };
  popularity: number;
  genres?: string[];
  images: Array<{ url: string }>;
  external_urls: { spotify: string };
  id: string;
}

interface SpotifyAlbum {
  id: string;
  name: string;
  release_date: string;
  total_tracks: number;
  images: Array<{ url: string }>;
  external_urls: { spotify: string };
}

export const EventArtists = ({ event }: EventArtistsProps) => {
  const [artistData, setArtistData] = useState<SpotifyArtist | null>(null);
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadArtistData();
  }, [event]);

  const loadArtistData = async () => {
    const artistName = event._embedded?.attractions?.[0]?.name;
    if (!artistName) {
      setIsLoading(false);
      return;
    }

    try {
      // Get artist details
      const artistResponse = await fetch(
        `${API_URL}/api/artist_details?name=${encodeURIComponent(artistName)}`
      );
      
      if (artistResponse.ok) {
        const artistData = await artistResponse.json();
        
        if (artistData.artist) {
          setArtistData(artistData.artist);
          
          // Get albums
          const albumsResponse = await fetch(
            `${API_URL}/api/artist_albums?id=${artistData.artist.id}`
          );
          
          if (albumsResponse.ok) {
            const albumsData = await albumsResponse.json();
            setAlbums(albumsData.albums || []);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load artist data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading artist details...</p>
        </div>
      </div>
    );
  }

  if (!artistData) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-muted-foreground">No artist information available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 [@media(min-width:430px)]:flex-row [@media(min-width:430px)]:items-start lg:gap-8">
          {artistData.images?.[0]?.url ? (
            <img
              src={artistData.images[0].url}
              alt={artistData.name}
              className="h-40 w-40 flex-shrink-0 object-cover"
            />
          ) : null}
          <div className="flex-1 min-w-0 space-y-2">
            <h2 className="text-xl font-semibold sm:text-2xl">{artistData.name}</h2>
            <div className="space-y-1 text-sm text-muted-foreground sm:text-base">
              <div className="flex items-center gap-x-6">
                {artistData.followers?.total ? (
                  <p><span className="font-semibold">Followers:</span> {formatNumberWithCommas(artistData.followers.total)}</p>
                ) : null}
                {typeof artistData.popularity === 'number' ? (
                  <p><span className="font-semibold">Popularity:</span> {artistData.popularity}%</p>
                ) : null}
              </div>
              {artistData.genres?.length ? (
                <p><span className="font-semibold">Genres:</span> {artistData.genres.join(', ')}</p>
              ) : null}
            </div>
            {artistData.external_urls?.spotify ? (
              <Button asChild className="bg-black text-white hover:bg-black/90">
                <a
                  href={artistData.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <span>Open in Spotify</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ) : null}
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Albums</h3>
          {albums.length ? (
            <div className="grid gap-4 grid-cols-1 [@media(min-width:430px)]:grid-cols-2 lg:grid-cols-3">
              {albums.map((album) => (
                <a
                  key={album.id}
                  href={album.external_urls?.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col overflow-hidden rounded-lg border border-border bg-white"
                >
                  {album.images?.[0]?.url ? (
                    <img
                      src={album.images[0].url}
                      alt={album.name}
                      className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : null}
                  <div className="p-3">
                    <p className="text-sm font-semibold">{album.name}</p>
                    {album.release_date ? (
                      <p className="text-xs text-muted-foreground">Released: {album.release_date}</p>
                    ) : null}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No albums found.</p>
          )}
        </div>
      </div>
    </div>
  );
};
