import { Bar } from 'react-chartjs-2';
import { Box } from '@mui/material';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.label),
    datasets: [{
      label: 'Mileage',
      data: data.map(d => d.value),
      backgroundColor: '#1976d2',
    }],
  };
  return (
    <Box sx={{ height: 180 }}>
      <Bar data={chartData} options={{ plugins: { legend: { display: false } } }} />
    </Box>
  );
};
export default BarChart;
