import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const WeatherContext = createContext();

export const useWeather = () => useContext(WeatherContext);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const WeatherProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [liveData, setLiveData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'], reconnection: true, reconnectionDelay: 3000 });
    s.on('connect', () => { setConnected(true); console.log('[WS] Connected'); });
    s.on('disconnect', () => setConnected(false));

    s.on('weather_update', ({ city_id, reading }) => {
      setLiveData((prev) => ({ ...prev, [city_id]: reading }));
    });

    s.on('new_alert', ({ alert, city }) => {
      setAlerts((prev) => [{ ...alert, City: city }, ...prev]);
      const icon = alert.alert_type === 'dark_red' || alert.alert_type === 'red' ? '🚨' : '⚠️';
      toast(`${icon} ${alert.title}`, {
        duration: 6000,
        style: {
          background: alert.alert_type === 'dark_red' ? '#7f1d1d' : alert.alert_type === 'red' ? '#dc2626' : alert.alert_type === 'orange' ? '#ea580c' : '#d97706',
          color: '#fff',
          fontWeight: 'bold',
        },
      });
    });

    s.on('data_refreshed', ({ timestamp, cities_updated }) => {
      setLastUpdate(timestamp);
    });

    s.on('alert_update', ({ city, level }) => {
      if (level === 'red' || level === 'dark_red') {
        toast.error(`🚨 FLOOD ALERT: ${city} — ${level.replace('_', ' ').toUpperCase()} WARNING`, { duration: 8000 });
      }
    });

    setSocket(s);
    return () => s.disconnect();
  }, []);

  const subscribeRegion = useCallback((regionCode) => {
    if (socket) socket.emit('subscribe_region', regionCode);
  }, [socket]);

  const subscribeCity = useCallback((cityId) => {
    if (socket) socket.emit('subscribe_city', cityId);
  }, [socket]);

  return (
    <WeatherContext.Provider value={{ socket, connected, liveData, alerts, setAlerts, lastUpdate, subscribeRegion, subscribeCity }}>
      {children}
    </WeatherContext.Provider>
  );
};
