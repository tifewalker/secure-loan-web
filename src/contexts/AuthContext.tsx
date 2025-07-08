
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRoles } from './RoleContext';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  confirmEmail: string;
  staffId: string;
  designation: string;
  department: string;
  accessLevel: string;
  twoFaEnabled: boolean;
  twoFactorMethod: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: 'user' | 'admin'| 'company'; // Adjust roles as needed

}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, firstName: string, lastName: string ) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  canAccess: (resource: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Mock login - replace with actual API call
      const mockUsers = [
        { id: '1', email: 'user@demo.com', password: 'password', name: 'John Doe', role: 'user' as const },
        { id: '2', email: 'admin@demo.com', password: 'admin', name: 'Admin User', role: 'admin' as const }
      ];
      // const foundUser = mockUsers.find(u => u.email === email && u.password === password);
      const response = await fetch("http://localhost:3000/api/user/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed");
      }

      // Assuming the API returns a user object on success
      if (result && result.user) {
        setUser(result.user);
        localStorage.setItem('token', (result.token));
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Construct the user object with required fields; fill others with defaults or empty strings
      const formData: User = {
        firstName,
        lastName,
        email,
        phoneNumber: "",
        confirmEmail: email,
        staffId: "",
        designation: "",
        department: "",
        accessLevel: "",
        twoFaEnabled: false,
        twoFactorMethod: "",
        password,
        confirmPassword: password,
        fullName: `${firstName} ${lastName}`,
        role: "user",
        _id: ''
      };
  
      const response = await fetch("http://localhost:3000/api/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.message || "Registration failed");
      }
  
      // Assuming the API returns a user object on success
      if (result && result.user) {
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    // if (user.role === 'company') return true;
    
    // Get user's roles and check permissions
    // This would be implemented with actual role checking logic
    return false;
  };

  const canAccess = (resource: string, action: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    // if (user.role === 'company') return true;

    
    return hasPermission(`${action}_${resource}`);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      isLoading, 
      hasPermission, 
      canAccess 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
