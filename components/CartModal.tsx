export default function CartModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 font-bold text-xl"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-6">TON PANIER</h2>
        <p className="text-gray-600">Le contenu de ton panier est ici.</p>
        <button 
          onClick={onClose} 
          className="mt-8 w-full bg-black text-white py-3 rounded-lg font-bold"
        >
          FERMER
        </button>
      </div>
    </div>
  )
}