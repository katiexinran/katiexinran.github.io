import { Event } from "@/types/event";
import { EventCard } from "./EventCard";
import { Search } from "lucide-react";

interface EventsGridProps {
  events: Event[];
  onEventClick: (eventId: string) => void;
  showRemoveButton?: boolean;
}

export const EventsGrid = ({ events, onEventClick, showRemoveButton }: EventsGridProps) => {
      // No results
      if (events.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
            <Search className="w-12 h-12 mb-3" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold">Nothing found</h3>
            <p className="text-sm mt-1">
              Update the query to find events near you
            </p>
          </div>
        );
      }

  // Events found
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onClick={() => onEventClick(event.id)}
          showRemoveButton={showRemoveButton}
        />
      ))}
    </div>
  );
};
