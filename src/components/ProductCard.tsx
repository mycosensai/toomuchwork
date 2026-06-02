import type { Listing } from '../types';

interface Props {
  listing: Listing;
  onOpen: (id: string) => void;
}

export default function ProductCard({ listing, onOpen }: Props) {
  return (
    <button
      onClick={() => onOpen(listing.id)}
      className="group flex flex-col rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] text-left transition hover:border-[#f5c518]/60 hover:shadow-[0_0_30px_rgba(245,197,24,0.08)]"
    >
      <div className="aspect-square overflow-hidden rounded-t-2xl bg-black">
        <img
          src={listing.image_url}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover mix-blend-normal transition duration-200 group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-sm font-semibold leading-5 text-[#f5c518]">{listing.category}</p>
        <p className="line-clamp-1 text-base font-medium text-[#f5f5f5]">{listing.title}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-xl font-bold tracking-tight text-[#f5c518]">${listing.price}</span>
          <span className="text-xs text-[#a1a1aa]">Qty 1</span>
        </div>
      </div>
    </button>
  );
}
