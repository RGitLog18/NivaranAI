import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Zap, Clock, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function MyPerformance() {
    const { user } = useAuth();
    const [perfData, setPerfData] = useState(null);

    const fetchPerformance = async () => {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://127.0.0.1:8000/api/v1/desk/my-performance-stats`, {
            params: { ward: user.ward, domain: user.admin_domain },
            headers: { Authorization: `Bearer ${token}` }
        });
        setPerfData(res.data);
    };

    useEffect(() => { if (user) fetchPerformance(); }, [user]);

    if (!perfData) return <div className="loader">Analyzing your administrative track record...</div>;

    const data = [
        { name: 'On Time', value: perfData.sla_percentage },
        { name: 'Delayed', value: 100 - perfData.sla_percentage },
    ];
    const COLORS = ['#10B981', '#F43F5E'];

    return (
        <div className="performance-root p-8 bg-[#FDFDFD] min-h-screen font-sans">
            <header className="mb-12">
                <h1 className="text-3xl font-black">Officer Performance Report</h1>
                <p className="text-slate-400">Personal velocity and audit metrics for <strong>{user?.name}</strong></p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* 1. ACHIEVEMENT CARD */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                        <Award size={40} className="text-emerald-500" />
                    </div>
                    <h4 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sovereign Rank</h4>
                    <h2 className="text-3xl font-black mt-2 text-emerald-600">{perfData.performance_rank}</h2>
                    <p className="text-sm text-slate-500 mt-2">You are in the top 5% of officials in {user?.ward}.</p>
                </div>

                {/* 2. VELOCITY ANALYTICS */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-2"><Zap size={18} /> Operational Velocity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex gap-4 items-center">
                            <div className="p-4 bg-slate-50 rounded-2xl"><Clock className="text-slate-400" /></div>
                            <div>
                                <small className="text-slate-400 font-bold uppercase text-[10px]">Avg Response Time</small>
                                <div className="text-2xl font-black">{perfData.avg_speed}</div>
                            </div>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="p-4 bg-emerald-50 rounded-2xl"><CheckCircle2 className="text-emerald-500" /></div>
                            <div>
                                <small className="text-slate-400 font-bold uppercase text-[10px]">Total Verified Fixes</small>
                                <div className="text-2xl font-black">{perfData.resolved_total}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. SLA COMPLIANCE DONUT */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm h-[350px]">
                    <h3 className="font-bold text-slate-800 mb-4">SLA Compliance</h3>
                    <ResponsiveContainer width="100%" height="80%">
                        <PieChart>
                            <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="text-center font-black text-2xl" style={{ marginTop: '-130px' }}>{perfData.sla_percentage}%</div>
                    <div className="text-center text-[10px] text-slate-400 font-bold mt-16 uppercase">Target: 95%</div>
                </div>

            </div>
        </div>
    );
}