// import { Pie } from 'react-chartjs-2';
// import { Box, useTheme } from '@mui/material';
// import {
//   Chart,
//   ArcElement,
//   Tooltip,
//   Legend
// } from 'chart.js';

// Chart.register(
//   ArcElement,
//   Tooltip,
//   Legend
// );

// const PieChart = ({ data }) => {
//   const theme = useTheme();
//   const legendColor = theme.palette.mode === 'dark' ? '#fff' : '#222';
//   const chartData = {
//     labels: data.map(d => d.label),
//     datasets: [{
//       data: data.map(d => d.value),
//       backgroundColor: data.map(d => d.color),
//     }],
//   };
//   const options = {
//     plugins: {
//       legend: {
//         position: 'right',
//         labels: {
//           boxWidth: 16,
//           boxHeight: 16,
//           borderRadius: 0,
//           padding: 16,
//           font: {
//             size: 12,
//             family: 'Roboto, Arial, sans-serif',
//             weight: '400',
//           },
//           usePointStyle: false,
//           color: legendColor,
//           generateLabels: (chart) => {
//             const { data: chartData } = chart.data.datasets[0];
//             return chart.data.labels.map((label, i) => {
//               return {
//                 text: `${label} (${chartData[i]})`,
//                 fillStyle: chart.data.datasets[0].backgroundColor[i],
//                 strokeStyle: chart.data.datasets[0].backgroundColor[i],
//                 index: i,
//                 hidden: chart.getDatasetMeta(0).data[i]?.hidden,
//               };
//             });
//           },
//         },
//         align: 'center', // vertical center
//         fullSize: true,
//         maxWidth: 180,
//       },
//     },
//     maintainAspectRatio: false,
//   };
//   return (
//     <Box sx={{ height: 120, minHeight: 120, width: '100%' }}>
//       <Pie data={chartData} options={options} />
//     </Box>
//   );
// };
// export default PieChart;



// ====================================================================

// PieChart.jsx - Enhanced version
import { Doughnut } from 'react-chartjs-2';
import { Box, Typography } from '@mui/material';
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

const PieChart = ({ data, centerLabel, showLegend = true, size = 'medium' }) => {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ 
        height: size === 'small' ? 120 : 180, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Typography variant="body2" color="textSecondary">
          No data available
        </Typography>
      </Box>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  
  const chartData = {
    labels: data.map(d => d.label),
    datasets: [{
      data: data.map(d => d.value),
      backgroundColor: data.map(d => d.color),
      borderWidth: 2,
      borderColor: '#fff',
      hoverBorderWidth: 3,
      hoverBorderColor: '#fff',
    }],
  };

  const getHeight = () => {
    switch(size) {
      case 'small': return 120;
      case 'large': return 240;
      default: return 180;
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: centerLabel ? '65%' : '0%', // Doughnut style if center label
    plugins: {
      legend: {
        display: showLegend,
        position: 'right',
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          borderRadius: 2,
          padding: 12,
          font: {
            size: 11,
            family: 'Roboto, Arial, sans-serif',
            weight: '400',
          },
          usePointStyle: true,
          generateLabels: (chart) => {
            const { data: chartData } = chart.data.datasets[0];
            return chart.data.labels.map((label, i) => {
              const value = chartData[i];
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return {
                text: `${label}: ${value} (${percentage}%)`,
                fillStyle: chart.data.datasets[0].backgroundColor[i],
                strokeStyle: chart.data.datasets[0].backgroundColor[i],
                index: i,
                hidden: chart.getDatasetMeta(0).data[i]?.hidden,
              };
            });
          },
        },
        align: 'center',
        fullSize: false,
        maxWidth: showLegend ? 200 : 0,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed;
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true
    }
  };

  const centerPlugin = {
    id: 'centerText',
    beforeDraw: function(chart) {
      if (centerLabel && chart.config.options.cutout) {
        const { width, height, ctx } = chart;
        ctx.restore();
        
        const fontSize = (height / 114).toFixed(2);
        ctx.font = `bold ${fontSize}em Roboto, Arial, sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#333';
        
        const text = centerLabel.toString();
        const textX = Math.round((width - ctx.measureText(text).width) / 2);
        const textY = height / 2;
        
        ctx.fillText(text, textX, textY);
        
        // Add "Total" label below
        ctx.font = `${(fontSize * 0.6).toFixed(2)}em Roboto, Arial, sans-serif`;
        ctx.fillStyle = '#666';
        const labelText = 'Total';
        const labelX = Math.round((width - ctx.measureText(labelText).width) / 2);
        const labelY = textY + 20;
        ctx.fillText(labelText, labelX, labelY);
        
        ctx.save();
      }
    }
  };

  return (
    <Box sx={{ 
      height: getHeight(), 
      minHeight: getHeight(), 
      width: '100%', 
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    }}>
      <Doughnut 
        data={chartData} 
        options={options} 
        plugins={centerLabel ? [centerPlugin] : []}
      />
    </Box>
  );
};

export default PieChart;