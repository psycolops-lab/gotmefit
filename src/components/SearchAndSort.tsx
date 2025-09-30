
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import equal from "fast-deep-equal";

interface SelectAndSortProps<T> {
  id: string;
  data: T[];
  searchField: keyof T | ((item: T) => string);
  sortField: keyof T | ((item: T) => string | number | Date);
  onDataChange: (filteredAndSortedData: T[]) => void;
  placeholder?: string;
  className?: string;
}

type SortOption = "a-z" | "z-a" | "latest" | "oldest";

export default function SelectAndSort<T>({
  id,
  data,
  searchField,
  sortField,
  onDataChange,
  placeholder = "Search...",
  className,
}: SelectAndSortProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("a-z");
  const prevProcessedDataRef = useRef<T[] | null>(null);

  // Memoize searchField and sortField
  const memoizedSearchField = useMemo(() => searchField, [searchField]);
  const memoizedSortField = useMemo(() => sortField, [sortField]);

  // Compute filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data];

    // Filter by search term
    if (searchTerm) {
      result = result.filter((item) => {
        const fieldValue =
          typeof memoizedSearchField === "function"
            ? memoizedSearchField(item)
            : String(item[memoizedSearchField]);
        return fieldValue.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Sort based on selected option
    result.sort((a, b) => {
      const aValue =
        typeof memoizedSortField === "function"
          ? memoizedSortField(a)
          : a[memoizedSortField];
      const bValue =
        typeof memoizedSortField === "function"
          ? memoizedSortField(b)
          : b[memoizedSortField];

      if (sortOption === "a-z" || sortOption === "z-a") {
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        return sortOption === "a-z" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      } else if (sortOption === "latest" || sortOption === "oldest") {
        const aDate = aValue instanceof Date ? aValue : new Date(aValue as string);
        const bDate = bValue instanceof Date ? bValue : new Date(bValue as string);
        return sortOption === "latest"
          ? bDate.getTime() - aDate.getTime()
          : aDate.getTime() - bDate.getTime();
      }
      return 0;
    });

    return result;
  }, [data, searchTerm, sortOption, memoizedSearchField, memoizedSortField]);

  // Only call onDataChange if processedData has changed deeply
  useEffect(() => {
    if (!equal(processedData, prevProcessedDataRef.current)) {
      prevProcessedDataRef.current = [...processedData];
      onDataChange([...processedData]);
    }
  }, [processedData, onDataChange]);

  // Memoize onValueChange
  const handleSortChange = useMemo(
    () => (value: string) => {
      setSortOption(value as SortOption);
    },
    []
  );

  return (
    <div className={cn("flex flex-col sm:flex-row gap-4 items-center", className)}>
      <div className="relative flex-1 w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          id={`${id}-search`}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      <div className="flex items-center gap-2">
        <ArrowUpDown className="h-4 w-4 text-gray-500" />
        <Select value={sortOption} onValueChange={handleSortChange}>
          <SelectTrigger id={`${id}-sort`} className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a-z">A-Z</SelectItem>
            <SelectItem value="z-a">Z-A</SelectItem>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
