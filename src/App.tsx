import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  X,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Search,
  Bell,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from './lib/utils';
import resonateLogo from './assets/logo_bg.png';

// --- Types ---

type WidgetType = 'stats' | 'chart' | 'activity' | 'users';

interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  visible: boolean;
}

// --- Mock Data ---

const CHART_DATA = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 900 },
  { name: 'Jul', value: 1100 },
];

const ACTIVITY_DATA = [
  { id: 1, user: 'Alex Rivera', action: 'completed task', time: '2m ago', icon: <Activity className="w-4 h-4" /> },
  { id: 2, user: 'Sarah Chen', action: 'joined the team', time: '15m ago', icon: <Users className="w-4 h-4" /> },
  { id: 3, user: 'Mike Ross', action: 'uploaded a file', time: '1h ago', icon: <Plus className="w-4 h-4" /> },
  { id: 4, user: 'Jessica Day', action: 'sent a message', time: '3h ago', icon: <MessageSquare className="w-4 h-4" /> },
];

// --- Components ---

const Card = ({ children, className, title, onRemove }: { children: React.ReactNode, className?: string, title?: string, onRemove?: () => void }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col", className)}
  >
    {(title || onRemove) && (
      <div className="px-5 py-4 border-bottom border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
        {onRemove && (
          <button onClick={onRemove} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )}
    <div className="p-5 flex-1">
      {children}
    </div>
  </motion.div>
);

const StatsWidget = ({ label, value, trend, icon: Icon, color }: any) => (
  <Card className="h-full">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
        <div className={cn("flex items-center mt-2 text-xs font-medium", trend >= 0 ? "text-emerald-600" : "text-rose-600")}>
          <TrendingUp className={cn("w-3 h-3 mr-1", trend < 0 && "rotate-180")} />
          {Math.abs(trend)}% from last month
        </div>
      </div>
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </Card>
);

const ChartWidget = () => (
  <Card title="Revenue Growth" className="col-span-full lg:col-span-2 h-[350px]">
    <div className="w-full h-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={CHART_DATA}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#6366f1" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorValue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </Card>
);

const ActivityWidget = () => (
  <Card title="Recent Activity" className="col-span-full lg:col-span-1">
    <div className="space-y-6">
      {ACTIVITY_DATA.map((item) => (
        <div key={item.id} className="flex items-start gap-4">
          <div className="mt-1 p-2 bg-slate-50 rounded-lg text-slate-500">
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-900 leading-none">
              <span className="font-semibold">{item.user}</span> {item.action}
            </p>
            <p className="text-xs text-slate-500 mt-1">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

// --- Main App ---

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [widgets, setWidgets] = useState<WidgetConfig[]>([
    { id: '1', type: 'stats', title: 'Total Revenue', visible: true },
    { id: '2', type: 'stats', title: 'Active Users', visible: true },
    { id: '3', type: 'stats', title: 'New Leads', visible: true },
    { id: '4', type: 'chart', title: 'Revenue Growth', visible: true },
    { id: '5', type: 'activity', title: 'Recent Activity', visible: true },
  ]);

  const toggleWidget = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Dashboard Grid */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <img src={resonateLogo} alt="Resonate Logo" className="w-8 h-8 rounded-lg shadow-lg shadow-indigo-200" />
                  <span className="font-bold text-xl tracking-tight text-indigo-600">Resonate</span>
                </div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                <p className="text-slate-500 mt-2 text-lg">Welcome back to your workspace.</p>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsCustomizing(!isCustomizing)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    isCustomizing 
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" 
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                  )}
                >
                  <Settings className="w-4 h-4" />
                  {isCustomizing ? 'Save Layout' : 'Customize Dashboard'}
                </button>
                {!isChatOpen && (
                  <button 
                    onClick={() => setIsChatOpen(true)}
                    className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {isCustomizing && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 p-6 bg-white rounded-2xl border border-indigo-100 shadow-sm flex flex-wrap gap-3"
              >
                <div className="w-full flex items-center justify-between mb-4">
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Available Widgets</p>
                  <span className="text-[10px] text-slate-400">Click to toggle visibility</span>
                </div>
                {widgets.map(w => (
                  <button
                    key={w.id}
                    onClick={() => toggleWidget(w.id)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border",
                      w.visible 
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                        : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                    )}
                  >
                    {w.visible ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {w.title}
                  </button>
                ))}
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {widgets.filter(w => w.visible).map((w) => {
                  if (w.id === '1') return <StatsWidget key={w.id} label="Revenue" value="$45,231" trend={12} icon={DollarSign} color="bg-indigo-500" />;
                  if (w.id === '2') return <StatsWidget key={w.id} label="Active Users" value="2,345" trend={8} icon={Users} color="bg-emerald-500" />;
                  if (w.id === '3') return <StatsWidget key={w.id} label="New Leads" value="124" trend={-3} icon={TrendingUp} color="bg-amber-500" />;
                  if (w.id === '4') return <ChartWidget key={w.id} />;
                  if (w.id === '5') return <ActivityWidget key={w.id} />;
                  return null;
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Chat Sidebar (Right) */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.aside 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Resonate AI</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex flex-col gap-2">
                <div className="bg-slate-100 rounded-2xl p-4 text-sm text-slate-700 rounded-tl-none max-w-[85%]">
                  Hello! I'm your Resonate assistant. How can I help you with your dashboard today?
                </div>
                <span className="text-[10px] text-slate-400 ml-1">10:11 AM</span>
              </div>

              <div className="flex flex-col gap-2 items-end">
                <div className="bg-indigo-600 rounded-2xl p-4 text-sm text-white rounded-tr-none max-w-[85%] shadow-md shadow-indigo-100">
                  Can you show me the revenue trends for the last quarter?
                </div>
                <span className="text-[10px] text-slate-400 mr-1">10:12 AM</span>
              </div>

              <div className="flex flex-col gap-2">
                <div className="bg-slate-100 rounded-2xl p-4 text-sm text-slate-700 rounded-tl-none max-w-[85%]">
                  Sure! I've updated the "Revenue Growth" chart to show the last 3 months. You can also see the breakdown in the activity feed.
                </div>
                <span className="text-[10px] text-slate-400 ml-1">10:12 AM</span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-3">
                Resonate AI can make mistakes. Check important info.
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Floating Chat Toggle (when closed) */}
      {!isChatOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-30"
        >
          <MessageSquare className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  );
}
