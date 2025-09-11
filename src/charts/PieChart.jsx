import { Pie } from 'react-chartjs-2';
import { Box } from '@mui/material';

const PieChart = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.label),
    datasets: [{
      data: data.map(d => d.value),
      backgroundColor: data.map(d => d.color),
    }],
  };
  return (
    <Box sx={{ height: 180 }}>
      <Pie data={chartData} options={{ plugins: { legend: { position: 'bottom' } } }} />
    </Box>
  );
};
export default PieChart;
