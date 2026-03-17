import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  ShoppingBag, 
  Search, 
  Calendar, 
  User, 
  Bed, 
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    try {
      const data = await api.get('/orders');
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order: any) => 
    order.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.items_summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    paid: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    pending: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    attached_to_room: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    fulfilled: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    delivered: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  };

  const handleUpdateStatus = async (id: number, field: string, value: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { [field]: value });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Orders & Sales</h1>
          <p className="text-sm font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-2">View all restaurant and bar transactions.</p>
        </div>
      </div>

      <div className="glass-card rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by guest, room, or items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Guest / Room</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Fulfillment</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
              {filteredOrders.map((order: any) => (
                <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-black tracking-widest text-slate-400 dark:text-slate-500">#{order.id.toString().padStart(5, '0')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">{order.items_summary}</p>
                    <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mt-1">Served by {order.waiter_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    {order.stay_id ? (
                      <div className="flex items-center gap-2">
                        <Bed className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{order.guest_name}</p>
                          <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-1">Room {order.room_number}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase italic">Walk-in Guest</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-slate-900 dark:text-white">{formatCurrency(order.total_amount)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={order.payment_status}
                      onChange={(e) => handleUpdateStatus(order.id, 'paymentStatus', e.target.value)}
                      className={cn(
                        "text-[10px] font-bold uppercase px-2 py-1 rounded-full border-none outline-none cursor-pointer",
                        statusColors[order.payment_status as keyof typeof statusColors]
                      )}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="attached_to_room">To Room</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={order.fulfillment_status}
                      onChange={(e) => handleUpdateStatus(order.id, 'fulfillmentStatus', e.target.value)}
                      className={cn(
                        "text-[10px] font-bold uppercase px-2 py-1 rounded-full border-none outline-none cursor-pointer",
                        statusColors[order.fulfillment_status as keyof typeof statusColors] || 'bg-zinc-100 text-zinc-700'
                      )}
                    >
                      <option value="pending">Pending</option>
                      <option value="fulfilled">Fulfilled</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-[10px] font-bold tracking-widest uppercase">{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase text-xs">
                    No orders found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
