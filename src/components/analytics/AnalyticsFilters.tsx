
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import type { AnalyticsFilters as Filters } from "@/services/instagramService";

interface AnalyticsFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  availableProfiles: string[];
}

export const AnalyticsFilters = ({ filters, onFiltersChange, availableProfiles }: AnalyticsFiltersProps) => {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);
    if (range.from && range.to) {
      onFiltersChange({
        ...filters,
        dateRange: {
          start: range.from.toISOString(),
          end: range.to.toISOString(),
        }
      });
    } else if (!range.from && !range.to) {
      const newFilters = { ...filters };
      delete newFilters.dateRange;
      onFiltersChange(newFilters);
    }
  };

  return (
    <Card className="p-4 bg-white rounded-2xl shadow-lg">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-48">
          <label className="text-sm font-medium text-[#333333] mb-2 block">Profile</label>
          <Select 
            value={filters.profileId || "all"} 
            onValueChange={(value) => 
              onFiltersChange({
                ...filters,
                profileId: value === "all" ? undefined : value
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All profiles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All profiles</SelectItem>
              {availableProfiles.map((profile) => (
                <SelectItem key={profile} value={profile}>
                  @{profile}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-48">
          <label className="text-sm font-medium text-[#333333] mb-2 block">Content Type</label>
          <Select 
            value={filters.contentType || "all"} 
            onValueChange={(value) => 
              onFiltersChange({
                ...filters,
                contentType: value === "all" ? undefined : value as any
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="post">Posts</SelectItem>
              <SelectItem value="reel">Reels</SelectItem>
              <SelectItem value="carousel">Carousels</SelectItem>
              <SelectItem value="story">Stories</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-48">
          <label className="text-sm font-medium text-[#333333] mb-2 block">Performance</label>
          <Select 
            value={filters.performanceCategory || "all"} 
            onValueChange={(value) => 
              onFiltersChange({
                ...filters,
                performanceCategory: value === "all" ? undefined : value as any
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All performance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All performance</SelectItem>
              <SelectItem value="Green">Green (High)</SelectItem>
              <SelectItem value="Amber">Amber (Medium)</SelectItem>
              <SelectItem value="Red">Red (Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-48">
          <label className="text-sm font-medium text-[#333333] mb-2 block">Date Range</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {(filters.profileId || filters.contentType || filters.performanceCategory || filters.dateRange) && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              onFiltersChange({});
              setDateRange({});
            }}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
    </Card>
  );
};
