import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  Plus, 
  Search,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Smartphone,
  Banknote,
  Filter,
  Download,
  Printer,
  X,
  ChevronRight,
  FileText
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

export default function Finances() {
  const [summary, setSummary] = useState<any>(null);
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // summary, income, expenses, invoices
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [summaryData, expensesData, incomeData] = await Promise.all([
        api.get('/finances/summary'),
        api.get('/finances/expenses'),
        api.get('/finances/income')
      ]);
      setSummary(summaryData);
      setExpenses(expensesData);
      setIncome(incomeData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.post('/finances/expenses', {
        amount: parseFloat(formData.get('amount') as string),
        category: formData.get('category'),
        description: formData.get('description'),
        method: formData.get('method')
      });
      setShowExpenseModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Finance & Billing</h1>
          <p className="text-sm font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-2">Manage hotel revenue, expenses, and invoices.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowExpenseModal(true)}
            className="btn-primary px-6 py-3 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 glass-card rounded-2xl w-fit">
        {[
          { id: 'summary', label: 'Cashbook Summary' },
          { id: 'income', label: 'Income Activities' },
          { id: 'expenses', label: 'Expenses' },
          { id: 'invoices', label: 'Invoices' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all active:scale-95",
              activeTab === tab.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'summary' && (
        <>
          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-[2.5rem] p-8 border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/20 transition-all" />
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <Banknote className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Available Cash</span>
              </div>
              <h3 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
                {formatCurrency(summary?.balances?.cash || 0)}
              </h3>
            </div>

            <div className="glass-card rounded-[2.5rem] p-8 border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-purple-500/20 transition-all" />
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-purple-500/10 rounded-2xl">
                  <Smartphone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Mpesa Balance</span>
              </div>
              <h3 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
                {formatCurrency(summary?.balances?.mpesa || 0)}
              </h3>
            </div>

            <div className="glass-card rounded-[2.5rem] p-8 border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-500/20 transition-all" />
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-emerald-500/10 rounded-2xl">
                  <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Card / Bank</span>
              </div>
              <h3 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
                {formatCurrency(summary?.balances?.card || 0)}
              </h3>
            </div>
          </div>

          {/* Money In / Out Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card rounded-[3rem] p-8 border border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase flex items-center gap-3">
                  <ArrowUpRight className="w-6 h-6 text-blue-600" />
                  Money In (Revenue)
                </h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10">
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-blue-600 dark:text-blue-400 uppercase">Paid Orders</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {formatCurrency(summary?.orders?.find((o: any) => o.payment_status === 'paid')?.total || 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Unpaid</p>
                    <p className="text-lg font-bold text-slate-500">
                      {formatCurrency(summary?.orders?.find((o: any) => o.payment_status === 'pending')?.total || 0)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-purple-500/5 rounded-3xl border border-purple-500/10">
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-purple-600 dark:text-purple-400 uppercase">Room Revenue</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {formatCurrency(summary?.rooms?.find((r: any) => r.status === 'completed')?.total || 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Active Stays</p>
                    <p className="text-lg font-bold text-slate-500">
                      {formatCurrency(summary?.rooms?.find((r: any) => r.status === 'active')?.total || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-[3rem] p-8 border border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase flex items-center gap-3">
                  <ArrowDownRight className="w-6 h-6 text-red-600" />
                  Money Out (Expenses)
                </h3>
              </div>
              <div className="space-y-6">
                <div className="p-8 bg-red-500/5 rounded-[2.5rem] border border-red-500/10 flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] font-black tracking-widest text-red-600 dark:text-red-400 uppercase mb-2">Total Expenses Incurred</p>
                  <p className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
                    {formatCurrency(summary?.totalExpenses || 0)}
                  </p>
                  <button 
                    onClick={() => setActiveTab('expenses')}
                    className="mt-6 text-[10px] font-black tracking-widest text-slate-500 hover:text-slate-900 uppercase transition-colors"
                  >
                    View Breakdown →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'income' && (
        <div className="glass-card rounded-[3rem] overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
          <div className="p-8 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
            <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Income Activities</h3>
            <div className="flex gap-2">
              <button className="p-3 glass-card rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Source</th>
                  <th className="px-8 py-5">Guest / Ref</th>
                  <th className="px-8 py-5">Method</th>
                  <th className="px-8 py-5">Amount</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {income.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                    <td className="px-8 py-6 text-sm font-bold text-slate-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-full",
                        item.stay_id ? "bg-purple-500/10 text-purple-600" : "bg-blue-500/10 text-blue-600"
                      )}>
                        {item.stay_id ? 'Room Payment' : 'Order Payment'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {item.guest_name || `Order #${item.order_id_ref}`}
                        </span>
                        {item.room_number && (
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Room {item.room_number}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-500">
                      {item.method}
                    </td>
                    <td className="px-8 py-6 text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => setSelectedTransaction(item)}
                        className="p-2 hover:bg-blue-500/10 rounded-xl text-blue-600 transition-all opacity-0 group-hover:opacity-100"
                        title="Print Receipt"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="glass-card rounded-[3rem] overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
          <div className="p-8 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
            <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Expense Log</h3>
            <div className="flex gap-2">
              <button className="p-3 glass-card rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                <Filter className="w-5 h-5" />
              </button>
              <button className="p-3 glass-card rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Category</th>
                  <th className="px-8 py-5">Description</th>
                  <th className="px-8 py-5">Method</th>
                  <th className="px-8 py-5">Amount</th>
                  <th className="px-8 py-5">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {expenses.map((expense: any) => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-8 py-6 text-sm font-bold text-slate-500">
                      {new Date(expense.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-black tracking-widest uppercase rounded-full text-slate-600 dark:text-slate-400">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-slate-900 dark:text-white">
                      {expense.description}
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-500">
                      {expense.method}
                    </td>
                    <td className="px-8 py-6 text-lg font-black text-red-600 dark:text-red-400">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-500">
                      {expense.recorded_by_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="flex flex-col items-center justify-center p-20 glass-card rounded-[3rem] text-center">
          <Receipt className="w-16 h-16 text-slate-200 mb-6" />
          <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Invoices & Billing</h3>
          <p className="text-slate-500 mt-2 max-w-md">Detailed invoice generation and order tracking is available in the Orders and Rooms tabs. This section will soon feature a centralized billing dashboard.</p>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card rounded-[3rem] max-w-md w-full p-10 shadow-2xl animate-zoom-in">
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase mb-8">Record New Expense</h2>
            <form className="space-y-6" onSubmit={handleAddExpense}>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Amount</label>
                <input name="amount" type="number" step="0.01" className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Category</label>
                <select name="category" className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold">
                  <option value="Supplies">Supplies</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Payroll">Payroll</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Payment Method</label>
                <select name="method" className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold">
                  <option value="Cash">Cash</option>
                  <option value="Mpesa">Mpesa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Description</label>
                <textarea name="description" className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold h-24" required />
              </div>
              <div className="flex gap-4 mt-10">
                <button 
                  type="button" 
                  onClick={() => setShowExpenseModal(false)} 
                  className="flex-1 px-6 py-4 glass-card rounded-2xl font-black tracking-widest text-[10px] uppercase text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary py-4 text-[10px]">
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card rounded-[3rem] max-w-md w-full p-12 shadow-2xl animate-zoom-in relative">
            <button onClick={() => setSelectedTransaction(null)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
            
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-600/20">
                <Receipt className="text-white w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Payment Receipt</h2>
              <p className="text-[10px] font-black tracking-widest text-blue-600 dark:text-blue-400 uppercase mt-2">SuiteControl Hotel System</p>
            </div>

            <div className="space-y-6 border-y border-slate-100 dark:border-slate-800 py-8 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">#PAY-{selectedTransaction.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{new Date(selectedTransaction.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guest / Ref</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{selectedTransaction.guest_name || `Order #${selectedTransaction.order_id_ref}`}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{selectedTransaction.method}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-12">
              <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Total Paid</span>
              <span className="text-4xl font-black tracking-tighter text-blue-600 dark:text-blue-400">{formatCurrency(selectedTransaction.amount)}</span>
            </div>

            <button 
              onClick={() => window.print()}
              className="w-full btn-primary py-4 flex items-center justify-center gap-3"
            >
              <Printer className="w-5 h-5" />
              Print Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
