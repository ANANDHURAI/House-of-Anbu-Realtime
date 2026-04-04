import React from 'react';
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const accessToken = localStorage.getItem('access');
  
  if (accessToken) {
    return <Navigate to="/home" replace />;
  }
  
  return children;
};

export default PublicRoute;