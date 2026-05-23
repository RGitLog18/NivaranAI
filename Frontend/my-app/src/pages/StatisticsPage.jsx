import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui2/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui2/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

const COLORS = ['#3b82f6', '#eab308', '#22c55e', '#ef4444'];

export default function StatisticsPage() {
  const { user } = useAuth();
  console.log("Current Auth User:", user); // Check if 'ward' exists here
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Unified fetcher for the selected period
  const fetchStats = async (period) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const ward = user?.ward || "Dombivli East";

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/admin/executive-summary`, {
        params: { ward, period },
        headers: { Authorization: `Bearer ${token}` }
      });

      setData(res.data.summary);
    } catch (err) {
      console.error("Operational Analytics Sync Failed", err);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  // Trigger fetch when tab changes or component mounts
  useEffect(() => {
    const loadData = async () => {
    if (user) {
      if (user.ward) {
        await fetchStats(activeTab);
      } else {
        setLoading(false);
      }
    }
  };
  
  loadData();
}, [activeTab, user]); // Run when tab changes OR when user profile loads

  // Data mapping for Recharts
  const getChartData = () => [
    { name: 'Total', value: data?.total || 0, fill: '#3b82f6' },
    { name: 'Pending', value: data?.pending || 0, fill: '#eab308' },
    { name: 'Resolved', value: data?.resolved || 0, fill: '#22c55e' },
    { name: 'Rejected', value: data?.rejected || 0, fill: '#ef4444' },
  ];

  const getPieData = () => [
    { name: 'Pending', value: data?.pending || 0, color: '#eab308' },
    { name: 'Resolved', value: data?.resolved || 0, color: '#22c55e' },
    { name: 'Rejected', value: data?.rejected || 0, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // 3. LOGIC FOR EARLY RETURN
  if (isInitialLoad && !data) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        <p className="text-emerald-800 font-bold">Initializing Analytics...</p>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <Card className={`border-l-4 ${color} bg-white shadow-sm`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1 font-bold uppercase tracking-tighter">{title}</p>
            <p className="text-3xl font-black text-slate-800">{value ?? 0}</p>
            <p className="text-[10px] text-muted-foreground mt-1 capitalize">{subtext}</p>
          </div>
          <Icon className="h-10 w-10 opacity-20 text-slate-900" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Sovereign Statistics</h2>
          <p className="text-slate-500 font-medium">
            Real-time administrative pulse for <strong>{user?.ward}</strong>
          </p>
        </div>

        <Tabs defaultValue="daily" onValueChange={(val) => setActiveTab(val)} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-white/50 border border-slate-200 rounded-xl p-1">
            <TabsTrigger value="daily" className="rounded-lg font-bold">Daily</TabsTrigger>
            <TabsTrigger value="weekly" className="rounded-lg font-bold">Weekly</TabsTrigger>
            <TabsTrigger value="yearly" className="rounded-lg font-bold">Yearly</TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
              <p className="text-emerald-800 font-bold uppercase text-xs tracking-widest">Recalculating Sorting Data...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Total Complaints" value={data?.total} icon={Calendar} color="border-l-blue-500" subtext={`Period: ${activeTab}`} />
                <StatCard title="Pending" value={data?.pending} icon={Clock} color="border-l-yellow-500" subtext="Awaiting Action" />
                <StatCard title="Resolved" value={data?.resolved} icon={CheckCircle} color="border-l-green-500" subtext="Fixed by Agents" />
                <StatCard title="Rejected" value={data?.rejected} icon={XCircle} color="border-l-red-500" subtext="Not Actionable" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm rounded-3xl overflow-hidden">
                  <CardHeader><CardTitle className="text-lg font-bold">Performance Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm rounded-3xl overflow-hidden">
                  <CardHeader><CardTitle className="text-lg font-bold">Status Distribution (%)</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getPieData()}
                          cx="50%" cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {getPieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}