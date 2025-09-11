import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import Battery60Icon from '@mui/icons-material/Battery60';
import BatteryCharging60Icon from '@mui/icons-material/BatteryCharging60';
import Battery20Icon from '@mui/icons-material/Battery20';
import BatteryCharging20Icon from '@mui/icons-material/BatteryCharging20';
import ErrorIcon from '@mui/icons-material/Error';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { devicesActions } from '../store';
import {
  formatAlarm, formatBoolean, formatPercentage, formatStatus, getStatusColor,
} from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { mapIconKey, mapIcons } from '../map/core/preloadImages';
import { useAdministrator } from '../common/util/permissions';
import EngineIcon from '../resources/images/data/engine.svg?react';
import { useAttributePreference } from '../common/util/preferences';

dayjs.extend(relativeTime);

const useStyles = makeStyles()((theme) => ({
  icon: {
    width: '25px',
    height: '25px',
    filter: 'brightness(0) invert(1)',
  },
  batteryText: {
    fontSize: '0.75rem',
    fontWeight: 'normal',
    lineHeight: '0.875rem',
  },
  success: {
    color: theme.palette.success.main,
  },
  warning: {
    color: theme.palette.warning.main,
  },
  error: {
    color: theme.palette.error.main,
  },
  neutral: {
    color: theme.palette.neutral.main,
  },
  selected: {
    backgroundColor: theme.palette.action.selected,
  },
}));

const DeviceRow = ({ devices, index, style }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const t = useTranslation();

  const admin = useAdministrator();
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);

  const item = devices[index];
  const position = useSelector((state) => state.session.positions[item.id]);

  // Define lastSeen for use in tooltip
  let lastSeen = '';
  if (item.lastUpdate) {
    lastSeen = dayjs(item.lastUpdate).fromNow();
  } else {
    lastSeen = 'Never';
  }

  const devicePrimary = useAttributePreference('devicePrimary', 'name');
  const deviceSecondary = useAttributePreference('deviceSecondary', '');

  const secondaryText = () => {
    let status;
    if (item.status === 'online' || !item.lastUpdate) {
      status = formatStatus(item.status, t);
    } else {
      status = dayjs(item.lastUpdate).fromNow();
    }
    return (
      <>
        {deviceSecondary && item[deviceSecondary] && `${item[deviceSecondary]} • `}
        <span className={classes[getStatusColor(item.status)]}>{status}</span>
      </>
    );
  };

return (
  <ListItemButton
    selected={selectedDeviceId === item.id}
    onClick={() => dispatch(devicesActions.selectId(item.id))}
    style={{
      minHeight: 40,
      width: '100%',
      padding: '6px 12px',
      margin: 0,
      borderRadius: 10,
      transition: 'box-shadow 0.2s',
      boxShadow: selectedDeviceId === item.id ? '0 2px 8px rgba(25, 118, 210, 0.08)' : 'none',
      background: selectedDeviceId === item.id ? '#f5faff' : 'white',
    }}
    sx={{
      '&:hover': {
        boxShadow: '0 2px 12px rgba(25, 118, 210, 0.12)',
        background: '#f0f7ff',
      },
    }}
  >
    <span style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1, overflow: 'hidden' }}>
      <DirectionsCarIcon sx={{ color: '#1976d2', fontSize: 20, mr: 1 }} />
      <span style={{ fontWeight: 500, marginRight: 12, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: 120, fontSize: '0.95rem'}}>{item[devicePrimary]}</span>
    </span>
    <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span
        style={{
          display: 'inline-block',
          width: 12,
          height: 12,
          borderRadius: '50%',
          marginRight: 8,
          backgroundColor: item.status === 'online' ? '#4caf50' : '#f44336',
          boxShadow: '0 0 4px rgba(0,0,0,0.08)',
        }}
      />
      <Tooltip title={
        position && position.address
          ? position.address
          : position && position.latitude && position.longitude
            ? `${position.latitude}, ${position.longitude}`
            : 'No location data'
      }>
        <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 4 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={position && position.latitude && position.longitude ? '#1976d2' : '#bdbdbd'}>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </span>
      </Tooltip>
      <Tooltip title={lastSeen}>
        <AccessTimeIcon sx={{ color: '#888', fontSize: 17, marginLeft: 1 }} />
      </Tooltip>
      {position && position.attributes.hasOwnProperty('alarm') && (
        <Tooltip title={`${t('eventAlarm')}: ${formatAlarm(position.attributes.alarm, t)}`}>
          <IconButton size="small">
            <ErrorIcon fontSize="small" className={classes.error} />
          </IconButton>
        </Tooltip>
      )}
      {position && position.attributes.hasOwnProperty('ignition') && (
        <Tooltip title={`${t('positionIgnition')}: ${formatBoolean(position.attributes.ignition, t)}`}>
          <IconButton size="small">
            {position.attributes.ignition ? (
              <EngineIcon width={18} height={18} className={classes.success} />
            ) : (
              <EngineIcon width={18} height={18} className={classes.neutral} />
            )}
          </IconButton>
        </Tooltip>
      )}
      {position && position.attributes.hasOwnProperty('batteryLevel') && (
        <Tooltip title={`${t('positionBatteryLevel')}: ${formatPercentage(position.attributes.batteryLevel)}`}>
          <IconButton size="small">
            {position.attributes.batteryLevel > 70
              ? position.attributes.charge
                ? <BatteryChargingFullIcon fontSize="small" className={classes.success} />
                : <BatteryFullIcon fontSize="small" className={classes.success} />
              : position.attributes.batteryLevel > 30
                ? position.attributes.charge
                  ? <BatteryCharging60Icon fontSize="small" className={classes.warning} />
                  : <Battery60Icon fontSize="small" className={classes.warning} />
                : position.attributes.charge
                  ? <BatteryCharging20Icon fontSize="small" className={classes.error} />
                  : <Battery20Icon fontSize="small" className={classes.error} />
            }
          </IconButton>
        </Tooltip>
      )}
    </span>
  </ListItemButton>
);
};

export default DeviceRow;
