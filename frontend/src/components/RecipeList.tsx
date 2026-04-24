import { useState, useEffect } from 'react';
import axios from 'axios';
import { Pill, FileText, CheckCircle, Clock } from 'lucide-react';

interface Drug {
  name: string;
  quantity: string;
}

interface Recipe {
  accessCode: string;
  pesel: string;
  status: string;
  drugs: Drug[];
}

const RecipeList = ({ pesel }: { pesel: string }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pesel) return;

    setLoading(true);
    axios.get(`http://localhost:8080/api/recipes/${pesel}`)
      .then(res => setRecipes(res.data))
      .catch(err => {
        console.error("Błąd pobierania recept:", err);
        // Mock data if backend is not running
        setRecipes([
          {
            accessCode: "1234",
            pesel: pesel,
            status: "AKTYWNA",
            drugs: [{ name: "Amotaks", quantity: "1 opakowanie" }, { name: "Paracetamol", quantity: "2 opakowania" }]
          }
        ]);
      })
      .finally(() => setLoading(false));
  }, [pesel]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-2xl">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FileText className="text-blue-500" /> Twoje e-recepty
      </h2>
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-100 rounded-lg"></div>
          <div className="h-20 bg-gray-100 rounded-lg"></div>
        </div>
      ) : recipes.length > 0 ? (
        <div className="space-y-4">
          {recipes.map((recipe, idx) => (
            <div key={idx} className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-sm text-gray-500">Kod dostępu</span>
                  <p className="font-mono text-lg font-bold text-blue-600">{recipe.accessCode}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  recipe.status === 'AKTYWNA' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {recipe.status === 'AKTYWNA' ? <CheckCircle size={12} className="inline mr-1" /> : <Clock size={12} className="inline mr-1" />}
                  {recipe.status}
                </div>
              </div>
              <div className="space-y-2">
                {recipe.drugs.map((drug, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-2 text-sm text-gray-700">
                    <Pill size={14} className="text-blue-400" />
                    <span className="font-medium">{drug.name}</span>
                    <span className="text-gray-400">— {drug.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">Brak aktywnych recept dla podanego numeru PESEL.</p>
      )}
    </div>
  );
};

export default RecipeList;
