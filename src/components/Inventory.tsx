import { useState, useEffect, FormEvent } from 'react';
import { api } from '../services/api';
import { 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  ArrowUp, 
  ArrowDown,
  MoreVertical,
  Edit2,
  History,
  ChefHat,
  ArrowRightLeft,
  X
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showKitchenModal, setShowKitchenModal] = useState(false);
  const [kitchenItems, setKitchenItems] = useState([]);
  const [kitchenMovements, setKitchenMovements] = useState([]);
  const [showAddKitchenItem, setShowAddKitchenItem] = useState(false);
  const [showKitchenMovement, setShowKitchenMovement] = useState(false);
  const [selectedKitchenItem, setSelectedKitchenItem] = useState<any>(null);

  const fetchInventory = async () => {
    try {
      const data = await api.get('/inventory');
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchKitchenData = async () => {
    try {
      const [items, movements] = await Promise.all([
        api.get('/kitchen/inventory'),
        api.get('/kitchen/movements')
      ]);
      setKitchenItems(items);
      setKitchenMovements(movements);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredItems = items.filter((i: any) => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      cost_price: parseFloat(formData.get('cost') as string),
      selling_price: parseFloat(formData.get('selling') as string),
      stock_quantity: parseInt(formData.get('stock') as string),
      min_stock_level: parseInt(formData.get('min') as string)
    };

    try {
      if (editingItem) {
        await api.patch(`/inventory/${editingItem.id}`, payload);
      } else {
        await api.post('/inventory', payload);
      }
      setShowAddModal(false);
      setEditingItem(null);
      fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Inventory</h1>
          <p className="text-sm font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-2">Track stock levels and manage items.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setShowKitchenModal(true); fetchKitchenData(); }}
            className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold text-xs uppercase tracking-widest"
          >
            <ChefHat className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Kitchen Inventory
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary px-4 py-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-[2rem] p-6 border border-slate-200/50 dark:border-slate-800/50">
          <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Total Items</p>
          <h3 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white mt-2">{items.length}</h3>
        </div>
        <div className="glass-card rounded-[2rem] p-6 border border-slate-200/50 dark:border-slate-800/50">
          <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Low Stock Items</p>
          <h3 className="text-3xl font-black tracking-tighter text-purple-600 dark:text-purple-400 mt-2">
            {items.filter(i => i.stock_quantity <= i.min_stock_level).length}
          </h3>
        </div>
        <div className="glass-card rounded-[2rem] p-6 border border-slate-200/50 dark:border-slate-800/50">
          <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Inventory Value</p>
          <h3 className="text-3xl font-black tracking-tighter text-blue-600 dark:text-blue-400 mt-2">
            {formatCurrency(items.reduce((sum, i) => sum + (i.cost_price * i.stock_quantity), 0))}
          </h3>
        </div>
      </div>

      <div className="glass-card rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search inventory..." 
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
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Cost</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      </div>
                      <span className="font-black text-slate-900 dark:text-white">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">{item.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-slate-900 dark:text-white">{item.stock_quantity}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{formatCurrency(item.cost_price)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400">{formatCurrency(item.selling_price)}</span>
                  </td>
                  <td className="px-6 py-4">
                    {item.stock_quantity <= item.min_stock_level ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black tracking-widest uppercase rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black tracking-widest uppercase rounded-full">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setEditingItem(item);
                          setShowAddModal(true);
                        }}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all">
                        <History className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card rounded-[2rem] max-w-md w-full p-10 shadow-2xl animate-zoom-in">
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase mb-8">{editingItem ? 'Edit' : 'Add'} Inventory Item</h2>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Item Name</label>
                <input name="name" type="text" defaultValue={editingItem?.name} className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Category</label>
                  <select name="category" defaultValue={editingItem?.category || 'food'} className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium">
                    <option value="food">Food</option>
                    <option value="drink">Drink</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Stock Quantity</label>
                  <input name="stock" type="number" defaultValue={editingItem?.stock_quantity} className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Cost Price</label>
                  <input name="cost" type="number" step="0.01" defaultValue={editingItem?.cost_price} className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium" required />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Selling Price</label>
                  <input name="selling" type="number" step="0.01" defaultValue={editingItem?.selling_price} className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Min Stock Level</label>
                <input name="min" type="number" defaultValue={editingItem?.min_stock_level || 5} className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium" required />
              </div>
              <div className="flex gap-4 mt-10">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                  }} 
                  className="flex-1 px-6 py-4 glass-card rounded-2xl font-black tracking-widest text-[10px] uppercase text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary py-4 text-[10px]">
                  {editingItem ? 'Update' : 'Save'} Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Kitchen Inventory Modal */}
      {showKitchenModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card rounded-[3rem] max-w-5xl w-full p-10 shadow-2xl overflow-y-auto max-h-[90vh] animate-zoom-in">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase flex items-center gap-3">
                  <ChefHat className="w-10 h-10 text-blue-600" />
                  Kitchen Inventory
                </h2>
                <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-2">Track supplies and consumption.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAddKitchenItem(true)}
                  className="btn-primary px-6 py-3 text-[10px] flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Supply
                </button>
                <button onClick={() => setShowKitchenModal(false)} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95">
                  <X className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-card rounded-[2rem] overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <th className="px-8 py-5">Item</th>
                        <th className="px-8 py-5">Stock</th>
                        <th className="px-8 py-5">Min</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                      {kitchenItems.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="px-8 py-6">
                            <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Unit: {item.unit}</p>
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "text-xl font-black tracking-tighter",
                              item.current_stock <= item.min_stock_level ? "text-red-600" : "text-blue-600 dark:text-blue-400"
                            )}>{item.current_stock}</span>
                          </td>
                          <td className="px-8 py-6 text-sm font-bold text-slate-500">{item.min_stock_level}</td>
                          <td className="px-8 py-6 text-right">
                            <button 
                              onClick={() => { setSelectedKitchenItem(item); setShowKitchenMovement(true); }}
                              className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              Record Movement
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Recent Movements
                </h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                  {kitchenMovements.map((m: any) => (
                    <div key={m.id} className="p-5 glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className={cn(
                          "text-[9px] font-black uppercase px-2 py-1 rounded-full tracking-widest",
                          m.type === 'in' ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                        )}>
                          {m.type === 'in' ? 'Stock In' : 'Consumption'}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(m.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{m.item_name}</p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">{m.quantity} {m.unit} • {m.reason}</p>
                      <p className="text-[9px] text-slate-400 mt-3 font-black uppercase tracking-widest">By {m.staff_name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Kitchen Item Modal */}
      {showAddKitchenItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="glass-card rounded-[2.5rem] max-w-md w-full p-10 shadow-2xl animate-zoom-in">
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase mb-8">Add Kitchen Supply</h2>
            <form className="space-y-5" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              await api.post('/kitchen/inventory', {
                name: formData.get('name'),
                unit: formData.get('unit'),
                initialStock: parseFloat(formData.get('initialStock') as string) || 0,
                min_stock_level: parseInt(formData.get('min') as string)
              });
              setShowAddKitchenItem(false);
              fetchKitchenData();
            }}>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Item Name</label>
                <input name="name" type="text" className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Unit (e.g. kg, L, Pcs)</label>
                <input name="unit" type="text" className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Initial Stock</label>
                  <input name="initialStock" type="number" step="0.01" defaultValue="0" className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium" required />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Min Level</label>
                  <input name="min" type="number" defaultValue="5" className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium" required />
                </div>
              </div>
              <div className="flex gap-4 mt-10">
                <button type="button" onClick={() => setShowAddKitchenItem(false)} className="flex-1 px-6 py-4 glass-card rounded-2xl font-black tracking-widest text-[10px] uppercase text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 active:scale-95 transition-all">Cancel</button>
                <button type="submit" className="flex-1 btn-primary py-4 text-[10px]">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kitchen Movement Modal */}
      {showKitchenMovement && selectedKitchenItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="glass-card rounded-[2.5rem] max-w-md w-full p-10 shadow-2xl animate-zoom-in">
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase mb-2">Record Movement</h2>
            <p className="text-[10px] font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase mb-8">{selectedKitchenItem.name} ({selectedKitchenItem.unit})</p>
            <form className="space-y-5" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              await api.post('/kitchen/movements', {
                itemId: selectedKitchenItem.id,
                type: formData.get('type'),
                quantity: parseFloat(formData.get('quantity') as string),
                reason: formData.get('reason')
              });
              setShowKitchenMovement(false);
              fetchKitchenData();
            }}>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Movement Type</label>
                <select name="type" className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium">
                  <option value="in">Stock In (Purchase)</option>
                  <option value="out">Consumption (Used in Kitchen)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Quantity</label>
                <input name="quantity" type="number" step="0.01" className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Reason / Notes</label>
                <input name="reason" type="text" placeholder="e.g. Weekly purchase, Dinner service" className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-medium" required />
              </div>
              <div className="flex gap-4 mt-10">
                <button type="button" onClick={() => setShowKitchenMovement(false)} className="flex-1 px-6 py-4 glass-card rounded-2xl font-black tracking-widest text-[10px] uppercase text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 active:scale-95 transition-all">Cancel</button>
                <button type="submit" className="flex-1 btn-primary py-4 text-[10px]">Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
