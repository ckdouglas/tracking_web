import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Grid, Paper, Typography, CircularProgress, Card, CardContent } from '@mui/material';
import TopHeader from '../common/components/TopHeader';
import PieChart from '../charts/PieChart';
import BarChart from '../charts/BarChart';
import LineChart from '../charts/LineChart';

// Utility function to fetch data from Traccar API
const fetchTraccar = async (endpoint) => {
  const response = await fetch(`/api/${endpoint}`);
  if (!response.ok) throw new Error(`API error : ${endpoint}`);
  return response.json();
};

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [positions, setPositions] = useState([]);
  const [error, setError] = useState(null);
  const user = useSelector((state) => state.session.user);
  const navigate = useNavigate();
  // Redirect to login if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  if (!user) return null;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const from = new Date(now.getTime() - 24*60*60*1000).toISOString(); // last 24h
        const to = now.toISOString();
        const [devicesData, positionsData] = await Promise.all([
          fetchTraccar('devices'),
          fetchTraccar('positions'),
        ]);
        setDevices(devicesData);
        setPositions(positionsData);
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

  // Compute motion state pie chart data from positions
  const motionStateCounts = {
    'Stationary': 0,
    'Moving': 0,
  };
  positions.forEach(pos => {
    if (typeof pos.attributes?.motion === 'boolean') {
      if (pos.attributes.motion) {
        motionStateCounts['Moving']++;
      } else {
        motionStateCounts['Stationary']++;
      }
    } else {
      // Fallback: if speed > 0, treat as moving
      if (typeof pos.speed === 'number' && pos.speed > 0) {
        motionStateCounts['Moving']++;
      } else {
        motionStateCounts['Stationary']++;
      }
    }
  });
  const motionStateData = [
    { label: 'Stationary', value: motionStateCounts['Stationary'], color: '#F44336' },
    { label: 'Moving', value: motionStateCounts['Moving'], color: '#8BC34A' },
  ];

  return (
    <>
      <TopHeader />
      <Box sx={{ p: 2 }}>
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
                <Typography variant="subtitle1" sx={{ color: (theme) => theme.palette.text.primary }}>Connection State</Typography>
                <PieChart data={connectionStateData} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ color: (theme) => theme.palette.text.primary }}>Health Check Status</Typography>
                <PieChart data={healthCheckData} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ color: (theme) => theme.palette.text.primary }}>Top Units by Mileage</Typography>
                <BarChart data={topMileage} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ color: (theme) => theme.palette.text.primary }}>Mileage Over Time</Typography>
                <LineChart data={mileageOverTime} />
              </Paper>
            </Grid>
            {/* Remove the legend (right side color bars, labels, and values) from the Motion State card */}
            <Grid item xs={12} md={8}>
              <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2, p: 2 }}>
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, flexGrow: 1, color: (theme) => theme.palette.text.primary }}>Motion state</Typography>
                    <Typography variant="caption" sx={{ color: '#43a047', fontWeight: 500, mr: 2 }}>ONLINE DATA</Typography>
                    <Box component="span" sx={{ ml: 1 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>ⓘ</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Box sx={{ minWidth: 180 }}>
                      <PieChart data={motionStateData} centerLabel={motionStateData.reduce((sum, d) => sum + d.value, 0)} />
                    </Box>
                    {/* Legend removed as requested */}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </>
  );
};

export default DashboardPage;
