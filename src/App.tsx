import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Cart from './pages/Cart';

export default function App() {
  return (
    <div className="min-h-screen bg-vault-background text-vault-text">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </main>
    </div>
  );
}
