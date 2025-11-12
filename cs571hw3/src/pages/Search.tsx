import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SearchForm } from "@/components/search/SearchForm";
import { EventsGrid } from "@/components/search/EventsGrid";
import { Event } from "@/types/event";
import { toast } from "sonner";
import { Search as SearchIcon } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface SearchFormData {
  keyword: string;
  category: string;
  distance: number;
  location: string;
  autoDetect: boolean;
}

const Search = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchFormData, setSearchFormData] = useState<SearchFormData | null>(null);

  // Restore state when coming back from event detail
  useEffect(() => {
    if (location.state?.restored && location.state?.searchData && location.state?.events) {
      setSearchFormData(location.state.searchData);
      setEvents(location.state.events);
      setHasSearched(true);
      
      // Restore scroll position
      setTimeout(() => {
        const savedScroll = sessionStorage.getItem("searchScrollY");
        if (savedScroll) {
          window.scrollTo(0, parseInt(savedScroll));
          sessionStorage.removeItem("searchScrollY");
        }
      }, 100);
    }
  }, [location.state]);

  const handleSearch = useCallback(async (formData: {
    keyword: string;
    category: string;
    distance: number;
    lat: number;
    lng: number;
    location: string;
    autoDetect: boolean;
  }) => {
    setIsLoading(true);
    setHasSearched(true);
    
    // Save form data for restoration
    setSearchFormData({
      keyword: formData.keyword,
      category: formData.category,
      distance: formData.distance,
      location: formData.location,
      autoDetect: formData.autoDetect,
    });
    
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
      const response = await fetch(`${API_URL}/api/search?${params}`);
      
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
    // Save scroll position before navigating
    sessionStorage.setItem("searchScrollY", window.scrollY.toString());
    
    // Navigate with state for restoration
    navigate(`/event/${eventId}`, {
      state: {
        from: "search",
        searchData: searchFormData,
        events: events,
      },
    });
  };

  return (
    <div className="space-y-8">
      <SearchForm 
        onSearch={handleSearch} 
        isLoading={isLoading}
        initialValues={searchFormData || undefined}
      />
      
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Searching for events...</p>
        </div>
      )}

      {!isLoading && hasSearched && (
        <EventsGrid events={events} onEventClick={handleEventClick} />
      )}

      {!hasSearched && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <SearchIcon className="w-16 h-16 text-gray-300 mb-4" strokeWidth={1.5} />
          <p className="text-lg text-gray-600">
            Enter search criteria and click the Search button to find events.
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;
