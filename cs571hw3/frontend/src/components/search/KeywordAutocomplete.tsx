import { useState, useCallback, useRef, useEffect } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Loader2, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface KeywordAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
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
  const timeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
   const shouldAutoOpenRef = useRef(true);

  const fetchSuggestions = useCallback(async (keyword: string) => {
    if (!keyword || keyword.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/suggest?keyword=${encodeURIComponent(keyword)}`
      );

      if (response.ok) {
        const data = await response.json();
        const attractionNames = data._embedded?.attractions?.map((a: any) => a.name) || [];
        const allSuggestions = [keyword, ...attractionNames];
        setSuggestions(allSuggestions);
         if (allSuggestions.length > 0 && shouldAutoOpenRef.current) {
           setOpen(true);
        }
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([keyword]);
      if (shouldAutoOpenRef.current) {
        setOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        shouldAutoOpenRef.current = false;
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    shouldAutoOpenRef.current = true;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    if (newValue.length >= 2) {
      timeoutRef.current = setTimeout(() => {
        fetchSuggestions(newValue);
      }, 300);
    } else {
      shouldAutoOpenRef.current = false;
      setSuggestions([]);
      setOpen(false);
    }
  };

  const handleClear = () => {
    onChange("");
    setSuggestions([]);
    shouldAutoOpenRef.current = false;
    setOpen(false);
  };

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    shouldAutoOpenRef.current = false;
    setOpen(false);
  };

  const handleChevronMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (open) {
      shouldAutoOpenRef.current = false;
      setOpen(false);
      return;
    }

    shouldAutoOpenRef.current = true;
    setOpen(true);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={cn("pr-20", className)}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
        {value && (
          <X
            className="h-4 w-4 cursor-pointer hover:text-destructive text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
          />
        )}
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          suggestions.length > 0 && (
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground cursor-pointer transition-transform duration-200",
                open && "rotate-180"
              )}
              onMouseDown={handleChevronMouseDown}
            />
          )
        )}
      </div>
      
      {open && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md"
        >
          <Command shouldFilter={false}>
            <CommandList>
              <CommandGroup>
                {suggestions.map((suggestion, index) => (
                  <CommandItem
                    key={`${suggestion}-${index}`}
                    value={suggestion}
                    onSelect={() => handleSelect(suggestion)}
                    className="cursor-pointer"
                  >
                    {suggestion}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};
