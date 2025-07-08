import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Role, Permission, UserRole } from '../types/banking';
import dotenv from 'dotenv';

interface RoleContextType {
  roles: Role[];
  permissions: Permission[];
  userRoles: UserRole[];
  createRole: (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRole: (roleId: string, updates: Partial<Role>) => void;
  deleteRole: (roleId: string) => void;
  assignRole: (userId: string, roleId: string, assignedBy: string) => void;
  removeRole: (userId: string, roleId: string) => void;
  getUserRoles: (userId: string) => Role[];
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);
const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';

export const useRoles = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRoles must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);

  // Fetch roles and permissions from API
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [permRes, roleRes] = await Promise.all([
          axios.get(`${apiUrl}/permission/v1/all`),
          axios.get(`${apiUrl}/role/v1/all`)
        ]);
        setPermissions(permRes.data as Permission[]);
        setRoles(roleRes.data as Role[]);
      } catch (err) {
        console.error('Failed to load initial role data:', err);
      }
    };
    fetchInitialData();
  }, []);

  const createRole = async (roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await axios.post(`${apiUrl}/role/create`, roleData);
      setRoles(prev => [...prev, response.data as Role]);
    } catch (err) {
      console.error('Failed to create role:', err);
    }
  };

  const updateRole = (roleId: string, updates: Partial<Role>) => {
    setRoles(prev =>
      prev.map(role =>
        role.id === roleId
          ? { ...role, ...updates, updatedAt: new Date().toISOString() }
          : role
      )
    );
  };

  const deleteRole = (roleId: string) => {
    setRoles(prev => prev.filter(role => role.id !== roleId));
    setUserRoles(prev => prev.filter(ur => ur.roleId !== roleId));
  };

  const assignRole = async (userId: string, roleId: string, assignedBy: string) => {
    try {
      const response = await axios.post<{ assignedAt?: string }>('http://localhost:3000/api/v1/user/create', {
        userId,
        roleId,
        assignedBy
      });

      const newUserRole: UserRole = {
        userId,
        roleId,
        assignedBy,
        assignedAt: response.data.assignedAt ?? new Date().toISOString()
      };
      setUserRoles(prev =>
        [...prev.filter(ur => !(ur.userId === userId && ur.roleId === roleId)), newUserRole]
      );
    } catch (err) {
      console.error('Failed to assign role:', err);
    }
  };

  const removeRole = (userId: string, roleId: string) => {
    setUserRoles(prev => prev.filter(ur => !(ur.userId === userId && ur.roleId === roleId)));
  };

  const getUserRoles = (userId: string): Role[] => {
    const userRoleIds = userRoles.filter(ur => ur.userId === userId).map(ur => ur.roleId);
    return roles.filter(role => userRoleIds.includes(role.id));
  };

  return (
    <RoleContext.Provider
      value={{
        roles,
        permissions,
        userRoles,
        createRole,
        updateRole,
        deleteRole,
        assignRole,
        removeRole,
        getUserRoles
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};




















// import React, { createContext, useContext, useState } from 'react';
// import { Role, Permission, UserRole } from '../types/banking';

// interface RoleContextType {
//   roles: Role[];
//   permissions: Permission[];
//   userRoles: UserRole[];
//   createRole: (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => void;
//   updateRole: (roleId: string, updates: Partial<Role>) => void;
//   deleteRole: (roleId: string) => void;
//   assignRole: (userId: string, roleId: string, assignedBy: string) => void;
//   removeRole: (userId: string, roleId: string) => void;
//   getUserRoles: (userId: string) => Role[];
// }

// const RoleContext = createContext<RoleContextType | undefined>(undefined);

// export const useRoles = () => {
//   const context = useContext(RoleContext);
//   if (context === undefined) {
//     throw new Error('useRoles must be used within a RoleProvider');
//   }
//   return context;
// };

// export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [permissions] = useState<Permission[]>([
//     { id: '1', name: 'view_accounts', resource: 'accounts', action: 'view', description: 'View customer accounts' },
//     { id: '2', name: 'create_accounts', resource: 'accounts', action: 'create', description: 'Create new accounts' },
//     { id: '3', name: 'edit_accounts', resource: 'accounts', action: 'edit', description: 'Edit account details' },
//     { id: '4', name: 'delete_accounts', resource: 'accounts', action: 'delete', description: 'Delete accounts' },
//     { id: '5', name: 'view_transactions', resource: 'transactions', action: 'view', description: 'View transactions' },
//     { id: '6', name: 'create_transactions', resource: 'transactions', action: 'create', description: 'Post transactions' },
//     { id: '7', name: 'view_reports', resource: 'reports', action: 'view', description: 'View financial reports' },
//     { id: '8', name: 'manage_users', resource: 'users', action: 'manage', description: 'Manage user accounts' },
//     { id: '9', name: 'manage_roles', resource: 'roles', action: 'manage', description: 'Manage roles and permissions' },
//     { id: '10', name: 'view_audit', resource: 'audit', action: 'view', description: 'View audit logs' }
//   ]);

//   const [roles, setRoles] = useState<Role[]>([
//     {
//       id: '1',
//       name: 'Bank Teller',
//       description: 'Basic teller operations',
//       permissions: permissions.filter(p => ['view_accounts', 'view_transactions', 'create_transactions'].includes(p.name)),
//       createdAt: '2024-01-01T00:00:00Z',
//       updatedAt: '2024-01-01T00:00:00Z'
//     },
//     {
//       id: '2',
//       name: 'Account Manager',
//       description: 'Manage customer accounts',
//       permissions: permissions.filter(p => ['view_accounts', 'create_accounts', 'edit_accounts', 'view_transactions', 'create_transactions'].includes(p.name)),
//       createdAt: '2024-01-01T00:00:00Z',
//       updatedAt: '2024-01-01T00:00:00Z'
//     },
//     {
//       id: '3',
//       name: 'Branch Manager',
//       description: 'Full branch operations access',
//       permissions: permissions.filter(p => !['manage_roles'].includes(p.name)),
//       createdAt: '2024-01-01T00:00:00Z',
//       updatedAt: '2024-01-01T00:00:00Z'
//     },
//     {
//       id: '4',
//       name: 'System Administrator',
//       description: 'Full system access',
//       permissions: permissions,
//       createdAt: '2024-01-01T00:00:00Z',
//       updatedAt: '2024-01-01T00:00:00Z'
//     }
//   ]);

//   const [userRoles, setUserRoles] = useState<UserRole[]>([
//     { userId: '1', roleId: '2', assignedBy: 'admin', assignedAt: '2024-01-01T00:00:00Z' },
//     { userId: '2', roleId: '4', assignedBy: 'admin', assignedAt: '2024-01-01T00:00:00Z' }
//   ]);

//   const createRole = (roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => {
//     const newRole: Role = {
//       ...roleData,
//       id: Date.now().toString(),
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString()
//     };
//     setRoles(prev => [...prev, newRole]);
//   };

//   const updateRole = (roleId: string, updates: Partial<Role>) => {
//     setRoles(prev => prev.map(role => 
//       role.id === roleId 
//         ? { ...role, ...updates, updatedAt: new Date().toISOString() }
//         : role
//     ));
//   };

//   const deleteRole = (roleId: string) => {
//     setRoles(prev => prev.filter(role => role.id !== roleId));
//     setUserRoles(prev => prev.filter(ur => ur.roleId !== roleId));
//   };

//   const assignRole = (userId: string, roleId: string, assignedBy: string) => {
//     const newUserRole: UserRole = {
//       userId,
//       roleId,
//       assignedBy,
//       assignedAt: new Date().toISOString()
//     };
//     setUserRoles(prev => [...prev.filter(ur => !(ur.userId === userId && ur.roleId === roleId)), newUserRole]);
//   };

//   const removeRole = (userId: string, roleId: string) => {
//     setUserRoles(prev => prev.filter(ur => !(ur.userId === userId && ur.roleId === roleId)));
//   };

//   const getUserRoles = (userId: string): Role[] => {
//     const userRoleIds = userRoles.filter(ur => ur.userId === userId).map(ur => ur.roleId);
//     return roles.filter(role => userRoleIds.includes(role.id));
//   };

//   return (
//     <RoleContext.Provider value={{
//       roles,
//       permissions,
//       userRoles,
//       createRole,
//       updateRole,
//       deleteRole,
//       assignRole,
//       removeRole,
//       getUserRoles
//     }}>
//       {children}
//     </RoleContext.Provider>
//   );
// };
