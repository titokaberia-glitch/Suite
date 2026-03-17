import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import { useTheme } from '../hooks/useTheme';

export default function Reports() {
  const [salesData, setSalesData] = useState([]);
  const [detailedSales, setDetailedSales] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [roomData, setRoomData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('sales');
  const { darkMode } = useTheme();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [sales, detailed, inventory, rooms] = await Promise.all([
          api.get('/reports/sales'),
          api.get('/reports/detailed-sales'),
          api.get('/reports/inventory'),
          api.get('/reports/rooms')
        ]);
        setSalesData(sales.reverse());
        setDetailedSales(detailed);
        setInventoryData(inventory);
        setRoomData(rooms);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const exportToExcel = () => {
    let dataToExport = [];
    let fileName = 'report.xlsx';

    if (activeReport === 'sales') {
      dataToExport = detailedSales.map((item: any) => ({
        'Item Name': item.name,
        'Category': item.category,
        'Qty Sold': item.total_quantity,
        'Total Sales': item.total_sales,
        'Total Profit': item.total_profit
      }));
      fileName = 'Sales_Report.xlsx';
    } else if (activeReport === 'inventory') {
      dataToExport = inventoryData.map((item: any) => ({
        'Item Name': item.name,
        'Category': item.category,
        'Current Stock': item.stock_quantity,
        'Min Level': item.min_stock_level,
        'Status': item.stock_quantity <= item.min_stock_level ? 'Low Stock' : 'Healthy'
      }));
      fileName = 'Inventory_Report.xlsx';
    } else if (activeReport === 'rooms') {
      dataToExport = roomData.map((type: any) => ({
        'Room Type': type.type,
        'Total Units': type.count,
        'Occupied': type.occupied_count,
        'Occupancy %': Math.round((type.occupied_count / type.count) * 100)
      }));
      fileName = 'Room_Occupancy_Report.xlsx';
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, fileName);
  };

  const pieData = [
    { name: 'Room Revenue', value: 4500, color: '#10b981' },
    { name: 'Restaurant', value: 2100, color: '#3b82f6' },
    { name: 'Bar', value: 1200, color: '#f59e0b' },
  ];

  const reportTypes = [
    { id: 'sales', label: 'Sales & Revenue', icon: TrendingUp },
    { id: 'inventory', label: 'Inventory Status', icon: BarChart3 },
    { id: 'rooms', label: 'Room Occupancy', icon: PieChartIcon },
  ];

  return (
    <div className="space-y-8 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Reports & Analytics</h1>
          <p className="text-sm font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-2">Analyze your hotel's performance.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToExcel}
            className="btn-ghost px-6 py-3 text-[10px] flex items-center gap-2"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Export Excel
          </button>
          <button className="btn-primary px-6 py-3 text-[10px] flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {reportTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveReport(type.id)}
            className={cn(
              "px-6 py-3 rounded-[2rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap",
              activeReport === type.id 
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl" 
                : "glass-card text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/80"
            )}
          >
            <type.icon className="w-4 h-4" />
            {type.label}
          </button>
        ))}
      </div>

      {activeReport === 'sales' && (
        <div className="space-y-8">
          <div className="glass-card rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
            <div className="p-8 border-b border-slate-200/50 dark:border-slate-800/50">
              <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Detailed Sales & Profit Summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-8 py-5">Item Name</th>
                    <th className="px-8 py-5">Category</th>
                    <th className="px-8 py-5">Qty Sold</th>
                    <th className="px-8 py-5">Total Sales</th>
                    <th className="px-8 py-5">Total Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                  {detailedSales.map((item: any, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-8 py-6 font-black text-slate-900 dark:text-white">{item.name}</td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-500 capitalize">{item.category}</td>
                      <td className="px-8 py-6 font-black text-slate-900 dark:text-white">{item.total_quantity}</td>
                      <td className="px-8 py-6 text-blue-600 dark:text-blue-400 font-black">{formatCurrency(item.total_sales)}</td>
                      <td className="px-8 py-6 text-purple-600 dark:text-purple-400 font-black">{formatCurrency(item.total_profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-8 rounded-[2.5rem]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase flex items-center gap-3">
                  <TrendingUp className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                  Daily Revenue
                </h2>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 700}} />
                    <Tooltip 
                      cursor={{fill: darkMode ? '#0f172a' : '#f8fafc'}}
                      contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#fff', borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                    />
                    <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-8 rounded-[2.5rem]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase flex items-center gap-3">
                  <PieChartIcon className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                  Revenue Distribution
                </h2>
              </div>
              <div className="h-[350px] w-full flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-4 pr-8">
                  {pieData.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{item.name}</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(item.value)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeReport === 'inventory' && (
        <div className="glass-card rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
          <div className="p-8 border-b border-slate-200/50 dark:border-slate-800/50">
            <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Inventory Stock Report</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-8 py-5">Item Name</th>
                  <th className="px-8 py-5">Category</th>
                  <th className="px-8 py-5">Current Stock</th>
                  <th className="px-8 py-5">Min Level</th>
                  <th className="px-8 py-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {inventoryData.map((item: any, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-8 py-6 font-black text-slate-900 dark:text-white">{item.name}</td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-500 capitalize">{item.category}</td>
                    <td className="px-8 py-6 font-black text-slate-900 dark:text-white">{item.stock_quantity}</td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-500">{item.min_stock_level}</td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                        item.stock_quantity <= item.min_stock_level ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      )}>
                        {item.stock_quantity <= item.min_stock_level ? 'Low Stock' : 'Healthy'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === 'rooms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {roomData.map((type: any, i) => (
            <div key={i} className="glass-card p-8 rounded-[2.5rem]">
              <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase mb-6">{type.type} Rooms</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Units</span>
                  <span className="font-black text-slate-900 dark:text-white">{type.count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Occupied</span>
                  <span className="font-black text-blue-600 dark:text-blue-400">{type.occupied_count}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all" 
                    style={{ width: `${(type.occupied_count / type.count) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-right">
                  {Math.round((type.occupied_count / type.count) * 100)}% Occupancy
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeReport === 'sales' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Occupancy Rate', value: '78%', trend: '+5.2%', up: true },
            { label: 'Avg. Daily Rate', value: '$145', trend: '-2.1%', up: false },
            { label: 'RevPAR', value: '$113', trend: '+8.4%', up: true },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-8 rounded-[2.5rem]">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <div className="flex items-end justify-between mt-4">
                <h3 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">{stat.value}</h3>
                <span className={cn(
                  "text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full flex items-center gap-1",
                  stat.up ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
                )}>
                  {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
