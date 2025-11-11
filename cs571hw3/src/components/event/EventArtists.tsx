import { useState, useEffect } from "react";
import { Event } from "@/types/event";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface EventArtistsProps {
  event: Event;
}

interface SpotifyArtist {
  name: string;
  followers: { total: number };
  popularity: number;
  genres: string[];
  images: Array<{ url: string }>;
  external_urls: { spotify: string };
}

interface SpotifyAlbum {
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
    if (!artistName) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/spotify/artist?name=${encodeURIComponent(artistName)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setArtistData(data.artist);
        setAlbums(data.albums || []);
      }
    } catch (error) {
      console.error("Failed to load artist data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    );
  }

  if (!artistData) {
    return <p className="text-center text-muted-foreground">Artist information not available</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {artistData.images[0] && (
          <img
            src={artistData.images[0].url}
            alt={artistData.name}
            className="w-full md:w-64 h-64 object-cover rounded-lg"
          />
        )}
        
        <div className="flex-1 space-y-4">
          <h2 className="text-3xl font-bold">{artistData.name}</h2>
          
          <div className="flex gap-8">
            <div>
              <p className="text-sm text-muted-foreground">Followers</p>
              <p className="text-xl font-semibold">
                {artistData.followers.total.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Popularity</p>
              <p className="text-xl font-semibold">{artistData.popularity}%</p>
            </div>
          </div>

          {artistData.genres.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Genres</p>
              <p>{artistData.genres.join(", ")}</p>
            </div>
          )}

          <Button asChild>
            <a href={artistData.external_urls.spotify} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in Spotify
            </a>
          </Button>
        </div>
      </div>

      {albums.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold mb-4">Albums</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {albums.map((album) => (
              <a
                key={album.name}
                href={album.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    {album.images[0] && (
                      <img
                        src={album.images[0].url}
                        alt={album.name}
                        className="w-full aspect-square object-cover rounded mb-2"
                      />
                    )}
                    <h4 className="font-semibold text-sm line-clamp-2 mb-1">{album.name}</h4>
                    <p className="text-xs text-muted-foreground">{album.release_date}</p>
                    <p className="text-xs text-muted-foreground">{album.total_tracks} tracks</p>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
