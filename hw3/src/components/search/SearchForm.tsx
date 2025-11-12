import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { KeywordAutocomplete } from "./KeywordAutocomplete";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const IPINFO_TOKEN = import.meta.env.VITE_IPINFO_TOKEN || "";
const formSchema = z.object({
  keyword: z.string().min(1, "Please enter some keywords"),
  category: z.string().min(1, "Category is required"),
  location: z.string().optional(),
  autoDetect: z.boolean(),
  distance: z.coerce.number()
    .min(1, "Distance must be at least 1 mile")
    .max(100, "Distance cannot exceed 100 miles"),
}).refine(
  (data) => {
    // If autoDetect is on, we don't need a location.
    if (data.autoDetect) {
      return true;
    }
    // If autoDetect is off, location is required.
    return data.location && data.location.trim().length > 0;
  },
  {
    // If the check above fails, apply this error to the 'location' field.
    message: "Location is required when auto-detect is disabled",
    path: ["location"],
  }
);

interface SearchFormProps {
  onSearch: (data: {
    keyword: string;
    category: string;
    distance: number;
    lat: number;
    lng: number;
    location: string;
    autoDetect: boolean;
  }) => void;
  isLoading: boolean;
  initialValues?: {
    keyword: string;
    category: string;
    distance: number;
    location: string;
    autoDetect: boolean;
  };
}

export const SearchForm = ({ onSearch, isLoading, initialValues }: SearchFormProps) => {
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      keyword: "",
      category: "All",
      location: "",
      autoDetect: false,
      distance: 10,
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const autoDetect = form.watch("autoDetect");
  const errors = form.formState.errors;

  // Load initial values if provided
  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues]);

  useEffect(() => {
    if (autoDetect) {
      form.clearErrors("location");
      detectLocation();
    } else {
      setDetectedCoords(null);
    }
  }, [autoDetect]);

  const detectLocation = async () => {
    setIsAutoDetecting(true);
    try {
      const response = await fetch(`https://ipinfo.io/json?token=${IPINFO_TOKEN}`);
      const data = await response.json();

      if (data.loc) {
        const [lat, lng] = data.loc.split(",");
        const coords = { lat: parseFloat(lat), lng: parseFloat(lng) };
        setDetectedCoords(coords);
        
        // Reverse geocode to get city name
        try {
          const reverseGeoResponse = await fetch(
            `${API_URL}/api/reverse-geocode?lat=${lat}&lng=${lng}`
          );
          const reverseGeoData = await reverseGeoResponse.json();
          
          if (reverseGeoData.success && reverseGeoData.city) {
            form.setValue("location", reverseGeoData.city);
          } else {
            form.setValue("location", "");
          }
        } catch (reverseError) {
          console.error("Failed to reverse geocode:", reverseError);
          form.setValue("location", "");
        }
        
        return coords;
      }
    } catch (error) {
      console.error("Failed to detect location:", error);
      toast.error("Failed to detect location");
      form.setValue("autoDetect", false);
    } finally {
      setIsAutoDetecting(false);
    }
    return null;
  };

  const geocodeLocation = async (address: string) => {
    try {
      // Use backend geocoding endpoint to keep API key secure
      const response = await fetch(
        `${API_URL}/api/geocode?address=${encodeURIComponent(address)}`
      );
      const data = await response.json();

      if (data.success && data.lat && data.lng) {
        return { lat: data.lat, lng: data.lng };
      }
      
      // Fallback to default coordinates
      console.warn("Could not geocode location, using default coordinates");
      toast.error("Could not find location. Using default coordinates (Los Angeles).");
      return { lat: 34.0522, lng: -118.2437 }; // Los Angeles default
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Failed to geocode location. Using default coordinates (Los Angeles).");
      return { lat: 34.0522, lng: -118.2437 };
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    let coords;
    let locationName = values.location;
    
    if (values.autoDetect) {
      if (detectedCoords) {
        coords = detectedCoords;
      } else {
        coords = await detectLocation();
      }
      // Use the location from the form field (which was set by reverse geocoding)
      locationName = form.getValues("location") || locationName;
    } else {
      coords = await geocodeLocation(values.location!);
    }

    if (coords) {
      onSearch({
        keyword: values.keyword,
        category: values.category,
        distance: values.distance,
        lat: coords.lat,
        lng: coords.lng,
        location: locationName,
        autoDetect: values.autoDetect,
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="bg-card rounded-lg shadow-md p-6 mb-8"
      >
        <div className="flex flex-col gap-4">
          {/* Single row with all fields */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_2fr_1fr_auto] gap-4 items-start">
            {/* Keywords */}
            <FormField
              control={form.control}
              name="keyword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-sm">
                    <span className={errors.keyword ? "text-red-500" : "text-black"}>
                      Keywords
                    </span>
                    <span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <KeywordAutocomplete
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val);
                        if (form.formState.isSubmitted && val.trim()) {
                          form.clearErrors("keyword");
                        }
                      }}
                      placeholder="Search for events..."
                      className={errors.keyword ? "border-red-500" : "border-gray-300"}
                    />
                  </FormControl>
                  <div className="h-5 mt-1 invisible">
                    <FormMessage className="text-red-500 text-xs" />
                  </div>
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-sm">
                    <span className={errors.category ? "text-red-500" : "text-black"}>
                      Category
                    </span>
                    <span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger
                        className={errors.category ? "border-red-500" : "border-gray-300"}
                      >
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Music">Music</SelectItem>
                      <SelectItem value="Sports">Sports</SelectItem>
                      <SelectItem value="Arts & Theatre">Arts & Theatre</SelectItem>
                      <SelectItem value="Film">Film</SelectItem>
                      <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="h-5 mt-1 invisible">
                    <FormMessage className="text-red-500 text-xs" />
                  </div>
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel htmlFor="location" className="font-semibold text-sm m-0">
                      <span className={errors.location ? "text-red-500" : "text-black"}>
                        Location
                      </span>
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <span id="auto-detect-label">Auto-detect Location</span>
                      <Switch
                        id="autoDetect"
                        aria-labelledby="auto-detect-label"
                        checked={autoDetect}
                        onCheckedChange={(checked) => {
                          form.setValue("autoDetect", checked);
                          if (checked) form.clearErrors("location");
                        }}
                      />
                    </div>
                  </div>
                  <FormControl>
                    <Input
                      id="location"
                      {...field}
                      placeholder="Enter city, district or street..."
                      disabled={autoDetect || isAutoDetecting}
                      onChange={(e) => {
                        field.onChange(e);
                        if (form.formState.isSubmitted && e.target.value.trim()) {
                          form.clearErrors("location");
                        }
                      }}
                      className={errors.location ? "border-red-500" : "border-gray-300"}
                    />
                  </FormControl>
                  <div className={cn("h-5 mt-1", !errors.location && "invisible")}>
                    <FormMessage className="text-red-500 text-xs" />
                  </div>
                </FormItem>
              )}
            />

            {/* Distance */}
            <FormField
              control={form.control}
              name="distance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-sm">
                    <span className={errors.distance ? "text-red-500" : "text-black"}>
                      Distance
                    </span>
                    <span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        onChange={(e) => {
                          field.onChange(e);
                          // Trigger validation immediately on change
                          form.trigger("distance");
                        }}
                        className={`${errors.distance ? "border-red-500" : "border-gray-300"} [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none pr-14`}
                        style={{ MozAppearance: "textfield" }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        miles
                      </span>
                    </div>
                  </FormControl>
                  <div className={cn("h-5 mt-1", !errors.distance && "invisible")}>
                    <FormMessage className="text-red-500 text-xs" />
                  </div>
                </FormItem>
              )}
            />

            {/* Search Button */}
            <div className="flex flex-col">
              <div className="h-[28px]"></div>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-black hover:bg-gray-900 text-white flex items-center gap-2 h-10 px-6 whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                Search Events
              </Button>
              <div className="h-5 mt-1 invisible"></div>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};