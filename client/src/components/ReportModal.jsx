import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Camera } from 'lucide-react';
import { API } from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/AuthContext';

export default function ReportModal({ isOpen, onClose, onReportSuccess }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('road');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to report an issue.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('address', address);
      
      // Hardcode GPS for demo since no map picker is added to modal yet
      formData.append('lat', 28.6139 + (Math.random() - 0.5) * 0.1);
      formData.append('lng', 77.2090 + (Math.random() - 0.5) * 0.1);
      
      if (photo) {
        formData.append('image', photo);
      }

      await API.createIssue(formData);
      toast.success('Issue reported successfully! +10 pts');
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('road');
      setAddress('');
      setPhoto(null);
      
      if (onReportSuccess) onReportSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to report issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-panel p-8 rounded-3xl w-full max-w-lg relative z-10 max-h-[90vh] overflow-y-auto"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-textMuted hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold mb-2 text-white">Report an Issue</h2>
            <p className="text-textMuted mb-6 text-sm">
              Your report will be analyzed by AI and routed to the correct authority.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-textMuted mb-1">Title</label>
                <input 
                  type="text" 
                  required 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="E.g., Huge pothole on MG Road"
                  className="w-full bg-surface border border-borderLight rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-colors placeholder:text-textMuted/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textMuted mb-1">Category</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-surface border border-borderLight rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-colors appearance-none"
                >
                  <option value="road">Road & Potholes</option>
                  <option value="water">Water & Sewage</option>
                  <option value="waste">Waste Management</option>
                  <option value="streetlight">Streetlights</option>
                  <option value="other">Other Civic Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-textMuted mb-1">Description</label>
                <textarea 
                  required 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-surface border border-borderLight rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-colors placeholder:text-textMuted/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textMuted mb-1">Exact Address / Location Details</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-textMuted" />
                  <input 
                    type="text" 
                    required 
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full bg-surface border border-borderLight rounded-xl pl-10 pr-4 py-3 text-white focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textMuted mb-1">Upload Photo</label>
                <label className="w-full bg-surface border border-borderLight border-dashed rounded-xl px-4 py-6 text-textMuted hover:text-white flex flex-col items-center justify-center cursor-pointer hover:bg-surfaceHover transition-colors">
                  <Camera className="w-6 h-6 mb-2" />
                  <span className="text-sm">{photo ? photo.name : 'Click to select image'}</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setPhoto(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary hover:bg-primaryHover text-white py-3 rounded-xl font-medium transition-colors mt-6 shadow-[0_0_15px_rgba(108,99,255,0.4)] disabled:opacity-50"
              >
                {loading ? 'Submitting Report...' : 'Submit Report'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
