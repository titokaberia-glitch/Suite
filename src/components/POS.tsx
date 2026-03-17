import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  CreditCard, 
  Plus, 
  Minus,
  Utensils,
  Beer,
  Coffee,
  CheckCircle2
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

export default function POS() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inventoryData, roomsData] = await Promise.all([
          api.get('/inventory'),
          api.get('/rooms')
        ]);
        setItems(inventoryData);
        setRooms(roomsData.filter(r => r.status === 'occupied'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(0, i.quantity + delta);
        return newQty === 0 ? null : { ...i, quantity: newQty };
      }
      return i;
    }).filter(Boolean));
  };

  const total = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);

  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const handleCheckout = async (paymentStatus) => {
    try {
      await api.post('/orders', {
        stayId: selectedRoom || null,
        items: cart.map(i => ({ id: i.id, quantity: i.quantity, price: i.selling_price })),
        paymentStatus,
        fulfillmentStatus: 'pending',
        paymentMethod: paymentStatus === 'paid' ? paymentMethod : null
      });
      setCart([]);
      setSelectedRoom('');
      setPaymentMethod('Cash');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredItems = items.filter(i => {
    const matchesCategory = category === 'all' || i.category === category;
    const matchesSearch = (i.name || '').toLowerCase().includes(searchTerm.toLowerCase().trim());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-8">
      <div className="flex-1 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">POS</h1>
            <p className="text-sm font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-2">Restaurant & Bar Ordering System</p>
          </div>
          <div className="flex gap-2 p-1.5 glass-card rounded-2xl">
            {['all', 'food', 'drink'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-6 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all active:scale-95",
                  category === cat 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search items..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-medium"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                disabled={item.stock_quantity <= 0}
                className="glass-card p-6 rounded-[2rem] hover:scale-[1.02] transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex flex-col h-full"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:rotate-12 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  {item.category === 'food' ? (
                    <Utensils className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Beer className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
                <h4 className="font-black text-lg tracking-tight text-slate-900 dark:text-white mb-1 line-clamp-2">{item.name}</h4>
                <div className="mt-auto pt-4 flex items-end justify-between w-full">
                  <p className="text-xl font-black tracking-tighter text-blue-600 dark:text-blue-400">{formatCurrency(item.selling_price)}</p>
                  <p className={cn(
                    "text-[9px] font-black tracking-widest uppercase px-2 py-1 rounded-md", 
                    item.stock_quantity < 10 
                      ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20" 
                      : "bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20"
                  )}>
                    Stock: {item.stock_quantity}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-96 glass-card rounded-[2rem] flex flex-col overflow-hidden h-full">
        <div className="p-8 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between bg-white/30 dark:bg-slate-900/30 backdrop-blur-md">
          <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            Current Order
          </h3>
          <button onClick={() => setCart([])} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-95">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <ShoppingCart className="w-10 h-10 opacity-50" />
              </div>
              <p className="font-black tracking-widest text-[10px] uppercase">Your cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="font-bold text-slate-900 dark:text-white truncate">{item.name}</h4>
                  <p className="text-sm font-black text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(item.selling_price)}</p>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-1.5 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all active:scale-95 text-slate-600 dark:text-slate-300">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-black w-6 text-center text-slate-900 dark:text-white">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all active:scale-95 text-slate-600 dark:text-slate-300">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-white/30 dark:bg-slate-900/30 border-t border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Attach to Room</label>
            <select 
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
            >
              <option value="">Walk-in Customer</option>
              {rooms.map(room => (
                <option key={room.id} value={room.stay_id}>Room {room.number} - {room.guest_name}</option>
              ))}
            </select>
          </div>

          {!selectedRoom && (
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Payment Method</label>
              <select 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
              >
                <option value="Cash">Cash</option>
                <option value="Mpesa">Mpesa</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between py-4 border-t border-slate-200/50 dark:border-slate-700/50">
            <span className="text-[10px] font-black tracking-widest uppercase text-slate-500 dark:text-slate-400">Total</span>
            <span className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">{formatCurrency(total)}</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => handleCheckout('paid')}
              disabled={cart.length === 0}
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black tracking-widest text-[9px] uppercase hover:bg-slate-800 dark:hover:bg-slate-100 transition-all disabled:opacity-50 active:scale-95 shadow-lg"
            >
              Pay Now
            </button>
            <button 
              onClick={() => handleCheckout('pending')}
              disabled={cart.length === 0}
              className="bg-purple-500 text-white py-4 rounded-2xl font-black tracking-widest text-[9px] uppercase hover:bg-purple-600 transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-purple-500/20"
            >
              Pay Later
            </button>
            <button 
              onClick={() => handleCheckout('attached_to_room')}
              disabled={cart.length === 0 || !selectedRoom}
              className="btn-primary py-4 text-[9px] disabled:opacity-50"
            >
              To Room
            </button>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed bottom-8 right-8 bg-blue-600 text-white px-8 py-6 rounded-[2rem] shadow-2xl shadow-blue-600/20 flex items-center gap-4 animate-slide-up z-50">
          <div className="bg-white/20 p-2 rounded-xl">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="font-black tracking-widest uppercase text-sm">Order placed successfully!</span>
        </div>
      )}
    </div>
  );
}
