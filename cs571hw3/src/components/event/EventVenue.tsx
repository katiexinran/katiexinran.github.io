import { Event } from "@/types/event";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin } from "lucide-react";

interface EventVenueProps {
  event: Event;
}

export const EventVenue = ({ event }: EventVenueProps) => {
  const venue = event._embedded?.venues?.[0];

  if (!venue) {
    return <p className="text-center text-muted-foreground">Venue information not available</p>;
  }

  const address = [
    venue.address?.line1,
    venue.city?.name,
    venue.state?.stateCode,
  ].filter(Boolean).join(", ");

  const openGoogleMaps = () => {
    if (venue.location?.latitude && venue.location?.longitude) {
      const url = `https://www.google.com/maps?q=${venue.location.latitude},${venue.location.longitude}`;
      window.open(url, "_blank");
    }
  };

  const seeVenueEvents = () => {
    // This would need the venue ID to construct proper URL
    window.open(`https://www.ticketmaster.com/`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-1">Name</h3>
            <p className="text-lg font-semibold">{venue.name}</p>
          </div>

          {address && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Address</h3>
              <Button
                variant="link"
                className="p-0 h-auto text-primary"
                onClick={openGoogleMaps}
              >
                <MapPin className="h-4 w-4 mr-1" />
                {address}
              </Button>
            </div>
          )}

          <Button onClick={seeVenueEvents}>
            <ExternalLink className="mr-2 h-4 w-4" />
            See Events
          </Button>

          {venue.parkingDetail && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Parking</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {venue.parkingDetail}
              </p>
            </div>
          )}

          {venue.generalInfo?.generalRule && (
            <div>
              <h3 className="font-semibold text-lg mb-2">General Rule</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {venue.generalInfo.generalRule}
              </p>
            </div>
          )}

          {venue.generalInfo?.childRule && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Child Rule</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {venue.generalInfo.childRule}
              </p>
            </div>
          )}
        </div>

        {venue.images?.[0] && (
          <div>
            <img
              src={venue.images[0].url}
              alt={venue.name}
              className="rounded-lg w-full h-auto object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
};
