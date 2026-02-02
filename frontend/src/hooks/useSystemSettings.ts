import { useQuery } from "@tanstack/react-query";
// import { supabase } from "../lib/supabase"; // OLD - Supabase
import { api } from "../lib/api-client"; // NEW - JWT

export function useSystemSettings() {
  return useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      try {
        // Try to fetch from backend API
        const data = await api.get('/system-settings');
        return data;
      } catch (error) {
        console.warn('System settings not found, using defaults:', error);
        // Return default settings if API fails
        return {
          id: 'main',
          app_name: 'UniERP Horizon',
          app_logo_url: null,
          app_logo_name: null,
          theme_color: '#059669',
          language: 'ar',
          timezone: 'Asia/Riyadh'
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}


