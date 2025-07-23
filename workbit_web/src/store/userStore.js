import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUserStore = create(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      // Acciones
      setUser: (userData) => set({ 
        user: userData, 
        isAuthenticated: !!userData 
      }),
      
      setToken: (token) => {
        if (token) {
          localStorage.setItem('workbit_token', token);
        } else {
          localStorage.removeItem('workbit_token');
        }
        set({ token });
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      
      login: (userData, token) => {
        set({
          user: userData,
          token,
          isAuthenticated: true,
          isLoading: false
        });
        localStorage.setItem('workbit_token', token);
      },
      
      logout: () => {
        localStorage.removeItem('workbit_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
      },
      
      updateUser: (updatedData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updatedData }
          });
        }
      },
      
      // Getters
      getUserRole: () => {
        const user = get().user;
        return user?.role || null;
      },
      
      getUserName: () => {
        const user = get().user;
        return user?.name || user?.firstName || '';
      },
      
      getUserEmail: () => {
        const user = get().user;
        return user?.email || '';
      },
      
      isAdmin: () => {
        const role = get().getUserRole();
        return role === 'Admin' || role === 'Administrator';
      },
      
      isTechnician: () => {
        const role = get().getUserRole();
        return role === 'Technician' || role === 'Técnico';
      },
      
      isEmployee: () => {
        const role = get().getUserRole();
        return role === 'Employee' || role === 'Empleado';
      }
    }),
    {
      name: 'workbit-user-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useUserStore; 