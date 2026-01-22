import React, { createContext, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Check if user/token exists in localStorage to persist session
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const navigate = useNavigate();

    const login = (userData, tokenData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', tokenData);
        setUser(userData);
        setToken(tokenData);
        navigate('/locations-top'); // Redirect after successful Google login
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        navigate('/signin');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);