import { formatCurrency } from '../lib/format';
import type { CartItem } from '../context/CartContext';

interface Props {
  item: CartItem;
  remove: (id: string) => void;
}

export default function CartItemRow({ item, remove }: Props) {
  const itemTotal = item.listing.price;
  const tax = itemTotal * 0.09;

  return (
    <div className="rounded-2xl border border-[#1f1f1f] bg-vault-surface p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-black">
            <img
              src={item.listing.image_url}
              alt={item.listing.title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-vault-text">{item.listing.title}</p>
            <p className="text-sm text-vault-muted">{item.listing.category}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="text-right">
            <div className="text-sm text-vault-muted">Subtotal</div>
            <div className="font-medium text-vault-text">{formatCurrency(itemTotal)}</div>
            <div className="text-xs text-vault-muted">Tax 9%: {formatCurrency(tax)}</div>
          </div>
          <button
            className="text-sm text-[#EF4444] hover:underline"
            onClick={() => remove(item.id)}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
