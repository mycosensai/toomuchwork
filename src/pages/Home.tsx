import { Link } from 'react-router-dom';
import { LISTINGS } from '../lib/mock';
import ProductCard from '../components/ProductCard';

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[#1f1f1f] bg-vault-surface p-6">
        <h1 className="text-2xl font-bold text-vault-gold">The Vault DFW</h1>
        <p className="text-vault-muted">Preferences in gold, trust on chain.</p>
      </section>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Explore</h2>
          <Link to="/cart" className="text-sm text-vault-gold hover:underline">
            View cart
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {LISTINGS.map((item) => (
            <ProductCard key={item.id} listing={item} onOpen={() => {}} />
          ))}
        </div>
      </section>
    </div>
  );
}
