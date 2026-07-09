"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import type { MemberListItem } from "@/lib/types/api";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MemberSearchInputProps {
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
}

export function MemberSearchInput({
  value,
  onChange,
  placeholder = "Ketik nama anggota...",
}: MemberSearchInputProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const searchQuery = useQuery({
    queryKey: ["admin", "members", "search", debouncedQuery],
    queryFn: () =>
      apiGet<MemberListItem[]>("/admin/members/search", {
        search: debouncedQuery,
        per_page: 10,
      }),
    enabled: debouncedQuery.length >= 2 && open,
  });

  const members = searchQuery.data?.data ?? [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (member: MemberListItem) => {
    onChange(member.id);
    setSelectedName(member.name);
    setQuery(member.name);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setQuery(next);
    setOpen(true);
    if (selectedName && next !== selectedName) {
      onChange("");
      setSelectedName("");
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-9"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && debouncedQuery.length >= 2 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
          {searchQuery.isLoading ? (
            <p className="p-3 text-sm text-muted-foreground">Mencari...</p>
          ) : members.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">Tidak ditemukan</p>
          ) : (
            <ul className="max-h-60 overflow-auto py-1">
              {members.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-accent",
                      value === m.id && "bg-accent",
                    )}
                    onClick={() => handleSelect(m)}
                  >
                    <span className="font-medium">{m.name}</span>
                    {(m.email || m.phone) && (
                      <span className="ml-2 text-muted-foreground">
                        {[m.email, m.phone].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
