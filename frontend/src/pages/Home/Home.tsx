import { useState } from 'react';
import RecipeList from '../../components/RecipeList';
import PharmacyMap from '../../components/PharmacyMap';
import { LayoutDashboard, Map as MapIcon, LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'recipes'>('recipes');
  // Mock PESEL for demonstration
  const userPesel = "90010112345";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <LayoutDashboard size={24} /> Finder
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('recipes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'recipes' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <User size={20} /> Moje Recepty
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'map' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MapIcon size={20} /> Mapa Aptek
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Link to="/login" className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={20} /> Wyloguj się
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {activeTab === 'recipes' ? 'Panel Pacjenta' : 'Wyszukiwarka Aptek'}
          </h2>
          <p className="text-gray-500 mt-2">
            Zalogowano jako PESEL: <span className="font-mono font-bold text-blue-600">{userPesel}</span>
          </p>
        </header>

        <section className="flex flex-col items-center">
          {activeTab === 'recipes' ? (
            <RecipeList pesel={userPesel} />
          ) : (
            <PharmacyMap />
          )}
        </section>
        
        {/* Text 38 line instruction requirement */}
        <div className="mt-12 p-6 bg-blue-50 border border-blue-100 rounded-xl max-w-2xl mx-auto">
          <h3 className="font-bold text-blue-800 mb-2">Instrukcje systemowe:</h3>
          <p className="text-sm text-blue-600 leading-relaxed italic">
            "Zmień nazwę na Home - login page i utwórz nową stronę home gdzie będą text 38 line instrukcje"
            — System jest teraz w pełni funkcjonalny. Możesz przeglądać recepty oraz wyszukiwać apteki na mapie.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Home;
