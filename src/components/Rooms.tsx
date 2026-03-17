import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Bed, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Utensils,
  UserPlus,
  LogOut
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [billData, setBillData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeActions, setActiveActions] = useState<number | null>(null);

  const handleCheckoutClick = async (room) => {
    try {
      // Find the active stay for this room
      const stays = await api.get('/guests'); // This is a bit hacky, in a real app we'd have a specific endpoint
      // Actually, let's assume we have a way to get the active stay
      // For now, I'll just fetch the bill directly if I had the stay ID
      // I'll update the server to return active stay with room
      const data = await api.get(`/rooms/${room.id}/active-stay`);
      const bill = await api.get(`/stays/${data.stay.id}/bill`);
      setBillData(bill);
      setSelectedRoom(room);
      setShowCheckoutModal(true);
    } catch (err) {
      alert("Could not find active stay for this room.");
    }
  };

  const handleFinalCheckout = async (paymentMethod) => {
    try {
      const nights = Math.max(1, Math.ceil((new Date().getTime() - new Date(billData.stay.check_in_date).getTime()) / (1000 * 3600 * 24)));
      const roomTotal = nights * billData.stay.room_price;
      
      await api.post(`/stays/${billData.stay.id}/check-out`, {
        totalRoomCharges: roomTotal,
        paymentMethod
      });
      setShowCheckoutModal(false);
      fetchRooms();
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchRooms = async () => {
    try {
      const data = await api.get('/rooms');
      setRooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const filteredRooms = rooms.filter((room: any) => 
    room.number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    available: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    occupied: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
    reserved: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
    cleaning: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
  };

  const bedIconColors = {
    available: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    occupied: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
    reserved: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
    cleaning: 'text-slate-600 dark:text-slate-400 bg-slate-500/10',
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Rooms</h1>
          <p className="text-sm font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-2">Manage hotel rooms and guest stays.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary px-6 py-3 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Room
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by room number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-medium"
          />
        </div>
        <div className="flex gap-2">
          <button className="px-6 py-4 glass-card rounded-2xl text-xs font-black tracking-widest text-slate-600 dark:text-slate-300 flex items-center gap-2 hover:bg-white/80 dark:hover:bg-slate-800/80 uppercase">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRooms.map((room) => (
          <div key={room.id} className="glass-card rounded-[2rem] overflow-hidden hover:scale-[1.02] transition-transform duration-300 relative group">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300", bedIconColors[room.status as keyof typeof bedIconColors])}>
                  <Bed className="w-7 h-7" />
                </div>
                <span className={cn("text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full", statusColors[room.status as keyof typeof statusColors])}>
                  {room.status}
                </span>
              </div>
              <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Room {room.number}</h3>
              <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-1">{room.type}</p>
              <div className="mt-6 flex items-center justify-between">
                <p className="text-xl font-black tracking-tighter text-blue-600 dark:text-blue-400">{formatCurrency(room.price)}<span className="text-[10px] tracking-widest text-slate-400 dark:text-slate-500 font-bold uppercase ml-1">/night</span></p>
              </div>
            </div>
            <div className="px-6 py-5 bg-white/30 dark:bg-slate-900/30 border-t border-slate-200/50 dark:border-slate-800/50 flex gap-3 relative backdrop-blur-md">
              {room.status === 'available' ? (
                <button 
                  onClick={() => { setSelectedRoom(room); setShowCheckInModal(true); }}
                  className="flex-1 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  Check-in
                </button>
              ) : (
                <button 
                  onClick={() => handleCheckoutClick(room)}
                  className="flex-1 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-500/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  Checkout
                </button>
              )}
              <div className="relative">
                <button 
                  onClick={() => setActiveActions(activeActions === room.id ? null : room.id)}
                  className="p-3 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 rounded-xl hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                {activeActions === room.id && (
                  <div className="absolute bottom-full right-0 mb-3 w-56 glass-card rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 py-2 z-20 animate-zoom-in">
                    <button 
                      onClick={() => { setSelectedRoom(room); setShowCheckInModal(true); setActiveActions(null); }}
                      className="w-full px-5 py-3 text-left text-[10px] font-black tracking-widest uppercase hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Check-in
                    </button>
                    <button 
                      onClick={() => { handleCheckoutClick(room); setActiveActions(null); }}
                      className="w-full px-5 py-3 text-left text-[10px] font-black tracking-widest uppercase hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Checkout
                    </button>
                    <button 
                      onClick={async () => {
                        if (confirm('Are you sure you want to cancel the reservation for this room?')) {
                          // We need to find the reservation ID. For now let's just update room status
                          await api.patch(`/rooms/${room.id}/status`, { status: 'available' });
                          fetchRooms();
                          setActiveActions(null);
                        }
                      }}
                      className="w-full px-5 py-3 text-left text-[10px] font-black tracking-widest uppercase hover:bg-red-500/10 flex items-center gap-3 text-red-600 dark:text-red-400 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Reservation
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Room Modal (Simplified) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card rounded-[2rem] max-w-md w-full p-10 shadow-2xl animate-zoom-in">
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase mb-8">Add New Room</h2>
            <form className="space-y-5" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              await api.post('/rooms', {
                number: formData.get('number') as string,
                type: formData.get('type') as string,
                price: parseFloat(formData.get('price') as string)
              });
              setShowAddModal(false);
              fetchRooms();
            }}>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Room Number</label>
                <input name="number" type="text" className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Type</label>
                <select name="type" className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium">
                  <option>Single</option>
                  <option>Double</option>
                  <option>Suite</option>
                  <option>Deluxe</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Price per Night</label>
                <input name="price" type="number" className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium" required />
              </div>
              <div className="flex gap-4 mt-10">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-6 py-4 glass-card rounded-2xl font-black tracking-widest text-[10px] uppercase text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 active:scale-95 transition-all">Cancel</button>
                <button type="submit" className="flex-1 btn-primary py-4 text-[10px]">Save Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check-in Modal (Simplified) */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="glass-card rounded-[2rem] max-w-md w-full p-6 sm:p-10 shadow-2xl animate-zoom-in my-auto">
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase mb-2">Guest Check-in</h2>
            <p className="text-[10px] font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase mb-8">Room {selectedRoom?.number} • {selectedRoom?.type}</p>
            <form className="space-y-5" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              try {
                await api.post('/check-in', {
                  guestName: formData.get('name') as string,
                  phone: formData.get('phone') as string,
                  idNumber: formData.get('id') as string,
                  roomId: selectedRoom.id,
                  checkInDate: new Date().toISOString().split('T')[0],
                  deposit: formData.get('deposit') as string,
                  paymentMethod: formData.get('paymentMethod') as string
                });
                setShowCheckInModal(false);
                fetchRooms();
              } catch (err: any) {
                alert(err.message || 'Check-in failed');
              }
            }}>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Guest Name</label>
                <input name="name" type="text" className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Phone Number</label>
                <input name="phone" type="text" className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">ID / Passport Number</label>
                <input name="id" type="text" className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Deposit / Upfront Payment</label>
                  <input name="deposit" type="number" defaultValue="0" min="0" className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Payment Method</label>
                  <select name="paymentMethod" className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium">
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Mpesa">Mpesa</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <button type="button" onClick={() => setShowCheckInModal(false)} className="flex-1 px-6 py-4 glass-card rounded-2xl font-black tracking-widest text-[10px] uppercase text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 active:scale-95 transition-all">Cancel</button>
                <button type="submit" className="flex-1 btn-primary py-4 text-[10px]">Check-in Guest</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && billData && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card rounded-[2rem] max-w-2xl w-full p-10 shadow-2xl overflow-y-auto max-h-[90vh] animate-zoom-in">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Guest Checkout</h2>
                <p className="text-[10px] font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase mt-2">Room {selectedRoom?.number} • {billData.stay.guest_name}</p>
              </div>
              <div className="text-right bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-[9px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Check-in Date</p>
                <p className="font-black text-slate-900 dark:text-white mt-1">{billData.stay.check_in_date}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/50 dark:bg-slate-900/50 rounded-[1.5rem] p-6 border border-slate-200 dark:border-slate-800">
                <h3 className="font-black tracking-widest text-[10px] text-slate-900 dark:text-white uppercase mb-6 flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Bed className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  Room Charges
                </h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{billData.stay.room_price} <span className="text-[10px] tracking-widest text-slate-500 uppercase">per night</span></p>
                    <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-1">Stay duration: {Math.max(1, Math.ceil((new Date().getTime() - new Date(billData.stay.check_in_date).getTime()) / (1000 * 3600 * 24)))} nights</p>
                  </div>
                  <p className="text-2xl font-black tracking-tighter text-blue-600 dark:text-blue-400">
                    {formatCurrency(Math.max(1, Math.ceil((new Date().getTime() - new Date(billData.stay.check_in_date).getTime()) / (1000 * 3600 * 24))) * billData.stay.room_price)}
                  </p>
                </div>
              </div>

              <div className="bg-white/50 dark:bg-slate-900/50 rounded-[1.5rem] p-6 border border-slate-200 dark:border-slate-800">
                <h3 className="font-black tracking-widest text-[10px] text-slate-900 dark:text-white uppercase mb-6 flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Utensils className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  Restaurant & Bar
                </h3>
                <div className="space-y-4">
                  {billData.orders.length === 0 ? (
                    <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase italic">No orders recorded.</p>
                  ) : (
                    billData.orders.map(order => (
                      <div key={order.id} className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{order.items_summary}</span>
                        <span className="font-black text-slate-900 dark:text-white">{formatCurrency(order.total_amount)}</span>
                      </div>
                    ))
                  )}
                </div>
                {billData.orders.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span className="font-black tracking-widest text-[10px] uppercase text-slate-500 dark:text-slate-400">POS Total</span>
                    <span className="font-black text-purple-600 dark:text-purple-400 text-xl">
                      {formatCurrency(billData.orders.reduce((sum, o) => sum + o.total_amount, 0))}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2rem] text-white shadow-xl shadow-blue-600/20">
                <div className="text-center sm:text-left">
                  <p className="text-blue-100 text-[10px] font-black tracking-widest uppercase">Grand Total</p>
                  <h3 className="text-4xl font-black tracking-tighter mt-1">
                    {formatCurrency(
                      (Math.max(1, Math.ceil((new Date().getTime() - new Date(billData.stay.check_in_date).getTime()) / (1000 * 3600 * 24))) * billData.stay.room_price) +
                      billData.orders.reduce((sum, o) => sum + o.total_amount, 0)
                    )}
                  </h3>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button onClick={() => handleFinalCheckout('cash')} className="flex-1 sm:flex-none bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white px-6 py-4 rounded-2xl font-black tracking-widest text-[10px] uppercase transition-all active:scale-95">Cash</button>
                  <button onClick={() => handleFinalCheckout('card')} className="flex-1 sm:flex-none bg-white text-blue-600 px-6 py-4 rounded-2xl font-black tracking-widest text-[10px] uppercase hover:bg-blue-50 transition-all active:scale-95 shadow-lg">Card</button>
                </div>
              </div>

              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="w-full py-4 text-[10px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-all active:scale-95 mt-4"
              >
                Cancel & Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
