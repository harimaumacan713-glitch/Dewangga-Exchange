/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import StockChart from './components/StockChart';
import { Bell, ArrowDownLeft, ArrowUpRight, TrendingUp, Wallet, ArrowLeftRight, QrCode, Landmark, ArrowLeft } from 'lucide-react';
import { auth, db, loginWithGoogle, logout, doc, updateDoc, increment, setDoc, getDoc, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';

export default function App() {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [subScreen, setSubScreen] = useState<'main' | 'deposit' | 'withdraw'>('main');
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [topUpAmount, setTopUpAmount] = useState<number>(10);

  // Reset subScreen when changing main tab
  const handleTabChange = (tab: string) => {
    setActiveScreen(tab);
    setSubScreen('main');
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const walletRef = doc(db, 'exchange_wallets', user.uid);
      const unsubscribeWallet = onSnapshot(walletRef, (doc) => {
        if (doc.exists()) {
          setBalance(doc.data().balance || 0);
        } else {
          setBalance(0);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'exchange_wallets/' + user.uid);
      });
      return () => unsubscribeWallet();
    } else {
      setBalance(0);
    }
  }, [user]);

  const handleTopUp = async () => {
    if (!user) return;
    const walletRef = doc(db, 'exchange_wallets', user.uid);
    try {
      const walletDoc = await getDoc(walletRef);
      if (walletDoc.exists()) {
        await updateDoc(walletRef, { balance: increment(topUpAmount) });
      } else {
        await setDoc(walletRef, { balance: topUpAmount });
      }
      setSubScreen('main');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'exchange_wallets/' + user.uid);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <button onClick={loginWithGoogle} className="bg-lime-400 text-black py-3 px-6 rounded-2xl font-bold">
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <main className="p-4 md:max-w-md mx-auto">
        {subScreen === 'deposit' && (
           <div className="space-y-6">
             <header className="flex items-center gap-4">
               <button onClick={() => setSubScreen('main')}><ArrowLeft /></button>
               <h1 className="font-bold text-2xl">Deposit</h1>
             </header>
             <div className="bg-white p-6 rounded-3xl border border-gray-100 text-center space-y-4">
               <QrCode size={128} className="mx-auto" />
               <p className="font-mono text-xs bg-gray-100 p-2 rounded">Scan QRIS untuk Deposit</p>
               <p>Atau Transfer ke IP Number:</p>
               <p className="font-bold text-lg font-mono">{user.uid.slice(0, 10)}</p>
             </div>
           </div>
        )}
        {subScreen === 'withdraw' && (
           <div className="space-y-6">
             <header className="flex items-center gap-4">
               <button onClick={() => setSubScreen('main')}><ArrowLeft /></button>
               <h1 className="font-bold text-2xl">Withdraw</h1>
             </header>
             <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
               <input type="text" placeholder="Bank Name" className="w-full p-3 border rounded-2xl" />
               <input type="text" placeholder="Account Number" className="w-full p-3 border rounded-2xl font-mono" />
               <input type="number" placeholder="Amount" className="w-full p-3 border rounded-2xl" />
               <button className="w-full py-4 bg-lime-400 rounded-2xl font-bold">Confirm Withdrawal</button>
             </div>
           </div>
        )}
        {subScreen === 'main' && (
          <>
            {activeScreen === 'dashboard' && (
              <div className="space-y-6">
                <header className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img src={user.photoURL || "https://i.pravatar.cc/150?u=jack"} alt="avatar" className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="text-xs text-gray-500">Welcome back!</p>
                      <h1 className="font-bold text-gray-900">{user.displayName}</h1>
                    </div>
                  </div>
                  <button onClick={logout} className="text-xs text-red-500 font-bold">Logout</button>
                </header>

                <div className="bg-black text-white p-6 rounded-3xl text-center">
                  <p className="text-sm text-gray-400">Total Balance</p>
                  <h2 className="text-4xl font-bold py-2">${balance.toFixed(2)}</h2>
                  <div className="flex justify-center gap-4 mt-4">
                    <button onClick={() => setSubScreen('withdraw')} className="flex items-center gap-2 bg-lime-400 text-black py-2 px-4 rounded-full font-bold">
                      <ArrowDownLeft size={16} /> Withdraw
                    </button>
                    <button onClick={() => setSubScreen('deposit')} className="flex items-center gap-2 bg-white text-black py-2 px-4 rounded-full font-bold border border-gray-200">
                      <ArrowUpRight size={16} /> Deposit
                    </button>
                  </div>
                </div>

                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl">Market Update</h3>
                    <span className="text-sm font-bold text-lime-600">View All</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-3">
                       <div className="p-2 bg-green-100 rounded-full"><TrendingUp className="text-green-600" /></div>
                       <div>
                         <p className="text-sm font-bold">SBUX</p>
                         <p className="text-xs text-green-500">+2.5%</p>
                       </div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-3">
                       <div className="p-2 bg-indigo-100 rounded-full"><TrendingUp className="text-indigo-600" /></div>
                       <div>
                         <p className="text-sm font-bold">NIKE</p>
                         <p className="text-xs text-red-400">-0.5%</p>
                       </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
            {activeScreen === 'portfolio' && (
              <div className="space-y-6">
                <header className="flex justify-between items-center">
                  <h1 className="font-bold text-2xl">Wallet Portfolio</h1>
                </header>
                <div className="bg-lime-400 p-6 rounded-3xl text-center text-black">
                  <p className="text-sm font-medium">Available Balance</p>
                  <h2 className="text-4xl font-bold mt-2">${balance.toFixed(2)}</h2>
                </div>
                <StockChart />
              </div>
            )}
            {activeScreen === 'convert' && (
              <div className="space-y-6">
                <header className="flex justify-between items-center">
                  <h1 className="font-bold text-2xl">Swap / Top-Up</h1>
                </header>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="flex items-center gap-2"><Wallet size={16}/> Top-Up Amount</span>
                    <input type="number" value={topUpAmount} onChange={(e) => setTopUpAmount(Number(e.target.value))} className="w-20 text-right border-b border-gray-300 font-mono" />
                  </div>
                  <div className="flex justify-center p-2"><ArrowLeftRight className="text-gray-400" /></div>
                  <button onClick={handleTopUp} className="w-full py-4 bg-lime-400 rounded-2xl font-bold flex items-center justify-center gap-2">
                    Simulate Transfer
                  </button>
                </div>
              </div>
            )}
            {activeScreen === 'profile' && (
              <div className="space-y-6">
                <header className="flex justify-between items-center">
                  <h1 className="font-bold text-2xl">API Integration</h1>
                </header>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">User ID (External Reference)</p>
                    <div className="bg-gray-50 p-3 rounded-2xl font-mono text-sm break-all border border-gray-100">
                      {user.uid}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Deposit API Endpoint</p>
                    <div className="bg-gray-50 p-3 rounded-2xl font-mono text-sm break-all border border-gray-100">
                      POST /api/external-deposit
                    </div>
                  </div>
                  <div className="p-4 bg-lime-50 rounded-2xl border border-lime-100 text-xs text-lime-800 leading-relaxed">
                    Gunakan <strong>PROJECT_API_KEY</strong> di Header <code>x-api-key</code> untuk mentransfer saldo dari Projek 1 anda ke akun ini secara eksternal.
                  </div>
                </div>
                <button onClick={logout} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold">Logout</button>
              </div>
            )}
          </>
        )}
      </main>
      <BottomNav active={activeScreen} setActive={handleTabChange} />
    </div>
  );
}
