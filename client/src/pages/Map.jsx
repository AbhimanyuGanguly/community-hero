import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { API } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Fix Leaflet's default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom glowing pin icons for different severities
const createIcon = (color) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px ${color};"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const icons = {
  low: createIcon('#10B981'),
  medium: createIcon('#F59E0B'),
  high: createIcon('#EF4444'),
  critical: createIcon('#8B5CF6')
};

export default function MapView() {
  const [issues, setIssues] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadIssues() {
      try {
        const data = await API.getIssues();
        // data is { issues: [...], total: N }
        setIssues(data.issues || []);
      } catch (err) {
        console.error("Failed to load map issues:", err);
        setIssues([]);
      }
    }
    loadIssues();
  }, []);

  // Filter issues that have valid lat/lng
  const mappableIssues = issues.filter(i => i.lat && i.lng);

  return (
    <div className="w-full h-[calc(100vh-120px)] rounded-3xl overflow-hidden relative glass-panel border-borderLight shadow-2xl z-0 mt-4">
      {/* Premium Gradient Overlay on edges */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(9,9,11,1)] z-[400]"></div>
      
      {/* Floating Info Card */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-6 left-6 z-[400] glass-panel bg-background/90 p-6 rounded-2xl w-80 max-w-[calc(100vw-48px)] shadow-2xl border border-white/10 backdrop-blur-md"
      >
        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Civic Radar</h2>
        <p className="text-sm text-textMuted mb-4 leading-relaxed">
          Real-time visualization of {mappableIssues.length} community issue{mappableIssues.length !== 1 ? 's' : ''} across the city.
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-error shadow-[0_0_10px_#EF4444]"></div>
            <span className="text-sm text-textMuted">High Severity</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-warning shadow-[0_0_10px_#F59E0B]"></div>
            <span className="text-sm text-textMuted">Medium Severity</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-success shadow-[0_0_10px_#10B981]"></div>
            <span className="text-sm text-textMuted">Low Severity</span>
          </div>
        </div>
      </motion.div>

      <MapContainer 
        center={[28.6139, 77.2090]}
        zoom={12} 
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        
        {mappableIssues.map(issue => (
          <Marker 
            key={issue.id} 
            position={[issue.lat, issue.lng]}
            icon={icons[issue.severity] || icons['medium']}
          >
            <Popup className="premium-popup">
              <div className="p-1">
                <h3 className="font-bold text-base mb-1 text-black">{issue.title}</h3>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{issue.description}</p>
                <button 
                  onClick={() => navigate(`/issue/${issue.id}`)}
                  className="w-full bg-[#6C63FF] hover:bg-[#5B54E6] text-white py-2 rounded-lg text-xs font-bold transition-colors"
                >
                  View Dossier
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
