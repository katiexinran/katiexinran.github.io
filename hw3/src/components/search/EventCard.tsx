import { Event } from "@/types/event";
import { Card } from "@/components/ui/card";
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
    
    try {
      const date = new Date(event.dates.start.localDate);
      const time = event.dates.start.localTime;
      
      if (time) {
        const [hours, minutes] = time.split(':');
        date.setHours(parseInt(hours), parseInt(minutes));
        return format(date, "MMM d, yyyy h:mm a");
      }
      return format(date, "MMM d, yyyy");
    } catch (error) {
      return "Date TBA";
    }
  };

  return (
    <Card 
      className="group flex h-full flex-col overflow-hidden border-none p-0 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl cursor-pointer"
      onClick={onClick}
    >
      {/* Image with overlays */}
      <div className="relative h-52 w-full overflow-hidden">
        <img
          src={imageUrl}
          alt={event.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Category badge - top left */}
        <div className="absolute left-3 top-3">
          <Badge 
            variant="secondary" 
            className="bg-white/90 text-xs font-semibold uppercase text-foreground"
          >
            {category}
          </Badge>
        </div>
        
        {/* Date/Time badge - top right */}
        <div className="absolute right-3 top-3">
          <Badge 
            variant="secondary" 
            className="bg-black/80 text-xs font-semibold text-white"
          >
            {formatDateTime()}
          </Badge>
        </div>
      </div>

      {/* Content section */}
      <div className="flex flex-1 flex-col gap-3 bg-white p-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold leading-tight text-gray-900">
            {event.name}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {venue}
          </p>
        </div>
        
        {/* Favorite button */}
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="mt-auto flex justify-end"
        >
          <FavoriteButton eventId={event.id} eventName={event.name} />
        </div>
      </div>
    </Card>
  );
};
