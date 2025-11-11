import { useState, useEffect, useCallback, useRef } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeywordAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** NEW: allow parent to style the trigger so we can show red borders etc. */
  className?: string;
}

export const KeywordAutocomplete = ({
  value,
  onChange,
  placeholder,
  className,
}: KeywordAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const fetchSuggestions = useCallback(async (keyword: string) => {
    if (!keyword || keyword.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/events/suggest?keyword=${encodeURIComponent(keyword)}`
      );

      if (response.ok) {
        const data = await response.json();
        const attractionNames = data._embedded?.attractions?.map((a: any) => a.name) || [];
        setSuggestions([keyword, ...attractionNames]);
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([keyword]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
    setSuggestions([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
          >
            <span className={cn(!inputValue && "text-muted-foreground")}>
              {inputValue || placeholder}
            </span>
            <div className="flex items-center gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {inputValue && !isLoading && (
                <X
                  className="h-4 w-4 cursor-pointer hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                />
              )}
            </div>
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search events..."
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {suggestions.length === 0 && !isLoading && (
              <CommandEmpty>No suggestions found.</CommandEmpty>
            )}
            {suggestions.length > 0 && (
              <CommandGroup>
                {suggestions.map((suggestion, index) => (
                  <CommandItem
                    key={`${suggestion}-${index}`}
                    value={suggestion}
                    onSelect={(currentValue) => {
                      onChange(currentValue);
                      setInputValue(currentValue);
                      setOpen(false);
                    }}
                  >
                    {suggestion}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
