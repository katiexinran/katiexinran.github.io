import { Event } from "@/types/event";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Users, Facebook, Twitter } from "lucide-react";
import { formatTimeWithAMPM, formatNumberWithCommas } from "@/lib/utils";

interface EventInfoProps {
  event: Event;
}

function getStatusBadge(code?: string) {
  if (!code) return null;
  const normalized = code.toLowerCase();
  if (normalized === 'onsale') {
    return <Badge className="bg-emerald-500 text-white">On Sale</Badge>;
  }
  if (normalized === 'offsale') {
    return <Badge variant="destructive">Off Sale</Badge>;
  }
  if (normalized === 'canceled' || normalized === 'cancelled') {
    return <Badge className="bg-black text-white">Canceled</Badge>;
  }
  if (normalized === 'postponed' || normalized === 'rescheduled') {
    return <Badge className="bg-orange-500 text-white">{normalized === 'postponed' ? 'Postponed' : 'Rescheduled'}</Badge>;
  }
  return null;
}

export const EventInfo = ({ event }: EventInfoProps) => {
  const venue = event._embedded?.venues?.[0];
  const attractions = event._embedded?.attractions ?? [];
  const start = event.dates?.start;
  const classifications = event.classifications?.[0];

  const artistNames = attractions.map((item: { name?: string }) => item?.name).filter(Boolean).join(', ');
  const genreLabel = [
    classifications?.segment?.name,
    classifications?.genre?.name,
    classifications?.subGenre?.name,
    classifications?.type?.name,
    classifications?.subType?.name,
  ]
    .filter((item): item is string => Boolean(item) && item !== 'Undefined')
    .filter((item, index, array) => array.indexOf(item) === index)
    .join(' • ');

  const facebookShareUrl = event.url ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(event.url)}` : undefined;
  const twitterShareUrl = event.url
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check ${event.name} on Ticketmaster. ${event.url}`)}`
    : undefined;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          {start?.localDate || start?.localTime ? (
            <div className="flex items-center gap-3 text-sm">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <span>{[start?.localDate, formatTimeWithAMPM(start?.localTime)].filter(Boolean).join(' ')}</span>
            </div>
          ) : null}
          {artistNames ? (
            <div className="flex items-center gap-3 text-sm">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span>{artistNames}</span>
            </div>
          ) : null}
          {venue?.name ? (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span>{venue.name}</span>
            </div>
          ) : null}
          {genreLabel ? (
            <div className="text-sm">
              <p className="font-semibold">Genres</p>
              <p className="text-muted-foreground">{genreLabel}</p>
            </div>
          ) : null}
          {event.priceRanges?.length ? (
            <div className="text-sm">
              <p className="font-semibold">Price Ranges</p>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                {event.priceRanges.map((range, index) => (
                  <li key={`${range.type}-${index}`}>
                    {range.type ? `${range.type}: ` : ''}
                    {range.currency ?? 'USD'} {range.min ?? 'N/A'} - {range.max ?? 'N/A'}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {getStatusBadge(event.dates?.status?.code ?? undefined)}
          <div className="flex gap-3">
            {facebookShareUrl ? (
              <Button asChild variant="outline" size="icon">
                <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
              </Button>
            ) : null}
            {twitterShareUrl ? (
              <Button asChild variant="outline" size="icon">
                <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter">
                  <Twitter className="h-5 w-5" />
                </a>
              </Button>
            ) : null}
          </div>
        </div>
        {event.seatmap?.staticUrl ? (
          <div className="overflow-hidden rounded-lg border border-border bg-white">
            <img src={event.seatmap.staticUrl} alt="Seatmap" className="h-full w-full object-contain" />
          </div>
        ) : null}
      </div>
    </div>
  );
};
