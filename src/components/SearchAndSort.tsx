
"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchAndSortProps<T> {
  data: T[];
  searchFields: (keyof T)[];
  sortFields: { key: keyof T; label: string }[];
  onChange: (filteredAndSortedData: T[]) => void;
  className?: string;
}

export function SearchAndSort<T>({ data, searchFields, sortFields, onChange, className }: SearchAndSortProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof T | "">("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Handle search and sort
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Filter based on search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          return value && typeof value === "string" && value.toLowerCase().includes(lowerSearch);
        })
      );
    }

    // Sort based on selected field and direction
    if (sortField) {
      result.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue == null || bValue == null) return 0;

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        } else {
          // Convert to string for other types (e.g., dates)
          return sortDirection === "asc"
            ? String(aValue).localeCompare(String(bValue))
            : String(bValue).localeCompare(String(aValue));
        }
      });
    }

    return result;
  }, [data, searchTerm, searchFields, sortField, sortDirection]);

  // Update parent component with filtered/sorted data
  React.useEffect(() => {
    onChange(filteredAndSortedData);
  }, [filteredAndSortedData, onChange]);

  // Reset sort
  const resetSort = () => {
    setSortField("");
    setSortDirection("asc");
  };

  return (
    <div className={cn("flex flex-col sm:flex-row gap-4 items-center", className)}>
      <div className="relative flex-1 w-full sm:w-auto">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 w-full"
        />
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Select
          value={sortField as string}
          onValueChange={(value) => setSortField(value as keyof T)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {sortFields.map((field) => (
              <SelectItem key={String(field.key)} value={String(field.key)}>
                {field.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
          disabled={!sortField}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={resetSort}
          disabled={!sortField}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
