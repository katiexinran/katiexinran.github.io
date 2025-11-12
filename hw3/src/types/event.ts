export interface Event {
  id: string;
  name: string;
  url?: string;
  images?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
    };
    status?: {
      code?: string;
    };
  };
  classifications?: Array<{
    segment?: {
      name?: string;
    };
    genre?: {
      name?: string;
    };
    subGenre?: {
      name?: string;
    };
    type?: {
      name?: string;
    };
    subType?: {
      name?: string;
    };
  }>;
  priceRanges?: Array<{
    type?: string;
    currency?: string;
    min?: number;
    max?: number;
  }>;
  seatmap?: {
    staticUrl?: string;
  };
  _embedded?: {
    venues?: Array<{
      name?: string;
      url?: string;
      address?: {
        line1?: string;
      };
      city?: {
        name?: string;
      };
      state?: {
        stateCode?: string;
      };
      location?: {
        latitude?: string;
        longitude?: string;
      };
      parkingDetail?: string;
      generalInfo?: {
        generalRule?: string;
        childRule?: string;
      };
      images?: Array<{
        url: string;
      }>;
    }>;
    attractions?: Array<{
      name?: string;
      id?: string;
    }>;
  };
}
