"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);

  // Load stored user on first render
  useEffect(() => {
    const savedUser = localStorage.getItem("admin");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const login = (data: any) => {
    setUser(data);
    localStorage.setItem("admin", JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("admin");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Easy access hook
export const useAuth = () => useContext(AuthContext);
