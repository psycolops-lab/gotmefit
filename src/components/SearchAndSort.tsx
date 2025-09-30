"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SortOption = "a-z" | "z-a" | "latest" | "oldest";

interface SearchAndSortProps<T> {
  id: string;
  data: T[];
  searchField: keyof T | ((item: T) => string);
  sortField: keyof T | ((item: T) => string | number | Date);
  placeholder?: string;
  className?: string;
  render: (data: T[]) => React.ReactNode; // 👈 lets you render directly
}

export default function SearchAndSort<T>({
  id,
  data,
  searchField,
  sortField,
  placeholder = "Search...",
  className,
  render,
}: SearchAndSortProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("a-z");

  // Filter + sort
  const processed = useMemo(() => {
    let result = [...data];

    if (searchTerm.trim()) {
      result = result.filter((item) => {
        const value =
          typeof searchField === "function"
            ? searchField(item)
            : String(item[searchField] ?? "");
        return value.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    result.sort((a, b) => {
      const aValue =
        typeof sortField === "function" ? sortField(a) : a[sortField];
      const bValue =
        typeof sortField === "function" ? sortField(b) : b[sortField];

      if (sortOption === "a-z" || sortOption === "z-a") {
        const aStr = String(aValue ?? "").toLowerCase();
        const bStr = String(bValue ?? "").toLowerCase();
        return sortOption === "a-z"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      } else {
        const aDate =
          aValue instanceof Date ? aValue : new Date(String(aValue));
        const bDate =
          bValue instanceof Date ? bValue : new Date(String(bValue));
        return sortOption === "latest"
          ? bDate.getTime() - aDate.getTime()
          : aDate.getTime() - bDate.getTime();
      }
    });

    return result;
  }, [data, searchTerm, sortOption, searchField, sortField]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
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

      {/* Render the processed list */}
      {render(processed)}
    </div>
  );
}
