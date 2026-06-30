import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Tracker from './pages/Tracker';
import Map from './pages/Map';
import IssueDetail from './pages/IssueDetail';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <>
      <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="tracker" element={<Tracker />} />
            <Route path="map" element={<Map />} />
            <Route path="issue/:id" element={<IssueDetail />} />
            <Route path="dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
