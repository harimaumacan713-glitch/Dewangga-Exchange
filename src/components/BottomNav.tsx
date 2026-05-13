import { LayoutDashboard, Wallet, ArrowLeftRight, History, User } from 'lucide-react';

export default function BottomNav({ active, setActive }: { active: string, setActive: (s: string) => void }) {
  const items = [
    { id: 'dashboard', icon: LayoutDashboard },
    { id: 'portfolio', icon: Wallet },
    { id: 'convert', icon: ArrowLeftRight },
    { id: 'history', icon: History },
    { id: 'profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-lime-400 p-4 rounded-t-3xl flex justify-between items-center shadow-lg">
      {items.map((item) => (
        <button key={item.id} onClick={() => setActive(item.id)} className={`p-2 rounded-full ${active === item.id ? 'bg-lime-400 text-black' : 'text-gray-500'}`}>
          <item.icon size={24} />
        </button>
      ))}
    </div>
  );
}
