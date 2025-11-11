import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SearchForm } from "@/components/search/SearchForm";
import { EventsGrid } from "@/components/search/EventsGrid";
import { Event } from "@/types/event";
import { toast } from "sonner";

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (formData: {
    keyword: string;
    category: string;
    distance: number;
    lat: number;
    lng: number;
  }) => {
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const { keyword, category, distance, lat, lng } = formData;
      
      // Build query params for Ticketmaster API
      const params = new URLSearchParams({
        keyword,
        radius: distance.toString(),
        unit: "miles",
        latlong: `${lat},${lng}`,
      });

      if (category !== "All") {
        const segmentIds: Record<string, string> = {
          Music: "KZFzniwnSyZfZ7v7nJ",
          Sports: "KZFzniwnSyZfZ7v7nE",
          "Arts & Theatre": "KZFzniwnSyZfZ7v7na",
          Film: "KZFzniwnSyZfZ7v7nn",
          Miscellaneous: "KZFzniwnSyZfZ7v7n1",
        };
        if (segmentIds[category]) {
          params.append("segmentId", segmentIds[category]);
        }
      }

      // Call backend API
      const response = await fetch(`http://localhost:3001/api/events/search?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      
      if (data._embedded?.events) {
        // Sort by date/time ascending
        const sortedEvents = data._embedded.events.sort((a: any, b: any) => {
          const dateA = new Date(`${a.dates?.start?.localDate || ""} ${a.dates?.start?.localTime || "00:00"}`);
          const dateB = new Date(`${b.dates?.start?.localDate || ""} ${b.dates?.start?.localTime || "00:00"}`);
          return dateA.getTime() - dateB.getTime();
        });
        
        setEvents(sortedEvents.slice(0, 20)); // Max 20 results
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to fetch events. Please try again.");
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SearchForm onSearch={handleSearch} isLoading={isLoading} />
      
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading events...</p>
        </div>
      )}

      {!isLoading && hasSearched && (
        <EventsGrid events={events} onEventClick={handleEventClick} />
      )}

      {!hasSearched && !isLoading && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            Enter search criteria and click the Search button to find events.
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;
