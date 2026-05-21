import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { mockComplaints } from '../data/mockData.js';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ComplaintSidebar } from '../components/ComplaintSidebar.jsx';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons based on severity
const getMarkerIcon = (priority) => {
  // Mapping based on your DB seed logic: Dangerous/High, Moderate, Low
  const color = (priority === 'Dangerous' || priority === 'High') ? '#ef4444' : // Tailwind Red-500
    priority === 'Moderate' ? '#f59e0b' : // Tailwind Amber/Yellow-500
      '#10b981'; // Tailwind Green-500 (Low)

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};


function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function Visualization() {
  const { user } = useAuth();
  const { selectedComplaint, setSelectedComplaint } = useApp(); const [complaints, setComplaints] = useState([]);
  // Defaulting map center to Dombivli East coordinates as requested
  const [mapCenter, setMapCenter] = useState([19.0330, 73.0130]);

  // Fetch real complaints from the backend
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        // if (!user) return;
        // We filter by the logged-in admin's ward/zone (e.g., "Dombivli East")
        const zone = user?.location || user?.ward || "";
        const response = await fetch(`http://127.0.0.1:8000/api/get-complaints?zone=${encodeURIComponent(zone)}`);
        if (response.ok) {

          const data = await response.json();
          console.log("Raw Backend Data:", data);

          const validData = data.map(c => ({
            ...c,
            latitude: parseFloat(c.latitude),
            longitude: parseFloat(c.longitude)
          })).filter(c => !isNaN(c.latitude) && !isNaN(c.longitude));
          setComplaints(validData);
          if (validData.length > 0) {
            setMapCenter([validData[0].latitude, validData[0].longitude]);
          }

        }
      } catch (error) {
        console.error("Error fetching complaints:", error);
      }
    };

    fetchComplaints();
  }, [user]);

  const handleComplaintClick = (complaint) => {
    // Mapping DB fields to the format expected by ComplaintSidebar
    const formattedComplaint = {
      ...complaint,
      latitude: complaint.latitude,
      longitude: complaint.longitude,
      ai_category: complaint.ai_category,
      severity: complaint.priority,
      address: complaint.location,
      submittedDate: complaint.created_at, // This will be the first date found in DB
      imageUrl: complaint.image_path,
      submittedBy: complaint.full_name
    };
    setSelectedComplaint(formattedComplaint);
    markComplaintAsViewed(complaint.id);
    setMapCenter([complaint.latitude, complaint.longitude]);
  };

  return (
    <div className="h-[calc(100vh-80px)] relative flex">
      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          className="z-0"
        >
          <MapController center={mapCenter} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`}
          />

          {complaints.map((complaint) => (
            <Marker
              key={complaint.id}
              position={[complaint.latitude, complaint.longitude]}
              icon={getMarkerIcon(complaint.priority)}
              eventHandlers={{
                click: () => handleComplaintClick(complaint)
              }}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold text-sm mb-1">{complaint.ai_category}</h4>
                  <p className="text-xs text-gray-600 mb-1">{complaint.location}</p>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${(complaint.priority === 'Dangerous' || complaint.priority === 'High') ? 'bg-red-100 text-red-700' :
                      complaint.priority === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                    }`}>
                    {complaint.priority}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-6 left-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-10 border border-slate-100">
          <h4 className="font-bold mb-3 text-xs uppercase tracking-widest text-slate-400">Priority Legend</h4>
          <div className="space-y-2 text-xs font-bold">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-slate-600">Dangerous / High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-slate-600">Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-slate-600">Low Priority</span>
            </div>
          </div>
        </div>

        {/* Complaint Count */}
        <div className="absolute top-6 left-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-10">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{complaints.length}</p>
            <p className="text-xs text-muted-foreground">Local Complaints</p>
          </div>
        </div>
      </div>

      {/* Complaint Sidebar */}
      <ComplaintSidebar />
    </div>
  );
}