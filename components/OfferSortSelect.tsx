"use client";

import { useRouter, useSearchParams } from "next/navigation";

const sortOptions = [
  { value: "recommended", label: "Препоръчани" },
  { value: "nearest-date", label: "Най-близка дата" },
  { value: "price-asc", label: "Цена: възходяща" },
  { value: "price-desc", label: "Цена: низходяща" },
  { value: "newest", label: "Най-нови" }
] as const;

export function OfferSortSelect({ currentSort }: { currentSort?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "recommended") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }

    params.delete("page");
    router.push(`/offers${params.toString() ? `?${params.toString()}` : ""}#results`);
  };

  return (
    <select value={currentSort || "recommended"} onChange={(event) => updateSort(event.target.value)} aria-label="Сортиране">
      {sortOptions.map((option) => (
        <option value={option.value} key={option.value}>{option.label}</option>
      ))}
    </select>
  );
}
