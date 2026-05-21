import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, MapPin, Calendar, Briefcase, Users } from 'lucide-react';
import { Button } from './ui2/button';
import { Badge } from './ui2/badge';
import { useApp } from '../context/AppContext.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui2/card.jsx';
import { useNavigate } from 'react-router-dom'; // Import for navigation
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export function ComplaintSidebar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedComplaint, setSelectedComplaint, viewedComplaints } = useApp();
  const [citizenCount, setCitizenCount] = useState(1);

  // Fetch count of similar complaints when sidebar opens
  useEffect(() => {
    if (selectedComplaint) {
      const fetchCount = async () => {
        try {
          const params = new URLSearchParams({
            lat: selectedComplaint.latitude,
            lng: selectedComplaint.longitude,
            category: selectedComplaint.ai_category
          });
          const res = await fetch(`http://localhost:8000/api/complaint-count?${params}`);
          const data = await res.json();
          setCitizenCount(data.count);
        } catch (e) {
          console.error("Failed to fetch citizen count", e);
        }
      };
      fetchCount();
    }
  }, [selectedComplaint]);

  if (!selectedComplaint) return null;

  const hasBeenViewed = viewedComplaints.has(selectedComplaint.id);

  const getSeverityStyle = (severity) => {
    if (severity === 'Dangerous' || severity === 'High') return "bg-red-500 hover:bg-red-600 text-white border-none";
    if (severity === 'Moderate') return "bg-yellow-500 hover:bg-yellow-600 text-black border-none";
    return "bg-green-500 hover:bg-green-600 text-white border-none";
  };

  const handleUpdateStatus = async () => {
    // Get role based on your officer table: admin_role > role > default
    const userRole = user?.admin_role || user?.role || 'Desk Officer';

    try {
      const response = await fetch('http://localhost:8000/api/update-complaint-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: selectedComplaint.latitude,
          longitude: selectedComplaint.longitude,
          category: selectedComplaint.ai_category,
          updated_by_role: userRole,
          new_status: 'Approved'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message); // Displays "Updated and sent X emails..."
        setSelectedComplaint(null); // Close sidebar on success
      } else {
        toast.error('Failed to update status.');
      }
    } catch (error) {
      toast.error('Network error.');
    }
  };

  const handleAllocateReport = () => {
    // We pass the data in the route state so the Registry page knows what to allocate
    navigate('/dashboard/agent-portal', {
      state: {
        fullComplaintDetails: selectedComplaint
      }
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        className="w-96 bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto border-l border-gray-200 fixed right-0 top-20 h-[calc(100vh-80px)] z-50"
      >
        <div className="sticky top-0 bg-primary text-white p-4 flex items-center justify-between z-10">
          <h3 className="font-semibold">Complaint Management</h3>
          <Button variant="ghost" size="icon" onClick={() => setSelectedComplaint(null)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-2">{selectedComplaint.ai_category}</h2>
            <div className="flex gap-2">
              <Badge className={`${getSeverityStyle(selectedComplaint.severity)} font-black uppercase tracking-tighter`}>
                {selectedComplaint.severity}
              </Badge>
              <Badge variant="outline" className="font-bold uppercase tracking-tighter">
                {selectedComplaint.status}
              </Badge>
            </div>
          </div>

          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Affected Citizens</p>
                  <p className="text-sm font-bold">{citizenCount} Users reported this</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">First Reported On</p>
                  <p className="text-sm font-medium">{new Date(selectedComplaint.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-500" />
                <p className="text-sm font-medium">{selectedComplaint.location}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Evidence</CardTitle></CardHeader>
            <CardContent>
              <img
                src={`http://localhost:8000/${selectedComplaint.image_path}`}
                alt="Complaint"
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => e.target.src = 'https://via.placeholder.com/400x200?text=No+Image+Available'}
              />
            </CardContent>
          </Card>

          <div className="pt-4">
            <Button onClick={handleUpdateStatus} className="w-full h-12 text-lg">
              Approve & Notify Citizens
            </Button>
            <Button
              onClick={handleAllocateReport}
              variant="outline"
              className="w-full flex gap-2 items-center"
            >
              <Briefcase className="h-4 w-4" />
              Allocate to Contractor
            </Button>

            <p className="text-[10px] text-center text-muted-foreground italic">
              Allocating will redirect you to the professional registry.
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}