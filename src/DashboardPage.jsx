import { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress, Divider } from '@mui/material';
import TopHeader from './common/components/TopHeader';
import PieChart from './charts/PieChart';
import BarChart from './charts/BarChart';
import LineChart from './charts/LineChart';

// Utility function to fetch data from Traccar API
const fetchTraccar = async (endpoint) => {
  const response = await fetch(`/api/${endpoint}`);
  if (!response.ok) throw new Error('API error');
  return response.json();
};

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [positions, setPositions] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [devicesData, positionsData, eventsData] = await Promise.all([
          fetchTraccar('devices'),
          fetchTraccar('positions'),
          fetchTraccar('events?from=' + new Date(Date.now() - 7*24*60*60*1000).toISOString() + '&to=' + new Date().toISOString()),
        ]);
        setDevices(devicesData);
        setPositions(positionsData);
        setEvents(eventsData);
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  // Example analytics calculations
  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const offlineDevices = devices.filter(d => d.status === 'offline').length;
  const healthyDevices = devices.filter(d => d.status === 'online').length; // Placeholder
  const unhealthyDevices = devices.filter(d => d.status === 'offline').length; // Placeholder

  // Pie chart data for connection state
  const connectionStateData = [
    { label: 'Online', value: onlineDevices, color: '#4caf50' },
    { label: 'Offline', value: offlineDevices, color: '#bdbdbd' },
  ];

  // Pie chart data for health check (placeholder)
  const healthCheckData = [
    { label: 'Healthy', value: healthyDevices, color: '#4caf50' },
    { label: 'Unhealthy', value: unhealthyDevices, color: '#f44336' },
  ];

  // Bar chart for top units by mileage (placeholder)
  const topMileage = devices.slice(0, 5).map(d => ({ label: d.name, value: d.totalDistance || 0 }));

  // Line chart for mileage over time (placeholder)
  const mileageOverTime = positions.map(p => ({ x: p.deviceId, y: p.attributes?.distance || 0 }));

  return (
    <>
      <TopHeader />
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom>Dashboard Analytics</Typography>
        <Divider sx={{ mb: 2 }} />
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1">Connection State</Typography>
                <PieChart data={connectionStateData} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1">Health Check Status</Typography>
                <PieChart data={healthCheckData} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1">Top Units by Mileage</Typography>
                <BarChart data={topMileage} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1">Mileage Over Time</Typography>
                <LineChart data={mileageOverTime} />
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    </>
  );
};

export default DashboardPage;
