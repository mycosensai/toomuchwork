import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { pathname } = useLocation();
  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-10 border-b border-[#1f1f1f] bg-vault-background/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-vault-gold">
          The Vault DFW
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/"
            className={`text-sm hover:text-vault-gold ${isActive('/') ? 'text-vault-gold' : 'text-vault-muted'}`}
          >
            Home
          </Link>
          <Link
            to="/cart"
            className={`text-sm hover:text-vault-gold ${isActive('/cart') ? 'text-vault-gold' : 'text-vault-muted'}`}
          >
            Cart
          </Link>
        </nav>
      </div>
    </header>
  );
}
