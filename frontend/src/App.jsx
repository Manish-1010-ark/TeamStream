// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword'; 

function App() {
  return (
    <Router>
      {/* You can remove the top-level nav if you only want auth pages */}
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} /> {/* <-- ADD ROUTE */}
        {/* We will add a protected /dashboard route later */}
      </Routes>
    </Router>
  );
}

export default App;