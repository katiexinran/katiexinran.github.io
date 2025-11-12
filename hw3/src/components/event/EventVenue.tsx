import { Event } from "@/types/event";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface EventVenueProps {
  event: Event;
}

export const EventVenue = ({ event }: EventVenueProps) => {
  const venue = event._embedded?.venues?.[0];

  if (!venue) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-muted-foreground">Venue information not available</p>
      </div>
    );
  }

  const addressParts = [venue?.address?.line1, venue?.city?.name, venue?.state?.stateCode].filter(Boolean).join(', ');
  const googleMapsUrl = venue?.location?.latitude && venue.location.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${venue.location.latitude},${venue.location.longitude}`
    : undefined;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="space-y-6">
        {venue?.name ? (
          <div className="flex items-start justify-between">
            <h2 className="text-2xl font-semibold">{venue.name}</h2>
            {venue?.url ? (
              <Button asChild className="bg-black text-white hover:bg-black/90">
                <a href={venue.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" /> See Events
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}
        {addressParts && googleMapsUrl ? (
          <p className="text-sm text-muted-foreground">
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline hover:text-foreground">
              {addressParts} <ExternalLink className="inline h-3 w-3" />
            </a>
          </p>
        ) : addressParts ? (
          <p className="text-sm text-muted-foreground">{addressParts}</p>
        ) : null}
        
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          {venue?.images?.[0]?.url ? (
            <div className="overflow-hidden rounded-lg border border-border bg-white">
              <img src={venue.images[0].url} alt={venue.name ?? 'Venue'} className="h-full w-full object-contain" />
            </div>
          ) : null}
          
          <div className="space-y-4">
            {venue?.parkingDetail ? (
              <div>
                <h3 className="mb-2 text-base font-semibold">Parking</h3>
                <p className="text-sm text-muted-foreground">{venue.parkingDetail}</p>
              </div>
            ) : null}
            {venue?.generalInfo?.generalRule ? (
              <div>
                <h3 className="mb-2 text-base font-semibold">General Rule</h3>
                <p className="text-sm text-muted-foreground">{venue.generalInfo.generalRule}</p>
              </div>
            ) : null}
            {venue?.generalInfo?.childRule ? (
              <div>
                <h3 className="mb-2 text-base font-semibold">Child Rule</h3>
                <p className="text-sm text-muted-foreground">{venue.generalInfo.childRule}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
