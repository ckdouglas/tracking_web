import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Typography, Badge, Menu, MenuItem, Box, Button, useMediaQuery, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import MapIcon from '@mui/icons-material/Map';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import PlaceIcon from '@mui/icons-material/Place';
import logo from '../../../public/logo.svg';
import { sessionActions } from '../../store';
import { useTranslation } from './LocalizationProvider';
import { useRestriction } from '../util/permissions';
import { nativePostMessage } from './NativeInterface';

const TopHeader = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const t = useTranslation();
  const readonly = useRestriction('readonly');
  const disableReports = useRestriction('disableReports');
  const user = useSelector((state) => state.session.user);
  const socket = useSelector((state) => state.session.socket);
  const [anchorEl, setAnchorEl] = useState(null);

  const currentSelection = () => {
    if (user && location.pathname === `/settings/user/${user.id}`) {
      return 'account';
    } if (location.pathname.startsWith('/settings')) {
      return 'settings';
    } if (location.pathname.startsWith('/reports')) {
      return 'reports';
    } if (location.pathname === '/') {
      return 'map';
    }
    return null;
  };

  const handleAccount = () => {
    setAnchorEl(null);
    navigate(`/settings/user/${user.id}`);
  };

  const handleLogout = async () => {
    setAnchorEl(null);
    const notificationToken = window.localStorage.getItem('notificationToken');
    if (notificationToken && !user.readonly) {
      window.localStorage.removeItem('notificationToken');
      const tokens = user.attributes.notificationTokens?.split(',') || [];
      if (tokens.includes(notificationToken)) {
        const updatedUser = {
          ...user,
          attributes: {
            ...user.attributes,
            notificationTokens: tokens.length > 1 ? tokens.filter((it) => it !== notificationToken).join(',') : undefined,
          },
        };
        await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUser),
        });
      }
    }
  await fetch('/api/session', { method: 'DELETE' });
  nativePostMessage('logout');
  localStorage.removeItem('user');
  navigate('/login');
  dispatch(sessionActions.updateUser(null));
  };

  const handleSelection = (value, event) => {
    switch (value) {
      case 'map':
        navigate('/');
        break;
      case 'reports':
        navigate('/reports/combined');
        break;
      case 'settings':
        navigate('/settings/preferences');
        break;
      case 'account':
        setAnchorEl(event.currentTarget);
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  return (
  <AppBar position="static" color="default" elevation={0} sx={{ background: '#fff', borderBottom: '1px solid #ccc' }}>
    <Toolbar sx={{ minHeight: 32 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        {/* Logo on far left */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
          <img src={logo} alt="Logo" style={{ height: 28, width: 28 }} />
        </Box>
        {/* Navigation buttons (desktop only) */}
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button color={currentSelection() === 'dashboard' ? 'primary' : 'inherit'} startIcon={<DashboardIcon />} onClick={() => navigate('/dashboard')} sx={{ textTransform: 'lowercase' }}>dashboard</Button>
            <Button color={currentSelection() === 'map' ? 'primary' : 'inherit'} startIcon={<Badge color="error" variant="dot" overlap="circular" invisible={socket !== false}><MapIcon /></Badge>} onClick={() => handleSelection('map')} sx={{ textTransform: 'lowercase' }}>tracking</Button>
            {!disableReports && (<Button color={currentSelection() === 'reports' ? 'primary' : 'inherit'} startIcon={<DescriptionIcon />} onClick={() => handleSelection('reports')} sx={{ textTransform: 'lowercase' }}>{t('reportTitle')}</Button>)}
            <Button color={location.pathname.startsWith('/geofences') ? 'primary' : 'inherit'} startIcon={<PlaceIcon />} onClick={() => navigate('/geofences')} sx={{ textTransform: 'lowercase' }}>geofences</Button>
            <Button color={location.pathname.startsWith('/settings/devices') ? 'primary' : 'inherit'} startIcon={<DeviceHubIcon />} onClick={() => navigate('/settings/devices')} sx={{ textTransform: 'lowercase' }}>units</Button>
            <Button color={location.pathname.startsWith('/settings/users') ? 'primary' : 'inherit'} startIcon={<PersonIcon />} onClick={() => navigate('/settings/users')} sx={{ textTransform: 'lowercase' }}>users</Button>
          </Box>
        )}
        {/* Spacer to push account/menu to far right */}
        <Box sx={{ flexGrow: 1 }} />
        {/* Account and menu icon on far right (mobile) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isMobile && (
            <IconButton color="inherit" onClick={() => setDrawerOpen(true)} sx={{ ml: 1 }}><MenuIcon /></IconButton>
          )}
          {readonly ? (
            <Button color="inherit" startIcon={<ExitToAppIcon />} onClick={() => handleSelection('logout')} sx={{ textTransform: 'lowercase' }}>{t('loginLogout')}</Button>
          ) : (
            <>
              {!isMobile && (
                <IconButton color={currentSelection() === 'settings' ? 'primary' : 'inherit'} onClick={() => handleSelection('settings')} sx={{ ml: 1 }}>
                  <SettingsIcon />
                </IconButton>
              )}
              <Button color={currentSelection() === 'account' ? 'primary' : 'inherit'} startIcon={<PersonIcon />} onClick={(event) => handleSelection('account', event)} sx={{ textTransform: 'lowercase' }}>
                {user?.name || user?.email || t('settingsUser')}
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Toolbar>
    {/* Mobile Drawer for menu */}
    {isMobile && (
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: '80vw', maxWidth: 320 } }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => { setDrawerOpen(false); navigate('/dashboard'); }}>
                <ListItemIcon><DashboardIcon /></ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => { setDrawerOpen(false); handleSelection('map'); }}>
                <ListItemIcon><MapIcon /></ListItemIcon>
                <ListItemText primary="Tracking" />
              </ListItemButton>
            </ListItem>
            {!disableReports && (
              <ListItem disablePadding>
                <ListItemButton onClick={() => { setDrawerOpen(false); handleSelection('reports'); }}>
                  <ListItemIcon><DescriptionIcon /></ListItemIcon>
                  <ListItemText primary={t('reportTitle')} />
                </ListItemButton>
              </ListItem>
            )}
            <ListItem disablePadding>
              <ListItemButton onClick={() => { setDrawerOpen(false); navigate('/geofences'); }}>
                <ListItemIcon><PlaceIcon /></ListItemIcon>
                <ListItemText primary="Geofences" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => { setDrawerOpen(false); navigate('/settings/devices'); }}>
                <ListItemIcon><DeviceHubIcon /></ListItemIcon>
                <ListItemText primary="Units" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => { setDrawerOpen(false); navigate('/settings/users'); }}>
                <ListItemIcon><PersonIcon /></ListItemIcon>
                <ListItemText primary="Users" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => { setDrawerOpen(false); handleSelection('settings'); }}>
                <ListItemIcon><SettingsIcon /></ListItemIcon>
                <ListItemText primary={t('settingsTitle')} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    )}
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
      <MenuItem onClick={handleAccount}><Typography color="textPrimary">{t('settingsUser')}</Typography></MenuItem>
      <MenuItem onClick={handleLogout}><Typography color="error">{t('loginLogout')}</Typography></MenuItem>
    </Menu>
  </AppBar>
  );
};

export default TopHeader;
