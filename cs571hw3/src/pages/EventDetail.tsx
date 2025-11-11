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

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMusicEvent, setIsMusicEvent] = useState(false);

  // --- Restore scroll on mount ---
  useEffect(() => {
    const savedScroll = sessionStorage.getItem("searchScrollY");
    if (savedScroll) window.scrollTo(0, parseInt(savedScroll));
  }, []);

  useEffect(() => {
    if (id) {
      loadEventDetails(id);
    }
  }, [id]);

  const loadEventDetails = async (eventId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/events/${eventId}`);

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
    sessionStorage.setItem("searchScrollY", window.scrollY.toString());

    if (location.state?.from === "favorites") {
      navigate("/", { replace: true });
      return;
    }

    if (location.state?.from === "search" && location.state?.searchData) {
      navigate("/", {
        state: {
          restored: true,
          searchData: location.state.searchData,
          events: location.state.events,
        },
      });
    } else {
      navigate(-1);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Event not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="font-medium">Back to Search</span>
      </button>

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8">
        {/* Event Title */}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black mb-4 md:mb-0">
          {event.name}
        </h1>

        {/* Top Right Buttons */}
        <div className="flex items-center gap-3">
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
          <Button
            variant="outline"
            className="border border-black text-black hover:bg-gray-100 w-[42px] h-[42px] flex items-center justify-center rounded-md"
          >
            <FavoriteButton eventId={event.id} />
          </Button>
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
            className="data-[state=active]:bg-white data-[state=active]:text-black font-semibold text-sm"
          >
            Artist
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
