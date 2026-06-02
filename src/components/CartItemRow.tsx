import { formatCurrency } from '../lib/format';

interface Props {
  item: CartItem;
  remove: (lineId: string) => void;
}

export default function CartItemRow({ item, remove }: Props) {
  const subtotal = item.listing.price + item.listing.price * 0.09;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-xl bg-black">
            <img src={item.listing.image_url} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-[#f5f5f5]">{item.listing.title}</p>
            <p className="text-sm text-[#a1a1aa]">{item.listing.category}</p>
          </div>
        </div>
        <button
          className="text-sm text-[#f5f518] hover:underline"
          onClick={() => remove(item.id)}
        >
          Remove
        </button>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#a1a1aa]">Subtotal</span>
        <span>
          {formatCurrency(item.listing.price)} · Tax 9%: {formatCurrency(item.listing.price * 0.09)}
        </span>
      </div>
    </div>
  );
}
