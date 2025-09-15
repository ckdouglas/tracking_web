import React, { useState } from 'react';
import Tabs from '@mui/material/Tabs';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import Battery60Icon from '@mui/icons-material/Battery60';
import BatteryCharging60Icon from '@mui/icons-material/BatteryCharging60';
import Battery20Icon from '@mui/icons-material/Battery20';
import BatteryCharging20Icon from '@mui/icons-material/BatteryCharging20';
import ErrorIcon from '@mui/icons-material/Error';
import BuildIcon from '@mui/icons-material/Build';
import AppsIcon from '@mui/icons-material/Apps';
import PersonIcon from '@mui/icons-material/Person';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { devicesActions } from '../store';
import {
  formatAlarm, formatBoolean, formatPercentage, formatStatus, getStatusColor,
} from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { mapIconKey, mapIcons } from '../map/core/preloadImages';
// Import all PNGs from units-icons
import defaultIcon from '../resources/images/units-icons/default.png';
import A_1 from '../resources/images/units-icons/A_1.png';
import L_11 from '../resources/images/units-icons/L_11.png';
import L_13 from '../resources/images/units-icons/L_13.png';
import L_15 from '../resources/images/units-icons/L_15.png';
import N_1 from '../resources/images/units-icons/N_1.png';
import tileIcon from '../resources/images/units-icons/tile.png';

const unitIcons = {
  default: defaultIcon,
  A_1: A_1,
  L_11: L_11,
  L_13: L_13,
  L_15: L_15,
  N_1: N_1,
  tile: tileIcon,
};
import { useAdministrator } from '../common/util/permissions';
import EngineIcon from '../resources/images/data/engine.svg?react';
import { useAttributePreference } from '../common/util/preferences';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import MapIcon from '@mui/icons-material/Map';
import fetchOrThrow from '../common/util/fetchOrThrow';

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
  const [deviceIconUrl, setDeviceIconUrl] = useState(null);
  const [openSpanner, setOpenSpanner] = useState(false);
  const [tabIndex, setTabIndex] = useState(0); // 0: Info, 1: Icon
  const [selectedIcon, setSelectedIcon] = useState('');

  React.useEffect(() => {
    let isMounted = true;
    const currentItem = devices[index];
    async function fetchIcon() {
      if (currentItem && currentItem.attributes && currentItem.attributes.deviceImage) {
        const url = `/api/media/${currentItem.uniqueId}/${currentItem.attributes.deviceImage}`;
        try {
          const res = await fetch(url, { method: 'HEAD' });
          if (isMounted && res.ok) {
            setDeviceIconUrl(url);
            return;
          }
        } catch (error) {
          console.error('Error fetching device image:', error);
        }
      }
      // fallback to default icon
      setDeviceIconUrl(unitIcons.default);
    }
    fetchIcon();

    return () => {
      isMounted = false;
    };
  }, [devices, index, devices[index]?.attributes?.deviceImage]);

  const dispatch = useDispatch();
  const t = useTranslation();
  const { classes } = useStyles();
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const item = devices[index];
  const position = item?.positions?.[0];
  const lastSeen = position ? dayjs(position.timestamp).fromNow() : 'N/A';
  const devicePrimary = useAttributePreference('devicePrimary', 'name') || 'name';

  return (
    <>
      <ListItemButton
        selected={selectedDeviceId === item.id}
        onClick={e => {
          if (e.target.closest('.spanner-icon')) return;
          dispatch(devicesActions.selectId(item.id));
        }}
        sx={{
          minHeight: 40,
          width: '100%',
          padding: '6px 12px',
          margin: 0,
          borderRadius: 0,
          transition: 'box-shadow 0.2s',
          boxShadow: selectedDeviceId === item.id ? '0 2px 8px rgba(25, 118, 210, 0.08)' : 'none',
          background: 'none',
          color: (theme) => theme.palette.text.primary,
          borderBottom: '1px solid #888',
          '&:hover': {
            boxShadow: '0 2px 12px rgba(25, 118, 210, 0.12)',
            background: 'none',
          },
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1, overflow: 'hidden' }}>
          {/* Device icon: fetched from API if set, else default */}
          <img src={deviceIconUrl || unitIcons.default} alt="device icon" style={{ width: 24, height: 24, marginRight: 8, objectFit: 'contain', borderRadius: 4 }} />
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
            <AccessTimeIcon sx={{ color: '#888', fontSize: 20, marginLeft: 1 }} />
          </Tooltip>
          <IconButton size="small" className="spanner-icon" onClick={e => { e.stopPropagation(); setOpenSpanner(true); }}>
            <BuildIcon sx={{ color: '#888', fontSize: 20, marginLeft: 1 }} />
          </IconButton>
          <Tooltip title={position && position.attributes?.alarm ? `${t('eventAlarm')}: ${formatAlarm(position.attributes.alarm, t)}` : t('eventAlarm') + ': None'}>
            <IconButton size="small">
              <ErrorIcon fontSize="small" sx={{ fontSize: 20, color: position && position.attributes?.alarm ? '#d32f2f' : '#bdbdbd' }} />
            </IconButton>
          </Tooltip>
          {position && position.attributes?.ignition && (
            <Tooltip title={`${t('positionIgnition')}: ${formatBoolean(position.attributes.ignition, t)}`}>
              <IconButton size="small">
                {position.attributes.ignition ? (
                  <EngineIcon width={20} height={20} className={classes.success} />
                ) : (
                  <EngineIcon width={20} height={20} className={classes.neutral} />
                )}
              </IconButton>
            </Tooltip>
          )}
          {position && position.attributes?.batteryLevel && (
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
      {/* Device properties dialog (spanner icon) with tabs and icon selection */}
      {openSpanner && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(0,0,0,0.3)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setOpenSpanner(false)}>
          <Box sx={{ position: 'relative', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 6, minWidth: 340, maxWidth: 420, p: 3 }} onClick={e => e.stopPropagation()}>
            <IconButton
              aria-label="close"
              onClick={() => setOpenSpanner(false)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 10,
                color: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#333',
                background: 'rgba(0,0,0,0.08)',
                '&:hover': { background: 'rgba(0,0,0,0.18)' },
              }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6L16 16M16 6L6 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </IconButton>
            <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} variant="fullWidth" sx={{ mb: 2 }}>
              <Tab label={t('Device Info') || 'Device Info'} />
              <Tab label={t('Select Icon') || 'Select Icon'} />
            </Tabs>
            {tabIndex === 0 && (
              <>
                <Typography variant="h6" sx={{ mb: 2 }}>{item[devicePrimary]}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <img src={deviceIconUrl || unitIcons.default} alt="device icon" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6 }} />
                  <Typography variant="body2">ID: {item.id}</Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">Last seen: {lastSeen}</Typography>
                  <Typography variant="body2">Status: {item.status}</Typography>
                  {/* Add more device details here as needed */}
                </Box>
              </>
            )}
            {tabIndex === 1 && (
              <>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('Choose an icon') || 'Choose an icon'}</Typography>
                <Grid container spacing={2} sx={{ maxHeight: 180, overflowY: 'auto', mb: 2 }}>
                  {Object.entries(unitIcons).map(([key, icon]) => (
                    <Grid item xs={3} key={key}>
                      <IconButton
                        sx={{ border: selectedIcon === key ? '2px solid #1976d2' : '2px solid transparent', borderRadius: 2, p: 0.5 }}
                        onClick={() => setSelectedIcon(key)}
                      >
                        <img src={icon} alt={key} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 4 }} />
                      </IconButton>
                    </Grid>
                  ))}
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="contained"
                    disabled={!selectedIcon || selectedIcon === (item.icon || 'default')}
                    onClick={async () => {
                      try {
                        // Upload selected icon as device image
                        const iconFile = await fetch(unitIcons[selectedIcon]).then(r => r.blob());
                        const formData = new FormData();
                        formData.append('image', iconFile, `${selectedIcon}.png`);
                        const url = `/api/media/${item.uniqueId}/upload`;
                        await fetchOrThrow(url, {
                          method: 'POST',
                          body: formData,
                        });
                        setDeviceIconUrl(unitIcons[selectedIcon]);
                        setOpenSpanner(false);
                      } catch (err) {
                        alert('Failed to upload icon');
                      }
                    }}
                  >{t('Save Icon') || 'Save Icon'}</Button>
                </Box>
              </>
            )}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                sx={{
                  fontWeight: 500,
                  minWidth: 90,
                  color: (theme) => theme.palette.mode === 'dark' ? '#fff' : undefined,
                  borderColor: (theme) => theme.palette.mode === 'dark' ? '#fff' : undefined,
                }}
                onClick={() => setOpenSpanner(false)}
              >{t('Close') || 'Close'}</Button>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
};

export default DeviceRow;
