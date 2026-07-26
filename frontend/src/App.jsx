import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import TripPlanner from './pages/TripPlanner';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
        <Navbar />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/planner" element={<TripPlanner />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
