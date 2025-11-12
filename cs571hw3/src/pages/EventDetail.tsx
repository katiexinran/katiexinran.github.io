import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventInfo } from "@/components/event/EventInfo";
import { EventArtists } from "@/components/event/EventArtists";
import { EventVenue } from "@/components/event/EventVenue";
import { FavoriteButton } from "@/components/event/FavoriteButton";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMusicEvent, setIsMusicEvent] = useState(false);

  useEffect(() => {
    if (id) {
      loadEventDetails(id);
    }
  }, [id]);

  const loadEventDetails = async (eventId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/event_details/${eventId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch event details");
      }

      const data = await response.json();
      setEvent(data);

      const segment = data.classifications?.[0]?.segment?.name?.toLowerCase();
      setIsMusicEvent(segment === "music");
    } catch (error) {
      console.error("Failed to load event:", error);
      toast.error("Failed to load event details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    // If we came from search with state, restore it
    if (location.state?.from === "search" && location.state?.searchData) {
      navigate("/", {
        state: {
          restored: true,
          searchData: location.state.searchData,
          events: location.state.events,
        },
      });
    } else {
      // Otherwise just go back to search
      navigate("/");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-8">
        <p className="text-center text-muted-foreground">Event not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="font-medium">Back to Search</span>
      </button>

      {/* --- HEADER --- */}
      <div className="flex items-start justify-between gap-4 mb-8">
        {/* Event Title */}
        <h1 className="flex-1 min-w-0 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-black leading-tight">
          {event.name}
        </h1>

        {/* Top Right Buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Buy Tickets Button */}
          {event.url && (
            <Button
              onClick={() => window.open(event.url, "_blank")}
              className="bg-black hover:bg-gray-900 text-white text-[15px] font-semibold px-5 py-2 rounded-md flex items-center gap-2"
            >
              Buy Tickets
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
          
          {/* Favorite Button (square outline) */}
          <div className="flex items-center justify-center w-[42px] h-[42px] border border-black rounded-md hover:bg-gray-50 transition-colors">
            <FavoriteButton eventId={event.id} eventName={event.name} />
          </div>
        </div>
      </div>

      {/* --- TABS --- */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-md mb-6">
          <TabsTrigger
            value="info"
            className="data-[state=active]:bg-white data-[state=active]:text-black font-semibold text-sm"
          >
            Info
          </TabsTrigger>
          <TabsTrigger
            value="artists"
            disabled={!isMusicEvent}
            className="data-[state=active]:bg-white data-[state=active]:text-black font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Artist/Team
          </TabsTrigger>
          <TabsTrigger
            value="venue"
            className="data-[state=active]:bg-white data-[state=active]:text-black font-semibold text-sm"
          >
            Venue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <EventInfo event={event} />
        </TabsContent>

        <TabsContent value="artists">
          {isMusicEvent && <EventArtists event={event} />}
        </TabsContent>

        <TabsContent value="venue">
          <EventVenue event={event} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventDetail;
