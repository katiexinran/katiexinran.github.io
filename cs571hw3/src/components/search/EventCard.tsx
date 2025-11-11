import { Event } from "@/types/event";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/event/FavoriteButton";
import { format } from "date-fns";

interface EventCardProps {
  event: Event;
  onClick: () => void;
  showRemoveButton?: boolean;
}

export const EventCard = ({ event, onClick, showRemoveButton }: EventCardProps) => {
  const imageUrl = event.images?.[0]?.url || "/placeholder.svg";
  const category = event.classifications?.[0]?.segment?.name || "Event";
  const venue = event._embedded?.venues?.[0]?.name || "Venue TBA";
  
  const formatDateTime = () => {
    if (!event.dates?.start?.localDate) return "Date TBA";
    
    const date = new Date(event.dates.start.localDate);
    const time = event.dates.start.localTime;
    
    if (time) {
      return `${format(date, "MMM d, hh:mm a")}`;
    }
    return format(date, "MMM d");
  };

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow relative group">
      <div onClick={onClick}>
        <div className="aspect-video relative overflow-hidden rounded-t-lg">
          <img
            src={imageUrl}
            alt={event.name}
            className="object-cover w-full h-full"
          />
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="secondary">{category}</Badge>
            <span className="text-sm text-muted-foreground">{formatDateTime()}</span>
          </div>
          <h3 className="font-semibold text-lg mb-1 line-clamp-2">{event.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1">{venue}</p>
        </CardContent>
      </div>
      <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
        <FavoriteButton eventId={event.id} />
      </div>
    </Card>
  );
};
