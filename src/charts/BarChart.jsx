// import { Bar } from 'react-chartjs-2';
// import { Box } from '@mui/material';
// import {
//   Chart,
//   CategoryScale,
//   LinearScale,
//   BarController,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// } from 'chart.js';

// Chart.register(
//   CategoryScale,
//   LinearScale,
//   BarController,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// );

// const BarChart = ({ data }) => {
//   const chartData = {
//     labels: data.map(d => d.label),
//     datasets: [{
//       label: 'Mileage',
//       data: data.map(d => d.value),
//       backgroundColor: '#1976d2',
//     }],
//   };
//   return (
//     <Box sx={{ height: 180 }}>
//       <Bar data={chartData} options={{ plugins: { legend: { display: false } } }} />
//     </Box>
//   );
// };
// export default BarChart;


//-------------------------------------------------------------------------------------------

// BarChart.jsx - Enhanced version
import { Bar } from 'react-chartjs-2';
import { Box, Typography } from '@mui/material';
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

const BarChart = ({ data, title = 'Mileage', color = '#1976d2' }) => {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          No data available
        </Typography>
      </Box>
    );
  }

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [{
      label: title,
      data: data.map(d => d.value),
      backgroundColor: color,
      borderColor: color,
      borderWidth: 1,
      borderRadius: 4,
      borderSkipped: false,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} km`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f0f0f0',
        },
        ticks: {
          callback: function(value) {
            return value + ' km';
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 4
      }
    }
  };

  return (
    <Box sx={{ height: 280, width: '100%', p: 1 }}>
      <Bar data={chartData} options={options} />
    </Box>
  );
};

export default BarChart;

