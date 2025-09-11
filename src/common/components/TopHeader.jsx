import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Typography, Badge, Menu, MenuItem, Box, Button
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import MapIcon from '@mui/icons-material/Map';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import logo from '../../../public/logo.svg';
import { sessionActions } from '../../store';
import { useTranslation } from './LocalizationProvider';
import { useRestriction } from '../util/permissions';
import { nativePostMessage } from './NativeInterface';

const TopHeader = () => {
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
    if (location.pathname === `/settings/user/${user.id}`) {
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
          {/* Navigation buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                color={currentSelection() === 'dashboard' ? 'primary' : 'inherit'}
                       startIcon={<MapIcon />}
                onClick={() => navigate('/dashboard')}
                sx={{ textTransform: 'lowercase' }}
              >
                dashboard
              </Button>
            <Button
              color={currentSelection() === 'map' ? 'primary' : 'inherit'}
              startIcon={
                <Badge color="error" variant="dot" overlap="circular" invisible={socket !== false}>
                  <MapIcon />
                </Badge>
              }
              onClick={() => handleSelection('map')}
              sx={{ textTransform: 'lowercase' }}
            >
              tracking
            </Button>
            {!disableReports && (
              <Button
                color={currentSelection() === 'reports' ? 'primary' : 'inherit'}
                startIcon={<DescriptionIcon />}
                onClick={() => handleSelection('reports')}
                sx={{ textTransform: 'lowercase' }}
              >
                {t('reportTitle')}
              </Button>
            )}
            <Button
              color={location.pathname.startsWith('/geofences') ? 'primary' : 'inherit'}
              startIcon={<MapIcon />}
              onClick={() => navigate('/geofences')}
              sx={{ textTransform: 'lowercase' }}
            >
              geofences
            </Button>
            <Button
              color={location.pathname.startsWith('/settings/devices') ? 'primary' : 'inherit'}
              startIcon={<MapIcon />}
              onClick={() => navigate('/settings/devices')}
              sx={{ textTransform: 'lowercase' }}
            >
              units
            </Button>
            <Button
              color={location.pathname.startsWith('/settings/users') ? 'primary' : 'inherit'}
              startIcon={<PersonIcon />}
              onClick={() => navigate('/settings/users')}
              sx={{ textTransform: 'lowercase' }}
            >
              users
            </Button>
            <Button
              color={currentSelection() === 'settings' ? 'primary' : 'inherit'}
              startIcon={<SettingsIcon />}
              onClick={() => handleSelection('settings')}
              sx={{ textTransform: 'lowercase' }}
            >
              {t('settingsTitle')}
            </Button>
          </Box>
          {/* Spacer to push account button to far right */}
          <Box sx={{ flexGrow: 1 }} />
          {/* Account button on far right */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {readonly ? (
              <Button
                color="inherit"
                startIcon={<ExitToAppIcon />}
                onClick={() => handleSelection('logout')}
                sx={{ textTransform: 'lowercase' }}
              >
                {t('loginLogout')}
              </Button>
            ) : (
              <Button
                color={currentSelection() === 'account' ? 'primary' : 'inherit'}
                startIcon={<PersonIcon />}
                onClick={(event) => handleSelection('account', event)}
                sx={{ textTransform: 'lowercase' }}
              >
                {t('settingsUser')}
              </Button>
            )}
          </Box>
        </Box>
      </Toolbar>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={handleAccount}>
          <Typography color="textPrimary">{t('settingsUser')}</Typography>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Typography color="error">{t('loginLogout')}</Typography>
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default TopHeader;
