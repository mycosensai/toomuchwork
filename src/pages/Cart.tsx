import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import CartItemRow from '../components/CartItemRow';
import { formatCurrency } from '../lib/format';

export default function Cart() {
  const ctx = useContext(CartContext);
  if (!ctx) return null;

  const { items, remove, total } = ctx;
  const tax = total * 0.09;
  const subtotal = total + tax;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-vault-text">Your Cart</h1>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-[#1f1f1f] bg-vault-surface p-8 text-center">
          <p className="text-vault-muted">Your cart is empty.</p>
          <Link to="/" className="mt-4 inline-block text-vault-gold hover:underline">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map(item => (
              <CartItemRow key={item.id} item={item} remove={remove} />
            ))}
          </div>
          <div className="rounded-2xl border border-[#1f1f1f] bg-vault-surface p-5">
            <div className="flex items-center justify-between">
              <span className="text-vault-muted">Subtotal</span>
              <span className="text-lg font-semibold">{formatCurrency(total)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-vault-muted">
              <span>Tax (9%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-vault-gold">{formatCurrency(subtotal)}</span>
            </div>
            <button className="mt-6 w-full rounded-xl bg-vault-gold py-3 font-semibold text-vault-bg hover:bg-vault-gold-hover">
              Checkout
            </button>
            <Link to="/" className="mt-3 block text-center text-sm text-vault-muted hover:text-vault-gold">
              Continue shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
