import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Grid, Paper, Typography, CircularProgress, Card, CardContent, ToggleButtonGroup, ToggleButton, TextField, Stack, Button } from '@mui/material';
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
  const [range, setRange] = useState('week'); // today | yesterday | week | month | custom
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
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
        let fromIso;
        let toIso;
        const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        if (range === 'custom' && customFrom && customTo) {
          fromIso = new Date(customFrom).toISOString();
          toIso = new Date(customTo).toISOString();
        } else if (range === 'today') {
          fromIso = startOfDay(now).toISOString();
          toIso = endOfDay(now).toISOString();
        } else if (range === 'yesterday') {
          const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          fromIso = startOfDay(y).toISOString();
          toIso = endOfDay(y).toISOString();
        } else if (range === 'month') {
          const first = new Date(now.getFullYear(), now.getMonth(), 1);
          fromIso = startOfDay(first).toISOString();
          toIso = endOfDay(now).toISOString();
        } else { // week (default)
          const w = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          fromIso = startOfDay(w).toISOString();
          toIso = endOfDay(now).toISOString();
        }
        const [devicesData, positionsData] = await Promise.all([
          fetchTraccar('devices'),
          fetchTraccar(`positions?from=${fromIso}&to=${toIso}`),
        ]);
        setDevices(devicesData);
        setPositions(positionsData);
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    };
    loadData();
  }, [range, customFrom, customTo]);

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
        {/* Filter Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            value={range}
            exclusive
            onChange={(e, val) => { if (val) setRange(val); }}
            size="small"
          >
            <ToggleButton value="today">Today</ToggleButton>
            <ToggleButton value="yesterday">Yesterday</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="custom">Custom</ToggleButton>
          </ToggleButtonGroup>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
            <TextField
              type="date"
              label="From"
              size="small"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={range !== 'custom'}
            />
            <TextField
              type="date"
              label="To"
              size="small"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={range !== 'custom'}
            />
            <Button
              variant="contained"
              size="small"
              onClick={() => { /* trigger reload by toggling a state when custom */ setCustomTo((v) => v); }}
              disabled={range === 'custom' && (!customFrom || !customTo)}
            >
              Apply
            </Button>
          </Stack>
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
            
          <Grid container spacing={2}>
                {[
                  {
                    title: "Health check status",
                    content: <PieChart data={healthCheckData} />
                  },
                  {
                    title: "Latest notifications",
                    content: <Typography variant="body2" color="textSecondary">No data</Typography>
                  },
                  {
                    title: "Connection state",
                    content: <PieChart data={connectionStateData} />
                  },
                  {
                    title: "Motion state",
                    content: (
                      <PieChart
                        data={motionStateData}
                        centerLabel={motionStateData.reduce((sum, d) => sum + d.value, 0)}
                        showLegend
                      />
                    )
                  },
                  {
                    title: "Geofences with units",
                    content: <Typography variant="body2" color="textSecondary">No data</Typography>
                  },
                  {
                    title: "Mileage",
                    content: <LineChart data={mileageOverTime} />
                  },
                  {
                    title: "Top units by fuel consumption",
                    content: topMileage.length > 0 ? (
                      <BarChart data={topMileage} title="Fuel" color="#1976d2" />
                    ) : (
                      <Typography variant="body2" color="textSecondary">No data</Typography>
                    )
                  },
                  {
                    title: "Consumed by FLS",
                    content: <Typography variant="body2" color="textSecondary">No data</Typography>
                  },
                  {
                    title: "Speedings",
                    content: <Typography variant="body2" color="textSecondary">No data</Typography>
                  },
                  {
                    title: "Top units by mileage",
                    content: topMileage.length > 0 ? (
                      <BarChart data={topMileage} title="Mileage" color="#1976d2" />
                    ) : (
                      <Typography variant="body2" color="textSecondary">No data</Typography>
                    )
                  }
                ].map((card, i) => (
                  <Grid key={i} item xs={12} sm={6} md={4} display="flex">
                    <Paper
                      sx={{
                        p: 2,
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                        height: 360
                      }}
                    >
                      <Typography variant="h6" gutterBottom>
                        {card.title}
                      </Typography>
                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {card.content}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
        )}
      </Box>
    </>
  );
};

export default DashboardPage;


