import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BedDouble, 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Package,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency, cn } from '../lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    todayRevenue: 0,
    lowStockItems: 0,
    pendingOrders: 0,
    todayExpenses: 0,
    paidOrders: 0
  });
  const [rooms, setRooms] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState({ restaurant: 0, bar: 0, rooms: 0 });
  const [activeModal, setActiveModal] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsData, inventoryData, financeSummary, ordersData] = await Promise.all([
          api.get('/rooms'),
          api.get('/inventory'),
          api.get('/finances/summary'),
          api.get('/orders')
        ]);
        
        setRooms(roomsData);
        setInventory(inventoryData);
        setOrders(ordersData);
        
        const pendingOrders = financeSummary.orders?.find((o: any) => o.payment_status === 'pending')?.count || 0;
        const paidOrders = financeSummary.orders?.find((o: any) => o.payment_status === 'paid')?.count || 0;

        setStats({
          totalRooms: roomsData.length,
          occupiedRooms: roomsData.filter((r: any) => r.status === 'occupied').length,
          availableRooms: roomsData.filter((r: any) => r.status === 'available').length,
          todayRevenue: financeSummary.todaySales || 0,
          todayExpenses: financeSummary.todayExpenses || 0,
          lowStockItems: inventoryData.filter((i: any) => i.stock_quantity <= i.min_stock_level).length,
          pendingOrders: pendingOrders,
          paidOrders: paidOrders
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const cards = [
    { id: 'total', label: 'Total Rooms', value: stats.totalRooms, icon: BedDouble, color: 'from-blue-500 to-blue-600' },
    { id: 'occupied', label: 'Occupied', value: stats.occupiedRooms, icon: Users, color: 'from-blue-500 to-blue-600' },
    { id: 'sales', label: "Today's Sales", value: formatCurrency(stats.todayRevenue), icon: TrendingUp, color: 'from-emerald-500 to-emerald-600' },
    { id: 'expenses', label: "Today's Expenses", value: formatCurrency(stats.todayExpenses), icon: DollarSign, color: 'from-red-500 to-red-600' },
    { id: 'orders', label: "Total Orders", value: orders.length, icon: Package, color: 'from-purple-500 to-purple-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Dashboard</h1>
        <p className="text-sm font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-2">Welcome back to SuiteControl.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card) => (
          <button 
            key={card.id} 
            onClick={() => setActiveModal(card.id)}
            className="glass-card rounded-[2rem] p-6 transition-all text-left group hover:scale-[1.02] active:scale-95 duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`bg-gradient-to-tr ${card.color} p-4 rounded-[1.5rem] text-white shadow-lg shadow-slate-900/10 group-hover:rotate-12 transition-transform duration-300`}>
                <card.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-full flex items-center gap-1 uppercase">
                <ArrowUpRight className="w-3 h-3" />
                Live
              </span>
            </div>
            <p className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">{card.label}</p>
            <h3 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white mt-1">{card.value}</h3>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card rounded-[2rem] p-8 flex flex-col justify-center items-center text-center">
            <div className="bg-blue-500/10 p-6 rounded-full mb-4">
              <Package className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">Today's Paid Orders</h3>
            <p className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">{stats.paidOrders}</p>
          </div>
          <div className="glass-card rounded-[2rem] p-8 flex flex-col justify-center items-center text-center">
            <div className="bg-amber-500/10 p-6 rounded-full mb-4">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">Today's Pending Orders</h3>
            <p className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">{stats.pendingOrders}</p>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-8">
          <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase mb-6">Alerts & Status</h2>
          <div className="space-y-4">
            {stats.lowStockItems > 0 && (
              <button 
                onClick={() => setActiveModal('inventory')}
                className="w-full flex items-start gap-4 p-5 bg-purple-500/10 border border-purple-500/20 rounded-2xl hover:bg-purple-500/20 transition-colors text-left group"
              >
                <div className="bg-purple-500/20 p-3 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                  <AlertCircle className="w-6 h-6 text-purple-600 dark:text-purple-500" />
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-widest text-purple-900 dark:text-purple-400 uppercase">Low Stock Alert</h4>
                  <p className="text-[10px] font-bold text-purple-700 dark:text-purple-500/80 mt-1 uppercase tracking-wider">{stats.lowStockItems} items below minimum.</p>
                </div>
              </button>
            )}
            <button 
              onClick={() => setActiveModal('pending_checkouts')}
              className="w-full flex items-start gap-4 p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl hover:bg-blue-500/20 transition-colors text-left group"
            >
              <div className="bg-blue-500/20 p-3 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-500" />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-widest text-blue-900 dark:text-blue-400 uppercase">Pending Check-outs</h4>
                <p className="text-[10px] font-bold text-blue-700 dark:text-blue-500/80 mt-1 uppercase tracking-wider">{stats.occupiedRooms} guests currently checked in.</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card rounded-[2rem] max-w-2xl w-full p-10 shadow-2xl overflow-y-auto max-h-[80vh] animate-zoom-in">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
                {activeModal.replace('_', ' ')} Details
              </h2>
              <button onClick={() => setActiveModal(null)} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95">
                <X className="w-6 h-6 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {activeModal === 'total' || activeModal === 'occupied' || activeModal === 'available' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rooms
                  .filter(r => activeModal === 'total' || r.status === activeModal)
                  .map((room: any) => (
                    <div key={room.id} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Room {room.number}</span>
                        <span className={cn(
                          "text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest",
                          room.status === 'available' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        )}>
                          {room.status}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">{room.type}</p>
                      {room.guest_name && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">Current Guest</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white mt-1">{room.guest_name}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : activeModal === 'sales' ? (
              <div className="space-y-8">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-5 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <p className="text-[10px] font-black tracking-widest text-blue-600 dark:text-blue-400 uppercase">Restaurant</p>
                    <p className="text-2xl font-black tracking-tighter text-blue-900 dark:text-blue-300 mt-2">{formatCurrency(revenueBreakdown.restaurant)}</p>
                  </div>
                  <div className="p-5 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                    <p className="text-[10px] font-black tracking-widest text-purple-600 dark:text-purple-400 uppercase">Bar</p>
                    <p className="text-2xl font-black tracking-tighter text-purple-900 dark:text-purple-300 mt-2">{formatCurrency(revenueBreakdown.bar)}</p>
                  </div>
                  <div className="p-5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                    <p className="text-[10px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">Rooms</p>
                    <p className="text-2xl font-black tracking-tighter text-indigo-900 dark:text-indigo-300 mt-2">{formatCurrency(revenueBreakdown.rooms)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Recent Daily Totals</h3>
                  {salesData.map((sale: any, i) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div>
                        <p className="font-black text-slate-900 dark:text-white">{sale.date}</p>
                        <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-1">Daily Total</p>
                      </div>
                      <span className="text-xl font-black tracking-tighter text-blue-600 dark:text-blue-400">{formatCurrency(sale.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeModal === 'expenses' ? (
              <div className="space-y-6">
                <div className="p-5 bg-red-500/10 rounded-2xl border border-red-500/20 text-center">
                  <p className="text-[10px] font-black tracking-widest text-red-600 dark:text-red-400 uppercase">Total Expenses Today</p>
                  <p className="text-4xl font-black tracking-tighter text-red-900 dark:text-red-300 mt-2">{formatCurrency(stats.todayExpenses)}</p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Expense Breakdown</h3>
                  <div className="p-10 text-center text-slate-500 dark:text-slate-400 text-sm font-bold">
                    Detailed expense breakdown is available in the Finances tab.
                  </div>
                </div>
              </div>
            ) : activeModal === 'orders' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'Pending', status: 'pending', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
                    { label: 'Fulfilled', status: 'fulfilled', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
                    { label: 'Delivered', status: 'delivered', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
                    { label: 'Paid', status: 'paid', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' }
                  ].map(tab => (
                    <div key={tab.label} className={cn("p-4 rounded-2xl text-center", tab.color)}>
                      <p className="text-[9px] font-black tracking-widest uppercase">{tab.label}</p>
                      <p className="text-2xl font-black tracking-tighter mt-1">
                        {tab.status === 'paid' 
                          ? orders.filter((o: any) => o.payment_status === 'paid').length
                          : orders.filter((o: any) => o.fulfillment_status === tab.status).length
                        }
                      </p>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  {orders.map((order: any) => (
                    <div key={order.id} className="p-5 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500">#{order.id.toString().padStart(5, '0')}</span>
                        <div className="flex gap-2">
                          <span className={cn(
                            "text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest",
                            order.fulfillment_status === 'delivered' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                          )}>
                            {order.fulfillment_status}
                          </span>
                          <span className={cn(
                            "text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest",
                            order.payment_status === 'paid' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                          )}>
                            {order.payment_status}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{order.items_summary}</p>
                      <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 mt-2 uppercase">
                        {order.guest_name ? `${order.guest_name} (Room ${order.room_number})` : 'Walk-in Guest'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeModal === 'inventory' ? (
              <div className="space-y-4">
                {inventory
                  .filter((i: any) => i.stock_quantity <= i.min_stock_level)
                  .map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-5 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                      <div className="flex items-center gap-4">
                        <Package className="w-6 h-6 text-purple-600 dark:text-purple-500" />
                        <div>
                          <p className="font-black text-purple-900 dark:text-purple-400 uppercase tracking-tight">{item.name}</p>
                          <p className="text-[10px] font-bold tracking-widest text-purple-700 dark:text-purple-500/80 mt-1 uppercase">Min: {item.min_stock_level}</p>
                        </div>
                      </div>
                      <span className="text-2xl font-black tracking-tighter text-red-600 dark:text-red-400">{item.stock_quantity}</span>
                    </div>
                  ))}
              </div>
            ) : activeModal === 'pending_checkouts' ? (
              <div className="space-y-4">
                {rooms
                  .filter((r: any) => r.status === 'occupied')
                  .map((room: any) => (
                    <div key={room.id} className="flex items-center justify-between p-5 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-500/20 p-3 rounded-xl">
                          <BedDouble className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-black text-blue-900 dark:text-blue-400 uppercase tracking-tight">Room {room.number}</p>
                          <p className="text-[10px] font-bold tracking-widest text-blue-700 dark:text-blue-500/80 mt-1 uppercase">{room.guest_name}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate('/rooms')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors active:scale-95"
                      >
                        Go to Room
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                {rooms.filter((r: any) => r.status === 'occupied').length === 0 && (
                  <div className="p-10 text-center text-slate-500 dark:text-slate-400 text-sm font-bold">
                    No guests currently checked in.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
