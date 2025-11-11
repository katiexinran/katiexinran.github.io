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

const formSchema = z.object({
  keyword: z.string().min(1, "Please enter some keywords"),
  category: z.string().min(1, "Category is required"),
  location: z.string().optional(),
  autoDetect: z.boolean(),
  distance: z.coerce.number().min(1, "Distance must be at least 1 mile"),
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
  }) => void;
  isLoading: boolean;
}

export const SearchForm = ({ onSearch, isLoading }: SearchFormProps) => {
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: "",
      category: "All",
      location: "",
      autoDetect: false,
      distance: 10,
    },
    mode: "onSubmit", // ✅ Only validate on submit
    reValidateMode: "onSubmit", // ✅ Changed from "onChange" to "onSubmit"
  });

  const autoDetect = form.watch("autoDetect");
  const errors = form.formState.errors;

  useEffect(() => {
    if (autoDetect) {
      form.clearErrors("location"); // clear location error if auto-detect is toggled on
      form.setValue("location", "");
      detectLocation();
    }
  }, [autoDetect]);

  const detectLocation = async () => {
    setIsAutoDetecting(true);
    try {
      const token = import.meta.env.VITE_IPINFO_TOKEN || "";
      const response = await fetch(`https://ipinfo.io/json?token=${token}`);
      const data = await response.json();

      if (data.loc) {
        const [lat, lng] = data.loc.split(",");
        form.setValue("location", `${data.city}, ${data.region}`);
        toast.success("Location detected successfully");
        return { lat: parseFloat(lat), lng: parseFloat(lng) };
      }
    } catch (error) {
      console.error("Failed to detect location:", error);
      toast.error("Failed to detect location");
      form.setValue("autoDetect", false);
    } finally {
      setIsAutoDetecting(false);
    }
  };

  const geocodeLocation = async (address: string) => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.results && data.results[0]) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng };
      }
      throw new Error("Location not found");
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Failed to geocode location");
      return null;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // No manual error checks needed!
    // If we get here, 'values' is 100% valid according to the schema.

    let coords;
    if (values.autoDetect) {
      coords = await detectLocation();
    } else {
      // We know values.location exists and is valid because the schema checked it
      coords = await geocodeLocation(values.location!);
    }

    if (coords) {
      onSearch({
        keyword: values.keyword,
        category: values.category,
        distance: values.distance,
        lat: coords.lat,
        lng: coords.lng,
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="bg-card rounded-lg shadow-md p-6 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr,1fr,1fr,220px,auto] gap-4 items-center">
          {/* Keywords */}
          <FormField
            control={form.control}
            name="keyword"
            render={({ field }) => (
              <FormItem className="relative">
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
                      // Only clear errors if form has been submitted at least once
                      if (form.formState.isSubmitted && val.trim()) {
                        form.clearErrors("keyword");
                      }
                    }}
                    placeholder="Search for events..."
                    className={errors.keyword ? "border-red-500" : "border-gray-300"}
                  />
                </FormControl>
                <div className="min-h-[24px]">
                  <FormMessage className="text-red-500 font-medium text-sm" />
                </div>
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel className="font-semibold text-sm">
                  <span className={errors.category ? "text-red-500" : "text-black"}>
                    Category
                  </span>
                  <span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <div className="min-h-[24px]">
                  <FormMessage className="text-red-500 font-medium text-sm" />
                </div>
              </FormItem>
            )}
          />

          {/* Location + Auto-detect */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem className="relative">
                <div className="flex items-center gap-3">
                  <FormLabel className="font-semibold text-sm">
                    <span className={errors.location ? "text-red-500" : "text-black"}>
                      Location
                    </span>
                    <span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <span
                    className={`text-sm font-medium ${
                      errors.location ? "text-red-500" : "text-gray-600"
                    }`}
                  >
                    Auto-detect Location
                  </span>
                  <Switch
                    id="autoDetect"
                    checked={form.watch("autoDetect")}
                    onCheckedChange={(checked) => {
                      form.setValue("autoDetect", checked);
                      if (checked) form.clearErrors("location");
                    }}
                  />
                </div>

                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter city, district or street..."
                    disabled={autoDetect || isAutoDetecting}
                    onChange={(e) => {
                      field.onChange(e);
                      // Only clear errors if form has been submitted at least once
                      if (form.formState.isSubmitted && e.target.value.trim()) {
                        form.clearErrors("location");
                      }
                    }}
                    className={errors.location ? "border-red-500" : "border-gray-300"}
                  />
                </FormControl>
                <div className="min-h-[24px]">
                  <FormMessage className="text-red-500 font-medium text-sm" />
                </div>
              </FormItem>
            )}
          />

          {/* Distance */}
          <FormField
            control={form.control}
            name="distance"
            render={({ field }) => (
              <FormItem className="relative">
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
                      step="1"
                      className={`${errors.distance ? "border-red-500" : "border-gray-300"} [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                      style={{ MozAppearance: "textfield" }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      miles
                    </span>
                  </div>
                </FormControl>
                <div className="min-h-[24px]">
                  <FormMessage className="text-red-500 font-medium text-sm" />
                </div>
              </FormItem>
            )}
          />

          {/* Search button */}
          <div className="flex items-center justify-end h-full">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-black hover:bg-gray-900 text-white flex items-center gap-2 px-5"
            >
              <Search className="w-4 h-4" />
              {isLoading ? "Searching..." : "Search Events"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};