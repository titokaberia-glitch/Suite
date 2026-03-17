import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit2, 
  DollarSign, 
  History, 
  CheckCircle2, 
  Printer,
  X,
  Plus,
  Minus,
  Briefcase,
  FileText,
  Settings as SettingsIcon,
  ChevronRight
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [payItemTypes, setPayItemTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('staff'); // staff, payroll, setup
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  
  // Form state for pay items in add/edit staff
  const [selectedPayItems, setSelectedPayItems] = useState<{itemId: number, amount: number}[]>([]);

  const fetchData = async () => {
    try {
      const [staffData, payrollData, typesData] = await Promise.all([
        api.get('/staff'),
        api.get('/payroll'),
        api.get('/staff/pay-item-types')
      ]);
      setStaff(staffData);
      setPayroll(payrollData);
      setPayItemTypes(typesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editingStaff) {
      setSelectedPayItems(editingStaff.payItems.map((pi: any) => ({ itemId: pi.item_id, amount: pi.amount })));
    } else {
      setSelectedPayItems([]);
    }
  }, [editingStaff]);

  const handleAddStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      username: formData.get('username'),
      password: formData.get('password') || 'staff123',
      name: formData.get('name'),
      role: formData.get('role'),
      salary: parseFloat(formData.get('salary') as string),
      payItems: selectedPayItems
    };

    try {
      if (editingStaff) {
        await api.patch(`/staff/${editingStaff.id}`, payload);
      } else {
        await api.post('/staff', payload);
      }
      setShowAddModal(false);
      setEditingStaff(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await api.delete(`/staff/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunPayroll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.post('/payroll/run', {
        month: parseInt(formData.get('month') as string),
        year: parseInt(formData.get('year') as string)
      });
      setShowPayrollModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApprovePayroll = async (id: number) => {
    try {
      await api.patch(`/payroll/${id}/approve`, {});
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPayItemType = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      await api.post('/staff/pay-item-types', {
        name: formData.get('name'),
        type: formData.get('type')
      });
      form.reset();
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
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Staff & Payroll</h1>
          <p className="text-sm font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-2">Manage your team and run monthly payroll.</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'staff' && (
            <button 
              onClick={() => { setEditingStaff(null); setShowAddModal(true); }}
              className="btn-primary px-6 py-3 flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Add Staff
            </button>
          )}
          {activeTab === 'payroll' && (
            <button 
              onClick={() => setShowPayrollModal(true)}
              className="btn-primary px-6 py-3 flex items-center gap-2"
            >
              <History className="w-5 h-5" />
              Run Payroll
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 glass-card rounded-2xl w-fit">
        {[
          { id: 'staff', label: 'Staff Management' },
          { id: 'payroll', label: 'Master Payroll' },
          { id: 'setup', label: 'Pay Items Setup' }
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

      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {staff.map((member: any) => (
            <div key={member.id} className="glass-card rounded-[2.5rem] p-8 border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden group">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
                  <Users className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setEditingStaff(member); setShowAddModal(true); }}
                    className="p-2 hover:bg-blue-500/10 rounded-xl text-blue-600 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteStaff(member.id)}
                    className="p-2 hover:bg-red-500/10 rounded-xl text-red-600 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">{member.name}</h3>
              <p className="text-[10px] font-black tracking-widest text-blue-600 dark:text-blue-400 uppercase mt-1">{member.role}</p>
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Basic Salary</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-1">{formatCurrency(member.salary)}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Net Pay Approx</p>
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatCurrency(
                      member.salary + 
                      member.payItems.reduce((acc: number, pi: any) => pi.type === 'allowance' ? acc + pi.amount : acc - pi.amount, 0)
                    )}
                  </p>
                </div>
              </div>

              {member.payItems.length > 0 && (
                <div className="mt-6 space-y-2">
                  <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Pay Items</p>
                  <div className="flex flex-wrap gap-2">
                    {member.payItems.map((pi: any, idx: number) => (
                      <span key={idx} className={cn(
                        "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                        pi.type === 'allowance' ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                      )}>
                        {pi.name}: {formatCurrency(pi.amount)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="space-y-8">
          {/* Group payroll by month/year */}
          {Object.entries(
            payroll.reduce((acc: any, p: any) => {
              const key = `${p.period_month}-${p.period_year}`;
              if (!acc[key]) acc[key] = [];
              acc[key].push(p);
              return acc;
            }, {})
          ).sort((a: any, b: any) => {
            const [mA, yA] = a[0].split('-').map(Number);
            const [mB, yB] = b[0].split('-').map(Number);
            return yB - yA || mB - mA;
          }).map(([key, records]: [string, any]) => {
            const [month, year] = key.split('-').map(Number);
            const monthName = new Date(0, month - 1).toLocaleString('default', { month: 'long' });
            const totalNet = records.reduce((sum: number, r: any) => sum + r.net_pay, 0);
            
            return (
              <div key={key} className="glass-card rounded-[3rem] overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
                <div className="p-8 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between bg-white/30 dark:bg-slate-900/30">
                  <div>
                    <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">{monthName} {year} Payroll</h3>
                    <p className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-1">
                      {records.length} Staff Members • Total Payout: {formatCurrency(totalNet)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={async () => {
                        if(window.confirm(`Are you sure you want to delete the payroll for ${monthName} ${year}? This action cannot be undone.`)) {
                          try {
                            await api.delete(`/payroll/${month}/${year}`);
                            alert('Payroll run deleted successfully');
                            fetchData();
                          } catch(err: any) {
                            alert(err.message || 'Failed to delete payroll run');
                          }
                        }
                      }}
                      className="p-3 glass-card rounded-xl text-red-400 hover:text-red-600 hover:bg-red-500/10 transition-all"
                      title="Delete Payroll Run"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="p-3 glass-card rounded-xl text-slate-400 hover:text-slate-900 transition-all"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <th className="px-8 py-5">Staff Name</th>
                        <th className="px-8 py-5">Basic Salary</th>
                        <th className="px-8 py-5">Allowances</th>
                        <th className="px-8 py-5">Deductions</th>
                        <th className="px-8 py-5">Net Pay</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                      {records.map((record: any) => (
                        <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="px-8 py-6">
                            <p className="text-sm font-black text-slate-900 dark:text-white">{record.staff_name}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{record.staff_role}</p>
                          </td>
                          <td className="px-8 py-6 text-sm font-bold text-slate-500">{formatCurrency(record.basic_salary)}</td>
                          <td className="px-8 py-6 text-sm font-black text-emerald-600">+{formatCurrency(record.allowances)}</td>
                          <td className="px-8 py-6 text-sm font-black text-red-600">-{formatCurrency(record.deductions)}</td>
                          <td className="px-8 py-6 text-lg font-black text-blue-600 dark:text-blue-400">{formatCurrency(record.net_pay)}</td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase",
                              record.status === 'approved' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                            )}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2">
                              {record.status === 'pending' && (
                                <button 
                                  onClick={() => handleApprovePayroll(record.id)}
                                  className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                                  title="Approve"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}
                              <button 
                                onClick={async () => {
                                  if(window.confirm('Are you sure you want to delete this specific payroll record?')) {
                                    try {
                                      await api.delete(`/payroll/record/${record.id}`);
                                      fetchData();
                                    } catch(err: any) {
                                      alert(err.message || 'Failed to delete record');
                                    }
                                  }
                                }}
                                className="p-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                title="Delete Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setSelectedPayslip(record)}
                                className="p-2 bg-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                                title="View Payslip"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          
          {payroll.length === 0 && (
            <div className="flex flex-col items-center justify-center p-20 glass-card rounded-[3rem] text-center">
              <History className="w-16 h-16 text-slate-200 mb-6" />
              <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">No Payroll History</h3>
              <p className="text-slate-500 mt-2 max-w-md">You haven't run any payroll yet. Click the "Run Payroll" button to generate records for the current month.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-8 rounded-[2.5rem]">
            <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase mb-8">Add Pay Item Type</h2>
            <form onSubmit={handleAddPayItemType} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Item Name (e.g. NHIF, Bonus)</label>
                <input name="name" type="text" className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Type</label>
                <select name="type" className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold">
                  <option value="allowance">Allowance</option>
                  <option value="deduction">Deduction</option>
                </select>
              </div>
              <button type="submit" className="btn-primary w-full py-4 text-[10px]">Create Pay Item Type</button>
            </form>
          </div>

          <div className="glass-card p-8 rounded-[2.5rem]">
            <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase mb-8">Existing Pay Items</h2>
            <div className="space-y-4">
              {payItemTypes.map((type: any) => (
                <div key={type.id} className="flex items-center justify-between p-5 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{type.name}</p>
                    <p className={cn(
                      "text-[9px] font-black uppercase tracking-widest mt-1",
                      type.type === 'allowance' ? "text-emerald-600" : "text-red-600"
                    )}>{type.type}</p>
                  </div>
                  <button 
                    onClick={async () => {
                      if(window.confirm('Are you sure you want to delete this pay item type? This will also remove it from all staff members.')) {
                        try {
                          await api.delete(`/staff/pay-item-types/${type.id}`);
                          alert('Pay item type deleted successfully');
                          fetchData();
                        } catch(err: any) {
                          alert(err.message || 'Failed to delete pay item type');
                        }
                      }
                    }}
                    className="p-2 hover:bg-red-500/10 text-red-600 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card rounded-[3rem] max-w-4xl w-full p-10 shadow-2xl animate-zoom-in overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase mb-8">{editingStaff ? 'Edit' : 'Add'} Staff Member</h2>
            <form className="space-y-8" onSubmit={handleAddStaff}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black tracking-widest text-blue-600 uppercase border-b border-blue-600/20 pb-2">Basic Information</h3>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Full Name</label>
                    <input name="name" type="text" defaultValue={editingStaff?.name} className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold" required />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Username</label>
                    <input name="username" type="text" defaultValue={editingStaff?.username} className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold" required />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Role</label>
                    <select name="role" defaultValue={editingStaff?.role || 'waiter'} className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold">
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="waiter">Waiter</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Basic Salary</label>
                    <input name="salary" type="number" defaultValue={editingStaff?.salary || 0} className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold" required />
                  </div>
                  {!editingStaff && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Password</label>
                      <input name="password" type="password" placeholder="Default: staff123" className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold" />
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-black tracking-widest text-purple-600 uppercase border-b border-purple-600/20 pb-2">Allowances & Deductions</h3>
                  <div className="space-y-4">
                    {payItemTypes.map((type: any) => {
                      const existing = selectedPayItems.find(pi => pi.itemId === type.id);
                      return (
                        <div key={type.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                          <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{type.name}</p>
                            <p className={cn(
                              "text-[8px] font-black uppercase tracking-widest",
                              type.type === 'allowance' ? "text-emerald-600" : "text-red-600"
                            )}>{type.type}</p>
                          </div>
                          <input 
                            type="number" 
                            placeholder="Amount"
                            defaultValue={existing?.amount || 0}
                            onChange={(e) => {
                              const amount = parseFloat(e.target.value) || 0;
                              setSelectedPayItems(prev => {
                                const filtered = prev.filter(p => p.itemId !== type.id);
                                if (amount > 0) {
                                  return [...filtered, { itemId: type.id, amount }];
                                }
                                return filtered;
                              });
                            }}
                            className="w-32 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-bold"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button 
                  type="button" 
                  onClick={() => { setShowAddModal(false); setEditingStaff(null); }} 
                  className="flex-1 px-6 py-4 glass-card rounded-2xl font-black tracking-widest text-[10px] uppercase text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary py-4 text-[10px]">
                  {editingStaff ? 'Update Staff' : 'Save Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Run Payroll Modal */}
      {showPayrollModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card rounded-[3rem] max-w-md w-full p-10 shadow-2xl animate-zoom-in">
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase mb-8">Run Monthly Payroll</h2>
            <form className="space-y-6" onSubmit={handleRunPayroll}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Month</label>
                  <select name="month" defaultValue={new Date().getMonth() + 1} className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold">
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">Year</label>
                  <select name="year" defaultValue={new Date().getFullYear()} className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-bold">
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-500 text-center px-4">This will generate payroll records for all currently active staff members based on their configured salary and pay items.</p>
              <div className="flex gap-4 mt-10">
                <button 
                  type="button" 
                  onClick={() => setShowPayrollModal(false)} 
                  className="flex-1 px-6 py-4 glass-card rounded-2xl font-black tracking-widest text-[10px] uppercase text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary py-4 text-[10px]">
                  Generate Payroll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card rounded-[3rem] max-w-2xl w-full p-12 shadow-2xl animate-zoom-in relative">
            <button onClick={() => setSelectedPayslip(null)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
            
            <div className="flex items-center gap-4 mb-12">
              <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <FileText className="text-white w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Payslip</h2>
                <p className="text-[10px] font-black tracking-widest text-blue-600 dark:text-blue-400 uppercase">SuiteControl Hotel System</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-12">
              <div>
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Employee Details</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{selectedPayslip.staff_name}</p>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">{selectedPayslip.staff_role}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Pay Period</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{new Date(0, selectedPayslip.period_month - 1).toLocaleString('default', { month: 'long' })} {selectedPayslip.period_year}</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-b border-slate-200/50 dark:border-slate-800/50 py-8 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Basic Salary</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(selectedPayslip.basic_salary)}</span>
              </div>
              
              {/* Breakdown of items */}
              {selectedPayslip.breakdown && JSON.parse(selectedPayslip.breakdown).map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center pl-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.name}</span>
                  <span className={cn(
                    "text-sm font-black",
                    item.type === 'allowance' ? "text-emerald-600" : "text-red-600"
                  )}>
                    {item.type === 'allowance' ? '+' : '-'}{formatCurrency(item.amount)}
                  </span>
                </div>
              ))}

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Allowances</span>
                <span className="text-lg font-black text-emerald-600">+{formatCurrency(selectedPayslip.allowances)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Deductions</span>
                <span className="text-lg font-black text-red-600">-{formatCurrency(selectedPayslip.deductions)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-12">
              <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Net Pay</span>
              <span className="text-4xl font-black tracking-tighter text-blue-600 dark:text-blue-400">{formatCurrency(selectedPayslip.net_pay)}</span>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => window.print()}
                className="flex-1 btn-primary py-4 flex items-center justify-center gap-3"
              >
                <Printer className="w-5 h-5" />
                Print Payslip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
