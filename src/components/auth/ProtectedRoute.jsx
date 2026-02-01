import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export const ProtectedRoute = ({ children, authKey = 'scafoteam_admin_auth', redirect = '/admin' }) => {
    const isAuthenticated = localStorage.getItem(authKey) === 'true' || !!sessionStorage.getItem(authKey);
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to={redirect} state={{ from: location }} replace />;
    }

    return children;
};
