import { Pie } from 'react-chartjs-2';
import { Box } from '@mui/material';
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(
  ArcElement,
  Tooltip,
  Legend
);

const PieChart = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.label),
    datasets: [{
      data: data.map(d => d.value),
      backgroundColor: data.map(d => d.color),
    }],
  };
  const options = {
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 16,
          boxHeight: 16,
          borderRadius: 0,
          padding: 16,
          font: {
            size: 12,
            family: 'Roboto, Arial, sans-serif',
            weight: '400',
          },
          usePointStyle: false,
          generateLabels: (chart) => {
            const { data: chartData } = chart.data.datasets[0];
            return chart.data.labels.map((label, i) => {
              return {
                text: `${label} (${chartData[i]})`,
                fillStyle: chart.data.datasets[0].backgroundColor[i],
                strokeStyle: chart.data.datasets[0].backgroundColor[i],
                index: i,
                hidden: chart.getDatasetMeta(0).data[i]?.hidden,
              };
            });
          },
        },
        align: 'center', // vertical center
        fullSize: true,
        maxWidth: 180,
      },
    },
    maintainAspectRatio: false,
  };
  return (
    <Box sx={{ height: 120, minHeight: 120, width: '100%' }}>
      <Pie data={chartData} options={options} />
    </Box>
  );
};
export default PieChart;
