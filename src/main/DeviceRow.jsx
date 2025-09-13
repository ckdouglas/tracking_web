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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';

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

  React.useEffect(() => {
    let isMounted = true;
    const currentItem = devices[index];
    async function fetchIcon() {
      if (currentItem && currentItem.icon) {
        const url = currentItem.icon.startsWith('http') ? currentItem.icon : `/api/media/${currentItem.uniqueId}/${currentItem.icon}`;
        try {
          const res = await fetch(url, { method: 'HEAD' });
          if (isMounted && res.ok) {
            setDeviceIconUrl(url);
          } else if (isMounted) {
            setDeviceIconUrl(unitIcons.default);
          }
        } catch {
          if (isMounted) setDeviceIconUrl(unitIcons.default);
        }
      } else {
        if (isMounted) setDeviceIconUrl(unitIcons.default);
      }
    }
    fetchIcon();
    return () => { isMounted = false; };
  }, [devices, index]);
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

  const [openSpanner, setOpenSpanner] = React.useState(false);
  const [tabIndex, setTabIndex] = useState(2); // Default to 'Icon' tab
  const [rotateIcon, setRotateIcon] = useState(false);
  const [iconLibraryOpen, setIconLibraryOpen] = useState(false);
  const iconOptions = [
    { name: 'Car', icon: <DirectionsCarIcon sx={{ fontSize: 32 }} /> },
    { name: 'Bus', icon: <DeviceHubIcon sx={{ fontSize: 32 }} /> },
    { name: 'Person', icon: <PersonIcon sx={{ fontSize: 32 }} /> },
    { name: 'Map', icon: <MapIcon sx={{ fontSize: 32 }} /> },
    { name: 'Build', icon: <BuildIcon sx={{ fontSize: 32 }} /> },
    // Add more icons as needed
  ];
  const [selectedIcon, setSelectedIcon] = useState(null);
  // Ensure selectedIcon is set to current device icon when dialog opens
  React.useEffect(() => {
    if (openSpanner) {
      setSelectedIcon(item.icon || 'Car');
    }
  }, [openSpanner, item.icon]);
  const [timestamp, setTimestamp] = useState(Date.now());

  const handleSaveIcon = async () => {
    // Save selected icon to backend for this device using the image API
    if (selectedIcon) {
      // Get the image URL from unitIcons
      const imageUrl = unitIcons[selectedIcon];
      // Fetch the image as a blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      // Send the blob directly as the request body
      await fetchOrThrow(`/api/devices/${item.id}/image`, {
        method: 'POST',
        body: blob,
      });
      // Refetch device data to update icon property
      try {
        const deviceRes = await fetchOrThrow(`/api/devices/${item.id}`);
        const updatedDevice = await deviceRes.json();
        // Optionally, update the device in Redux if needed
        // dispatch(devicesActions.update(updatedDevice));
      } catch (e) {
        // ignore fetch error
      }
      setOpenSpanner(false);
      setTimestamp(Date.now()); // refresh device list if needed
    }
  };

  return (
    <>
      <ListItemButton
        selected={selectedDeviceId === item.id}
        onClick={e => {
          // Prevent row selection if spanner icon is clicked
          if (e.target.closest('.spanner-icon')) return;
          dispatch(devicesActions.selectId(item.id));
        }}
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
          {/* Device icon: fetched from API if set, else default */}
          <img src={deviceIconUrl} alt="device icon" style={{ width: 24, height: 24, marginRight: 8, objectFit: 'contain', borderRadius: 4 }} />
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
          <Tooltip title={position && position.attributes.hasOwnProperty('alarm') ? `${t('eventAlarm')}: ${formatAlarm(position.attributes.alarm, t)}` : t('eventAlarm') + ': None'}>
            <IconButton size="small">
              <ErrorIcon fontSize="small" sx={{ fontSize: 20, color: position && position.attributes.hasOwnProperty('alarm') ? '#d32f2f' : '#bdbdbd' }} />
            </IconButton>
          </Tooltip>
          {position && position.attributes.hasOwnProperty('ignition') && (
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
      <Dialog open={openSpanner} onClose={() => setOpenSpanner(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Unit properties – {item.name || item[devicePrimary]}</DialogTitle>
        <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="General" />
          <Tab label="Access" />
          <Tab label="Icon" />
          <Tab label="Advanced" />
          <Tab label="Sensors" />
          <Tab label="Custom fields" />
          <Tab label="Unit groups" />
          <Tab label="Commands" />
          <Tab label="Eco driving" />
          <Tab label="Profile" />
          <Tab label="Trip detector" />
          <Tab label="Service intervals" />
          <Tab label="Health check" />
        </Tabs>
        <DialogContent dividers sx={{ minHeight: 320 }}>
          {tabIndex === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 3, alignItems: 'flex-start', mt: 2 }}>
              <Box sx={{ width: 120, height: 120, border: '1px solid #eee', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fafafa', mr: 2 }}>
                {/* Show selected icon, fallback to default icon */}
                <img
                  src={unitIcons[selectedIcon] || unitIcons['default']}
                  alt={selectedIcon || 'default'}
                  style={{ width: 100, height: 100, objectFit: 'contain', transform: rotateIcon ? 'rotate(90deg)' : 'none' }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Button variant="outlined" startIcon={<AppsIcon />} sx={{ mb: 2 }} disabled>Icon library</Button>
                <FormControlLabel
                  control={<Checkbox checked={rotateIcon} onChange={e => setRotateIcon(e.target.checked)} />}
                  label="Rotate icon"
                />
                {/* Scrollable icon grid */}
                <Box sx={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #eee', borderRadius: 1, p: 1, mt: 2, bgcolor: '#fafafa' }}>
                  <Grid container spacing={1}>
                    {Object.entries(unitIcons).map(([key, src]) => (
                      <Grid item key={key} xs={2} sm={1} md={1} lg={1} xl={1}>
                        <IconButton
                          onClick={() => setSelectedIcon(key)}
                          sx={{ border: selectedIcon === key ? '2px solid #1976d2' : '2px solid transparent', borderRadius: 2, p: 0.5 }}
                        >
                          <img src={src} alt={key} style={{ width: 40, height: 40, objectFit: 'contain' }} />
                        </IconButton>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
                {selectedIcon && (
                  <Typography variant="body2" sx={{ mt: 2 }}>Selected Icon: {selectedIcon}</Typography>
                )}
              </Box>
            </Box>
          )}
          {tabIndex !== 2 && (
            <Box sx={{ mt: 2, color: '#aaa', textAlign: 'center' }}>
              <Typography variant="body2">This section is under construction.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSpanner(false)}>Cancel</Button>
          <Button onClick={handleSaveIcon} disabled={!selectedIcon} variant="contained" color="primary">OK</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeviceRow;
