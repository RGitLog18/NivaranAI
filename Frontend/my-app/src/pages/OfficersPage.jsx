import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui2/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui2/avatar';
import { Button } from '../components/ui2/button';
import { Badge } from '../components/ui2/badge';
import { Mail, Phone, FileText, Send, Loader2, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext'; // Use real Auth
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui2/dialog';

export default function OfficersPage() {
  const { user } = useAuth(); // Logged in Admin
  const { generatedReports, selectedReport, setSelectedReport } = useApp();

  const [officers, setOfficers] = useState([]);
  // const [loading, setLoading] = useState(true);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [loading, setLoading] = useState(false); // Start as false
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // --- 1. FETCH REAL OFFICERS FROM DB ---
  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Fetching officers belonging to the same ward/location as the Admin
      const res = await axios.get(`http://127.0.0.1:8000/api/v1/desk/officers`, {
        params: { ward: user?.ward },
        headers: { Authorization: `Bearer ${token}` }
      });
      setOfficers(res.data);
    } catch (err) {
      console.error("Failed to fetch officers:", err);
      toast.error("Handshake Failed: Could not sync officer registry.");
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    if (user) {
    // Check both potential property names
    const activeWard = user.ward || user.location;
    
    if (activeWard) {
      console.log("Syncing for ward:", activeWard);
      fetchOfficers();
    } else {
      setLoading(false);
      setIsInitialLoad(false);
      console.warn("User object found, but no ward/location property exists:", user);
    }
  }
}, [user]);

  // --- 2. PREPARE ALLOCATION ---
  const handleAllocateReport = (officer) => {
    if (!selectedReport && generatedReports.length > 0) {
      // Default to the first report if none specifically clicked in the banner
      setSelectedReport(generatedReports[0]);
    }
    setSelectedOfficer(officer);
    setShowReportDialog(true);
  };

  // --- 3. EXECUTE DISPATCH (Stage 10 logic) ---
  const handleSendReport = async () => {
    if (!selectedReport || !selectedOfficer) return;

    setIsDispatching(true);
    try {
      const token = localStorage.getItem('token');

      // FIXED URL: Added 'desk' to the path to match the backend router prefix
      const url = `http://127.0.0.1:8000/api/v1/desk/issue-job-card/${selectedReport.complaint.id}`;

      const res = await axios.post(url,
        { officer_email: selectedOfficer.email }, // Sent as JSON
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status === 'success') {
        toast.success(`Mission Dispatched: Report allocated to ${selectedOfficer.name}`);
        setShowReportDialog(false);
        setSelectedReport(null);
        fetchOfficers();
      }
    } catch (err) {
      console.error(err);
      toast.error("Dispatch Error: Check console for 404 or 422.");
    } finally {
      setIsDispatching(false);
    }
  };

  // 3. CONDITIONAL RENDERING HAPPENS ONLY IN THE RETURN
  if (isInitialLoad || (loading && officers.length === 0)) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-emerald-50">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4" />
        <p className="font-bold text-emerald-800 uppercase tracking-tighter">Syncing Officer Records...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Personnel Command</h2>
          <p className="text-slate-500 font-medium">
            Authorized Personnel for <strong>{user?.ward || "General Jurisdiction"}</strong>
          </p>
        </div>

        {/* Reports Banner */}
        {generatedReports.length > 0 && (
          <Card className="mb-6 bg-white border-l-4 border-l-emerald-500 shadow-sm animate-in fade-in slide-in-from-top-4">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <FileText className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{generatedReports.length} AI Intel Report(s) Generated</p>
                  <p className="text-xs text-slate-400 uppercase font-black">Ready for Operational Assignment</p>
                </div>
              </div>
              {selectedReport && (
                <Badge className="bg-emerald-600 hover:bg-emerald-700 py-1.5 px-4 rounded-full">
                  Focused: Case #{selectedReport.complaint.id}
                </Badge>
              )}
            </CardContent>
          </Card>
        )}

        {/* Officers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {officers.map((officer) => (
            <Card key={officer.email} className="hover:shadow-xl transition-all border-none bg-white/80 backdrop-blur-sm group">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-emerald-600 font-black text-xl border-2 border-white shadow-sm">
                    {officer.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-slate-800">{officer.name}</CardTitle>
                    <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">{officer.specific_role || "Desk Officer"}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${officer.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{officer.status || "Standby"}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2 py-3 border-y border-slate-50">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Mail size={14} className="text-emerald-500" /> <span className="truncate">{officer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Phone size={14} className="text-emerald-500" /> <span>{officer.phone || "No Contact"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xl font-black text-slate-800">{officer.current_load || 0}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Assigned</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-emerald-600">{officer.total_resolved || 0}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Resolved</p>
                  </div>
                </div>

                <Button
                  onClick={() => handleAllocateReport(officer)}
                  disabled={generatedReports.length === 0}
                  className="w-full bg-slate-900 hover:bg-black text-white font-bold rounded-xl py-6"
                >
                  <Send className="h-4 w-4 mr-2" />
                  ALLOCATE TASK
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dispatch Dialog */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="max-w-xl rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-emerald-600 p-8 text-white">
              <DialogTitle className="text-2xl font-black">Authorize Dispatch</DialogTitle>
              <DialogDescription className="text-emerald-50 opacity-90">
                Assigning verified grievance to {selectedOfficer?.name}
              </DialogDescription>
            </div>

            {selectedReport && selectedOfficer && (
              <div className="p-8 space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Target Ward</p>
                      <p className="font-bold text-slate-800">{selectedReport.complaint.ward_zone || "Dombivli"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Priority</p>
                      <Badge className={selectedReport.complaint.priority === 'Dangerous' ? 'bg-red-500' : 'bg-blue-500'}>
                        {selectedReport.complaint.priority}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Description</p>
                      <p className="text-slate-600 leading-tight italic">"{selectedReport.complaint.description}"</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1 font-bold text-slate-400" onClick={() => setShowReportDialog(false)}>
                    CANCEL
                  </Button>
                  <Button
                    onClick={handleSendReport}
                    disabled={isDispatching}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl py-6 shadow-lg shadow-emerald-100"
                  >
                    {isDispatching ? <Loader2 className="animate-spin mr-2" /> : <UserCheck className="mr-2" />}
                    AUTHORIZE NOW
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}