"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, X, Loader } from "lucide-react";

export function ConversationsSearchBar({ baseUrl, initialSearch }: { baseUrl: string, initialSearch?: string }) {
  const [value, setValue] = useState(initialSearch || "");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  function handleClear() {
    setIsLoading(true);
    router.push(baseUrl);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    setValue("");
  }

  async function handleSearch() {
    setIsLoading(true);
    const url = value.trim().length > 0 ? `${baseUrl}?search=${encodeURIComponent(value)}` : baseUrl;
    router.push(url);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-grow">
      <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
      <Input
          type="text"
          name="search"
          placeholder="Buscar..."
          className="h-9 pl-8 pr-8"
          autoComplete="off"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        {(value.length > 0 || isLoading) && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            tabIndex={0}
            aria-label="Limpiar búsqueda"
            onClick={handleClear}
          >
            {isLoading ? <Loader className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}
          </Button>
        )}
      </div>
    </div>
  );
} 