import { Line } from 'react-chartjs-2';
import { Box } from '@mui/material';

const LineChart = ({ data }) => {
  const chartData = {
    labels: data.map((d, i) => `Device ${d.x}`),
    datasets: [{
      label: 'Mileage',
      data: data.map(d => d.y),
      borderColor: '#388e3c',
      backgroundColor: 'rgba(56,142,60,0.1)',
      fill: true,
    }],
  };
  return (
    <Box sx={{ height: 180 }}>
      <Line data={chartData} options={{ plugins: { legend: { position: 'bottom' } } }} />
    </Box>
  );
};
export default LineChart;
