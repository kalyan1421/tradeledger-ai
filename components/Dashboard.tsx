import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  IndianRupee,
  Calendar,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { subscribeToSummaries, auth } from '../services/firebase.ts';

const COLORS = ['#Eab308', '#A1A1AA', '#52525B', '#27272A'];

const Dashboard: React.FC = () => {
  const [contractNotes, setContractNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Subscribe to Firestore updates for real-time data
    const unsubscribe = subscribeToSummaries(auth.currentUser.uid, (notes) => {
      setContractNotes(notes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Compute Aggregates from Real Data
  const totalNetPnL = contractNotes.reduce((sum, n) => sum + (n.net_pnl || 0), 0);
  const totalGrossPnL = contractNotes.reduce((sum, n) => sum + (n.gross_pnl || 0), 0);
  const totalCharges = contractNotes.reduce((sum, n) => sum + (n.total_charges || 0), 0);
  const totalTrades = contractNotes.reduce((sum, n) => sum + (n.trade_count || 0), 0);
  
  // Fake Win Rate logic (since we only stored summaries in this simplified view, in a full app we query trades)
  // We'll estimate wins/losses based on net_pnl of the daily note for this demo visualization
  const winningDays = contractNotes.filter(n => n.net_pnl > 0).length;
  const losingDays = contractNotes.filter(n => n.net_pnl <= 0).length;
  const winRate = contractNotes.length > 0 ? Math.round((winningDays / contractNotes.length) * 100) : 0;

  // Prepare Chart Data
  const dataEquity = contractNotes
    .sort((a, b) => (a.uploadDate?.seconds || 0) - (b.uploadDate?.seconds || 0))
    .map((note, idx) => {
       // Accumulate P&L for equity curve
       return {
         name: new Date(note.uploadDate?.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
         pnl: note.net_pnl,
         equity: 0 // We will calculate running total in map if needed, but for simple chart:
       };
    });
  
  // Calculate running equity
  let runningEquity = 100000; // Starting Capital Base
  const equityCurve = dataEquity.map(d => {
    runningEquity += d.pnl;
    return { ...d, equity: runningEquity };
  });

  const dataCost = [
    { name: 'Total Charges', value: totalCharges },
    { name: 'Taxes (Est)', value: totalCharges * 0.4 }, // Rough estimate for viz
    { name: 'Brokerage (Est)', value: totalCharges * 0.6 }
  ];

  if (loading) {
    return <div className="flex h-full items-center justify-center text-primary"><Loader2 className="animate-spin" size={32}/></div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold text-textMain">Analytics Overview</h1>
          <p className="text-sm text-textMuted flex items-center gap-2 mt-1">
            <Calendar size={14} /> Real-time Data
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
           <button className="p-2 rounded-full bg-surfaceHighlight hover:bg-border text-textMain transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
          </button>
          <button className="flex items-center gap-2 bg-primary text-background px-4 py-2 rounded-lg font-semibold hover:bg-primaryHover transition-colors text-sm">
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {contractNotes.length === 0 ? (
        <div className="text-center py-20 text-textMuted border border-dashed border-border rounded-xl">
           <h3 className="text-lg font-medium">No Data Available</h3>
           <p className="mb-4">Upload a contract note to see analytics.</p>
        </div>
      ) : (
        <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Win Rate */}
        <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-medium text-textMuted">Win Rate (Days)</h3>
              <p className="text-xs text-textMuted mt-1">Based on uploaded notes</p>
            </div>
            <div className="p-2 bg-surfaceHighlight rounded-full text-primary">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#2A2A2A" strokeWidth="8" fill="transparent" />
                  <circle cx="48" cy="48" r="40" stroke="#Eab308" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * winRate) / 100} strokeLinecap="round" />
                </svg>
                <span className="absolute text-xl font-bold text-textMain">{winRate}%</span>
             </div>
             <div className="space-y-2">
                <div className="flex justify-between w-24 text-sm">
                  <span className="text-green-500">Winners</span>
                  <span className="font-mono font-bold">{winningDays}</span>
                </div>
                <div className="flex justify-between w-24 text-sm">
                  <span className="text-red-500">Losers</span>
                  <span className="font-mono font-bold">{losingDays}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Risk Reward - Static for MVP as trade level data aggregations are complex */}
        <div className="bg-surface border border-border rounded-xl p-5">
           <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-medium text-textMuted">Profit Factor</h3>
              <p className="text-xs text-textMuted mt-1">Gross P&L / Charges</p>
            </div>
            <div className="p-2 bg-surfaceHighlight rounded-full text-primary">
              <Scale size={18} />
            </div>
          </div>
          <div className="flex items-end gap-2 mt-4">
            <span className="text-4xl font-mono font-bold text-textMain">
               {totalCharges > 0 ? (totalGrossPnL / totalCharges).toFixed(2) : "0.00"}
            </span>
          </div>
          <div className="w-full bg-surfaceHighlight h-2 rounded-full mt-4 overflow-hidden flex">
             <div className="bg-primary w-full h-full" style={{ width: `${Math.min(100, (totalNetPnL / totalGrossPnL) * 100)}%` }}></div>
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-textMuted uppercase font-mono">
            <span>Retained Profit</span>
            <span>{totalGrossPnL > 0 ? ((totalNetPnL/totalGrossPnL)*100).toFixed(1) : 0}%</span>
          </div>
        </div>

        {/* Net P&L */}
        <div className="bg-surface border border-border rounded-xl p-5">
           <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-medium text-textMuted">Net Realized P&L</h3>
              <p className="text-xs text-textMuted mt-1">Total</p>
            </div>
            <div className="p-2 bg-surfaceHighlight rounded-full text-primary">
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-4xl font-mono font-bold tracking-tighter ${totalNetPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
               ₹{totalNetPnL.toLocaleString()}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
             <span className="text-xs text-textMuted">Total Charges Paid</span>
             <span className="text-sm font-mono text-textMain">₹{totalCharges.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
        {/* Equity Curve */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 flex flex-col">
           <div className="flex justify-between items-center mb-6">
             <div>
               <h2 className="text-lg font-bold text-textMain">Equity Curve</h2>
             </div>
           </div>
           
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={equityCurve}>
                 <defs>
                   <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#Eab308" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#Eab308" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#52525B', fontSize: 10}} />
                 <YAxis hide domain={['auto', 'auto']} />
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#2A2A2A', borderRadius: '8px' }}
                    itemStyle={{ color: '#EDEDED' }}
                 />
                 <Area type="monotone" dataKey="equity" stroke="#Eab308" strokeWidth={2} fillOpacity={1} fill="url(#colorEquity)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Cost Analysis */}
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col">
            <h2 className="text-lg font-bold text-textMain mb-6 flex items-center gap-2">
              <TrendingDown size={18} className="text-primary" /> Cost Analysis
            </h2>
            <div className="flex-1 relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={dataCost}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dataCost.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#2A2A2A', borderRadius: '8px' }}
                       itemStyle={{ color: '#EDEDED' }}
                    />
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                 <div className="text-[10px] text-textMuted uppercase">Charges</div>
                 <div className="text-lg font-mono font-bold text-textMain">₹{totalCharges.toLocaleString()}</div>
               </div>
            </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default Dashboard;