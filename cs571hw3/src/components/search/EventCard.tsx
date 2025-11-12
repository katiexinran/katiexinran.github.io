import { Event } from "@/types/event";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/event/FavoriteButton";
import { formatEventDate } from "@/lib/utils";

interface EventCardProps {
  event: Event;
  onClick: () => void;
  showRemoveButton?: boolean;
}

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const EventCard = ({ event, onClick, showRemoveButton }: EventCardProps) => {
  const imageUrl = event.images?.[0]?.url || "/placeholder.svg";
  const rawCategory = event.classifications?.[0]?.segment?.name || "Event";
  const category = toTitleCase(rawCategory);
  const venue = event._embedded?.venues?.[0]?.name || "Venue TBA";
  
  const dateLabel = formatEventDate(
    event.dates?.start?.localDate,
    event.dates?.start?.localTime
  ) || "Date TBA";

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
            className="bg-white text-xs font-semibold text-foreground shadow-sm"
          >
            {category}
          </Badge>
        </div>

        {/* Date/Time badge - top right */}
        <div className="absolute right-3 top-3">
          <Badge
            variant="secondary"
            className="bg-white text-xs font-semibold text-foreground shadow-sm"
          >
            {dateLabel}
          </Badge>
        </div>
      </div>

      {/* Content section */}
      <div className="flex items-start justify-between bg-white p-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold leading-tight text-gray-900">
            {event.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground truncate">
            {venue}
          </p>
        </div>
        <div
          onClick={(e) => e.stopPropagation()}
          className="ml-3 flex-shrink-0"
        >
          <FavoriteButton eventId={event.id} eventName={event.name} />
        </div>
      </div>
    </Card>
  );
};
