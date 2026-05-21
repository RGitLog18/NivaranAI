import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, HardHat, CheckCircle, AlertCircle, Search ,Briefcase} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './DeskDashboard.css'; // Reuse your high-end Groww styles

export default function ContractorRegistry() {
    const  user  = useAuth()?.user || "Desk Officer";
    const location = useLocation();
    const navigate = useNavigate();
    const complaintToAllocate = location.state?.complaintData;
    const [contractors, setContractors] = useState([]);
    const [loading, setLoading] = useState(true);
    // 1. Add these new states inside your component
    const [selectedContractor, setSelectedContractor] = useState(null);
    const [portfolioData, setPortfolioData] = useState(null);
    const [showPortfolio, setShowPortfolio] = useState(false);

    const complaintData = location.state?.fullComplaintDetails || location.state?.complaintData || null;

    const handleFinalAllocation = async (contractor) => {
        console.log("Allocating to:", contractor.email); 

        // const fd = new FormData();
       
        // fd.append('complaint_id', complaintToAllocate.id);
        // fd.append('contractor_email', contractor.email); // Ensure 'email' exists on the contractor object

        try {
        const response = await fetch('http://localhost:8000/api/allocate-contractor', {
            method: 'POST', // CRITICAL: Tell the server this is a POST request
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ // CRITICAL: Wrap data in JSON string
                latitude: parseFloat(complaintData.latitude),
                longitude: parseFloat(complaintData.longitude),
                category: String(complaintData.ai_category || complaintData.category),
                contractor_id: String(contractor.uid_number || contractor.id),
                contractor_name: String(contractor.name),
                contractor_email: String(contractor.email), // Send the email here
                workspace_code: String(user.workspace_code || ""), 
                officer_name: String(user.name || "Officer")              // From AuthContext
            }),
        });

        const result = await response.json();

        if (response.ok) {
            toast.success(`Complaint successfully allocated to ${contractor.name}`);
            navigate('/dashboard/visualization'); // Go back to map
        } else {
            // FIX: Don't pass the whole 'result' object to toast
            // FastAPI validation errors are usually in result.detail
            const errorMessage = typeof result.detail === 'string' 
                ? result.detail 
                : "Validation Error: Check data format";
            toast.error(errorMessage);
        }
    } catch (e) {
        toast.error("Network error during allocation");
        console.error("Allocation error:", e);
    }
    };

    // 2. The function to "Audit" a contractor
    // --- THE AUDIT HANDSHAKE FUNCTION ---
    const handleViewPortfolio = async (contractorName) => {
        // 1. Open the sidebar and show a loading pulse
        setSelectedContractor(contractorName);
        setShowPortfolio(true);
        setPortfolioData(null);

        try {
            const token = localStorage.getItem('token');

            // 2. Fetch the "Visual Proof" history from your new backend route
            const res = await axios.get(`http://localhost:8000/api/v1/desk/contractor-portfolio/${contractorName}`);
            setPortfolioData(res.data);    
        }catch (err) {
            console.error("Audit Failure:", err);
            toast.error("Could not verify contractor portfolio.");
        }

            // 3. Populate the sidebar with real "Before/After" data
            
    };

    useEffect(() => {
        // Fetch your contractors list
        const fetchContractors = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/v1/desk/contractors'); // adjust URL as per your routes
                setContractors(res.data);
            } catch (err) {
                console.error("Error fetching contractors", err);
            }
        };
        fetchContractors();
    }, []);

    const fetchContractors = async () => {
        console.log("📡 Attempting API Call to /contractors..."); // THIS SHOULD PRINT NOW
        // setLoading(true);
        try {
             const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:8000/api/v1/desk/contractors`, {
                params: { ward: user.ward, domain: user.admin_domain },
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("✅ Data Received from Backend:", res.data);
            setContractors(res.data);
            setLoading(false);
        } catch (err) { console.error(err);
            toast.error("Failed to load contractor registry.");
         }finally{ setLoading(false); }
        };

    useEffect(() => { if (user) fetchContractors(); }, [user]);

    return (
        <div className="registry-container p-8 bg-[#FDFDFD] min-h-screen">
            <header className="mb-10">
                <h1 className="text-3xl font-black tracking-tight">Contractor Performance Registry</h1>
                <p className="text-slate-400">Resource Load Balancing for <strong>{user?.location || "Your Ward"}</strong></p>
                
                {/* LEADERSHIP BOARD (GROWW STYLE) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="stat-card glass p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <small className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Total Workforce</small>
                        <h2 className="text-4xl font-black mt-2">{contractors.length}</h2>
                    </div>
                    <div className="stat-card glass p-6 rounded-3xl border border-emerald-100 bg-emerald-50/30">
                        <small className="font-bold text-emerald-600 uppercase tracking-widest text-[10px]">Available Units</small>
                        <h2 className="text-4xl font-black text-emerald-600 mt-2">
                            {contractors.filter(c => c.availability === 'Available').length}
                        </h2>
                    </div>
                </div>
                {/* Visual indicator if a complaint is active for allocation */}
                {complaintData && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500 p-2 rounded-lg text-white"><Briefcase size={18}/></div>
                            <span className="text-blue-800 font-medium">
                                Allocating <strong>{complaintData.ai_category}</strong> at {complaintData.location || "Selected Hotspot"}
                            </span>
                        </div>
                        <button onClick={() => navigate(-1)} className="text-xs text-blue-600 underline">Cancel</button>
                    </div>
                )}
            </header>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contractor / Agency</th>
                            <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Specialization</th>
                            <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Availability</th>
                            <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contractors.map((c, i) => (
                            <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors">
                                <td className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><User className="text-slate-400" size={20} /></div>
                                        <div>
                                            <div className="font-bold text-slate-800">{c.name}</div>
                                            <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><Phone size={10}/> {c.phone}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5 text-sm font-medium text-slate-600">{c.specific_role}</td>
                                <td className="p-5">
                                    <span className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-tighter" style={{ color: c.color }}>
                                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: c.color }}></div>
                                        {c.availability}
                                    </span>
                                </td>
                                <td className="p-5 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleViewPortfolio(c.name)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-[10px] hover:bg-slate-200 transition-all">
                                            VIEW PORTFOLIO
                                        </button>
                                        
                                        {/* THE ALLOCATE BUTTON - Only shows if we have a complaint selected */}
                                        {complaintData && (
                                            <button 
                                                onClick={() => handleFinalAllocation(c)}
                                                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-[10px] hover:bg-black shadow-lg shadow-slate-200 transition-all"
                                            >
                                                CONFIRM & ALLOCATE
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <AnimatePresence>
                {showPortfolio && (
                    <>
                        {/* Backdrop Blur */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100]"
                            onClick={() => setShowPortfolio(false)}
                        />

                        {/* Portfolio Sidebar */}
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] p-8 overflow-y-auto"
                        >
                            <button onClick={() => setShowPortfolio(false)} className="mb-6 text-slate-400 hover:text-slate-600">✕ Close Audit</button>

                            {portfolioData ? (
                                <div className="portfolio-content">
                                    <h1 className="text-2xl font-black">{portfolioData.name}</h1>
                                    <p className="text-emerald-600 font-bold text-sm">✓ AI-VERIFIED CONTRACTOR</p>

                                    {/* METRICS ROW */}
                                    <div className="grid grid-cols-2 gap-4 mt-8">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <small className="text-[10px] font-bold text-slate-400 uppercase">Efficiency</small>
                                            <div className="text-xl font-black text-emerald-600">{portfolioData.efficiency_score}</div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <small className="text-[10px] font-bold text-slate-400 uppercase">Resolved</small>
                                            <div className="text-xl font-black">{portfolioData.total_resolved} Cases</div>
                                        </div>
                                    </div>

                                    {/* VISUAL PROOF GALLERY (THE TRUST LOOP) */}
                                    <h3 className="mt-10 mb-4 font-bold text-slate-800">Visual Audit: Before & After</h3>
                                    <div className="space-y-6">
                                        {portfolioData.work_history.map(job => (
                                            <div key={job.id} className="border-b border-slate-50 pb-6">
                                                <small className="font-bold text-slate-400 uppercase">{job.location}</small>
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    <img src={`http://127.0.0.1:8000/${job.image_path}`} className="rounded-lg h-24 object-cover grayscale" title="Before" />
                                                    <img src={`http://127.0.0.1:8000/${job.resolution_image_path}`} className="rounded-lg h-24 object-cover border-2 border-emerald-500" title="After" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-pulse">Loading Sovereign Portfolio...</div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}