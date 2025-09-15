// import { Line } from 'react-chartjs-2';
// import { Box } from '@mui/material';
// import {
//   Chart,
//   CategoryScale,
//   LinearScale,
//   LineController,
//   LineElement,
//   PointElement,
//   Title,
//   Tooltip,
//   Legend
// } from 'chart.js';

// Chart.register(
//   CategoryScale,
//   LinearScale,
//   LineController,
//   LineElement,
//   PointElement,
//   Title,
//   Tooltip,
//   Legend
// );

// const LineChart = ({ data }) => {
//   const chartData = {
//     labels: data.map((d, i) => `Device ${d.x}`),
//     datasets: [{
//       label: 'Mileage',
//       data: data.map(d => d.y),
//       borderColor: '#388e3c',
//       backgroundColor: 'rgba(56,142,60,0.1)',
//       fill: true,
//     }],
//   };
//   return (
//     <Box sx={{ height: 180 }}>
//       <Line data={chartData} options={{ plugins: { legend: { position: 'bottom' } } }} />
//     </Box>
//   );
// };
// export default LineChart;



// ====================================================================

// LineChart.jsx - Enhanced version
import { Line } from 'react-chartjs-2';
import { Box, Typography } from '@mui/material';
import {
  Chart,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const LineChart = ({ data, title = 'Mileage Over Time', color = '#388e3c' }) => {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          No time series data available
        </Typography>
      </Box>
    );
  }

  const chartData = {
    labels: data.map(d => d.x), // Now properly uses time labels
    datasets: [{
      label: title,
      data: data.map(d => d.y),
      borderColor: color,
      backgroundColor: color.replace(')', ', 0.1)').replace('rgb', 'rgba'),
      fill: true,
      tension: 0.4, // Smooth curves
      pointBackgroundColor: color,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
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
          minRotation: 0,
          maxTicksLimit: 8 // Prevent overcrowding
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return (
    <Box sx={{ height: 280, width: '100%', p: 1 }}>
      <Line data={chartData} options={options} />
    </Box>
  );
};

export default LineChart;