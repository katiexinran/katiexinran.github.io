import { Event } from "@/types/event";
import { Badge } from "@/components/ui/badge";
import { Facebook, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface EventInfoProps {
  event: Event;
}

export const EventInfo = ({ event }: EventInfoProps) => {
  const formatDateTime = () => {
    if (!event.dates?.start?.localDate) return "Date TBA";
    const date = new Date(event.dates.start.localDate);
    const time = event.dates.start.localTime;
    return time ? `${format(date, "MMM d, hh:mm a")}` : format(date, "MMM d");
  };

  const getStatusColor = (code?: string) => {
    const statusMap: Record<string, string> = {
      onsale: "bg-status-on-sale",
      offsale: "bg-status-off-sale",
      canceled: "bg-status-canceled",
      postponed: "bg-status-postponed",
      rescheduled: "bg-status-rescheduled",
    };
    return statusMap[code?.toLowerCase() || ""] || "bg-muted";
  };

  const getGenres = () => {
    const classification = event.classifications?.[0];
    if (!classification) return "";
    
    const parts = [
      classification.segment?.name,
      classification.genre?.name,
      classification.subGenre?.name,
      classification.type?.name,
      classification.subType?.name,
    ].filter(Boolean);
    
    return parts.join(", ");
  };

  const artists = event._embedded?.attractions?.map((a) => a.name).join(", ") || "TBA";
  const venue = event._embedded?.venues?.[0]?.name || "Venue TBA";
  const priceRange = event.priceRanges?.[0];

  const shareOnTwitter = () => {
    const text = `Check ${event.name} on Ticketmaster. ${event.url}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(event.url || "")}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-1">Date</h3>
            <p>{formatDateTime()}</p>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-1">Artist/Team</h3>
            <p>{artists}</p>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-1">Venue</h3>
            <p>{venue}</p>
          </div>

          {getGenres() && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Genres</h3>
              <p>{getGenres()}</p>
            </div>
          )}

          {priceRange && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Price Range</h3>
              <p>
                {priceRange.currency} ${priceRange.min} - ${priceRange.max}
              </p>
            </div>
          )}

          {event.dates?.status?.code && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Ticket Status</h3>
              <Badge className={getStatusColor(event.dates.status.code)}>
                {event.dates.status.code}
              </Badge>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">Share</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={shareOnFacebook}>
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={shareOnTwitter}>
                <Twitter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {event.seatmap?.staticUrl && (
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">Seatmap</h3>
            <img
              src={event.seatmap.staticUrl}
              alt="Seat map"
              className="rounded-lg border w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};
