import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Wifi, WifiOff } from "lucide-react";

export function RealtimeIndicator() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Monitor connection status
    const channel = supabase.channel('connection-monitor');
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-white/50 rounded-lg border border-gray-200/50">
      {isConnected ? (
        <>
          <Wifi className="w-3 h-3 text-green-500" />
          <span className="text-[10px] text-green-600 font-medium">Real-time</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 text-gray-400" />
          <span className="text-[10px] text-gray-400 font-medium">Offline</span>
        </>
      )}
    </div>
  );
}
