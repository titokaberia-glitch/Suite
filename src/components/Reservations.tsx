import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Calendar, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle,
  MoreVertical,
  User,
  Bed,
  Phone,
  CreditCard,
  X,
  Filter,
  ArrowRight,
  CheckCircle,
  CalendarDays,
  ChevronRight
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReservations = async () => {
    try {
      const [resData, roomsData] = await Promise.all([
        api.get('/reservations'),
        api.get('/rooms')
      ]);
      setReservations(resData);
      setRooms(roomsData.filter((r: any) => r.status === 'available'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleAddReservation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.post('/reservations', {
        guestName: formData.get('name'),
        phone: formData.get('phone'),
        idNumber: formData.get('id'),
        roomId: formData.get('roomId'),
        checkInDate: formData.get('checkIn'),
        checkOutDate: formData.get('checkOut'),
        deposit: parseFloat(formData.get('deposit') as string || '0'),
      });
      setShowAddModal(false);
      fetchReservations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/reservations/${id}/status`, { status });
      setActiveMenu(null);
      fetchReservations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const statusColors = {
    pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    confirmed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
    completed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  };

  const filteredReservations = reservations.filter((res: any) => 
    res.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.room_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Reservations</h1>
          <p className="text-sm font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-2">Manage upcoming guest bookings and availability.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 px-6 py-3"
        >
          <Plus className="w-5 h-5" />
          New Reservation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Bookings</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{reservations.length}</h3>
        </div>
        <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Confirmed</p>
          <h3 className="text-3xl font-black text-emerald-600 tracking-tighter">
            {reservations.filter((r: any) => r.status === 'confirmed').length}
          </h3>
        </div>
        <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending</p>
          <h3 className="text-3xl font-black text-amber-600 tracking-tighter">
            {reservations.filter((r: any) => r.status === 'pending').length}
          </h3>
        </div>
        <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Rooms</p>
          <h3 className="text-3xl font-black text-blue-600 tracking-tighter">
            {rooms.length}
          </h3>
        </div>
      </div>

      <div className="glass-card overflow-hidden p-0 rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by guest name or room number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold"
            />
          </div>
          <button className="px-6 py-3 glass-card rounded-2xl font-black tracking-widest text-[10px] uppercase text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 flex items-center gap-2 transition-all">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5">Guest Details</th>
                <th className="px-8 py-5">Room</th>
                <th className="px-8 py-5">Stay Period</th>
                <th className="px-8 py-5">Deposit</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReservations.map((res: any) => (
                <tr key={res.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg">
                        {res.guest_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{res.guest_name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{res.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Bed className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">Room {res.room_number}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">In</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white">{res.check_in_date}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                      <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Out</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white">{res.check_out_date}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(res.deposit)}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border",
                      statusColors[res.status as keyof typeof statusColors]
                    )}>
                      {res.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right relative">
                    <div className="flex items-center justify-end gap-2">
                      {res.status === 'pending' && (
                        <button 
                          onClick={() => handleUpdateStatus(res.id, 'confirmed')}
                          className="p-2 hover:bg-emerald-500/10 rounded-xl text-emerald-600 transition-all"
                          title="Confirm Reservation"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button 
                        onClick={() => setActiveMenu(activeMenu === res.id ? null : res.id)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 transition-all"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {activeMenu === res.id && (
                        <div className="absolute right-8 top-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-20 py-3 w-56 text-left animate-in fade-in zoom-in-95 duration-200">
                          <button 
                            onClick={() => handleUpdateStatus(res.id, 'confirmed')}
                            className="w-full px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Confirm Booking
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(res.id, 'cancelled')}
                            className="w-full px-6 py-3 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                          >
                            <XCircle className="w-4 h-4" /> Cancel Booking
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Reservation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="glass-card rounded-[3rem] max-w-4xl w-full p-10 shadow-2xl animate-zoom-in">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">New Reservation</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <form className="space-y-10" onSubmit={handleAddReservation}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 border-b border-blue-600/20 pb-2">
                      <User className="w-4 h-4" />
                      Guest Information
                    </h3>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Guest Name</label>
                      <input name="name" type="text" className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold" placeholder="Full Name" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                      <input name="phone" type="text" className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold" placeholder="+1 234 567 890" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">ID / Passport Number</label>
                      <input name="id" type="text" className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold" placeholder="ID Number" required />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2 border-b border-purple-600/20 pb-2">
                      <CalendarDays className="w-4 h-4" />
                      Stay Details
                    </h3>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Select Room</label>
                      <select name="roomId" className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold" required>
                        <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Choose a room...</option>
                        {rooms.map((r: any) => (
                          <option key={r.id} value={r.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                            Room {r.number} - {r.type} ({formatCurrency(r.price)}/night)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Check-in</label>
                        <input name="checkIn" type="date" className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Check-out</label>
                        <input name="checkOut" type="date" className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Deposit Amount</label>
                      <input name="deposit" type="number" step="0.01" className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold" placeholder="0.00" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-10 border-t border-slate-200/50 dark:border-slate-800/50">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-6 py-4 glass-card rounded-2xl font-black tracking-widest text-[10px] uppercase text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 active:scale-95 transition-all">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary py-4 text-[10px]">Confirm Reservation</button>
                </div>
              </form>
            </div>
        </div>
      )}
    </div>
  );
}
