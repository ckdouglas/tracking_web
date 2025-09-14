import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {Table, TableRow, TableCell, TableBody, Button, Toolbar, Typography, Divider, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Paper, FormControlLabel, Switch
} from '@mui/material';
import { useMediaQuery, useTheme } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LinkIcon from '@mui/icons-material/Link';
import AddIcon from '@mui/icons-material/Add';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import { useCatch, useEffectAsync } from '../reactHelper';
import { formatBoolean, formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import MainMap from '../main/MainMap';
import { useSelector } from 'react-redux';

const UsersPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { classes } = useSettingsStyles();
  const navigate = useNavigate();
  const t = useTranslation();

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  const [infoUser, setInfoUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [connectionsUser, setConnectionsUser] = useState(null);
  const positions = useSelector((state) => state.session.positions);

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const response = await fetchOrThrow('/api/users?excludeAttributes=true');
      setItems(await response.json());
    } finally {
      setLoading(false);
    }
  }, [timestamp]);

  const handleExport = async () => {
    // Implement export logic similar to devices
  };

  const handleLogin = useCatch(async (userId) => {
    await fetchOrThrow(`/api/session/${userId}`);
    window.location.replace('/');
  });

  const actionLogin = {
    key: 'login',
    title: t('loginLogin'),
    icon: <LoginIcon fontSize="small" />,
    handler: handleLogin,
  };

  const actionConnections = {
    key: 'connections',
    title: t('sharedConnections'),
    icon: <LinkIcon fontSize="small" />,
  handler: (userId) => setConnectionsUser(userId),
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <Paper
        square
        sx={{
          width: isMobile ? '100%' : 340,
          minWidth: isMobile ? '100%' : 340,
          maxWidth: isMobile ? '100%' : 340,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          height: '100%',
        }}
      >
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>{t('userTitle') || 'Users'}</Typography>
          <IconButton size="small" color="primary" onClick={() => setShowAddDialog(true)} sx={{ ml: 1 }}>
            <AddIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
        <Divider />
        <div style={{ flexGrow: 1, overflow: 'auto' }}>
        
          <Table size="small">
            <TableBody>
              {!loading ? items.filter(filterByKeyword(searchKeyword)).map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.name}</TableCell>
                  <TableCell align="right" style={{ minWidth: 180 }}>
                    <IconButton size="small" onClick={() => {
                      // Login as user
                      fetchOrThrow(`/api/session/${item.id}`).then(() => window.location.replace('/'));
                    }} title="Login">
                      <LoginIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => setEditUser(item)} title="Edit">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => setInfoUser(item)} title="Info">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this user?')) {
                        try {
                          const response = await fetchOrThrow(`/api/users/${item.id}`, {
                            method: 'DELETE',
                          });
                          if (!response.ok) throw new Error('Failed to delete user');
                          setTimestamp(Date.now()); // refresh list
                        } catch (error) {
                          alert(error.message || 'Error deleting user');
                        }
                      }
                    }} title="Delete">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )) : (<TableRow><TableCell colSpan={2}>Loading...</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </div>
      </Paper>
      <div style={{ flex: 1, width: '100%', height: '100%', padding: 0, margin: 0 }}>
      {!isMobile && (
        <div style={{ flex: 1, width: '100%', height: '100%', padding: 0, margin: 0 }}>
          <MainMap filteredPositions={Object.values(positions)} />
        </div>
      )}
      </div>
      {/* User Info Popup */}
      <Dialog open={!!infoUser} onClose={() => setInfoUser(null)} maxWidth="sm">
        <DialogTitle>User Info</DialogTitle>
        <DialogContent dividers>
          {infoUser && (
            <div>
              <Typography variant="subtitle2">Name: {infoUser.name}</Typography>
              <Typography variant="subtitle2">Email: {infoUser.email}</Typography>
              <Typography variant="subtitle2">Admin: {infoUser.administrator ? 'Yes' : 'No'}</Typography>
              <Typography variant="subtitle2">Disabled: {infoUser.disabled ? 'Yes' : 'No'}</Typography>
              <Typography variant="subtitle2">Expiration: {formatTime(infoUser.expirationTime, 'date')}</Typography>
              {/* Add more fields as needed */}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoUser(null)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add User</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Name"
            value={newUser.name}
            onChange={e => setNewUser({ ...newUser, name: e.target.value })}
            fullWidth
            margin="normal"
            required
            error={!newUser.name}
            helperText={!newUser.name ? 'Name is required' : ''}
          />
          <TextField
            label="Email"
            value={newUser.email}
            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
            fullWidth
            margin="normal"
            required
            error={!newUser.email || !/^\S+@\S+\.\S+$/.test(newUser.email)}
            helperText={!newUser.email ? 'Email is required' : (!/^\S+@\S+\.\S+$/.test(newUser.email) ? 'Invalid email' : '')}
          />
          <TextField
            label="Password"
            type="password"
            value={newUser.password || ''}
            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
            fullWidth
            margin="normal"
            required
            error={!newUser.password || newUser.password.length < 6}
            helperText={!newUser.password ? 'Password is required' : (newUser.password.length < 6 ? 'Password must be at least 6 characters' : '')}
          />
          <TextField
            label="Expiration Time"
            type="datetime-local"
            value={newUser.expirationTime || ''}
            onChange={e => setNewUser({ ...newUser, expirationTime: e.target.value })}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <FormControlLabel
            control={<Switch checked={!!newUser.administrator} onChange={e => setNewUser({ ...newUser, administrator: e.target.checked })} />}
            label="Administrator"
          />
          <FormControlLabel
            control={<Switch checked={!!newUser.disabled} onChange={e => setNewUser({ ...newUser, disabled: e.target.checked })} />}
            label="Disabled"
          />
          {/* Add more fields as needed */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)} variant="outlined">Cancel</Button>
          <Button
            onClick={async () => {
              try {
                const response = await fetchOrThrow('/api/users', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newUser),
                });
                if (!response.ok) throw new Error('Failed to add user');
                setShowAddDialog(false);
                setNewUser({ name: '', email: '', password: '', expirationTime: '', administrator: false, disabled: false });
                setTimestamp(Date.now()); // refresh list
              } catch (error) {
                alert(error.message || 'Error adding user');
              }
            }}
            variant="contained"
            disabled={
              !newUser.name ||
              !newUser.email ||
              !/^\S+@\S+\.\S+$/.test(newUser.email) ||
              !newUser.password ||
              newUser.password.length < 6
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onClose={() => setEditUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Name"
            value={editUser?.name || ''}
            onChange={e => setEditUser({ ...editUser, name: e.target.value })}
            fullWidth
            margin="normal"
            required
            error={!editUser?.name}
            helperText={!editUser?.name ? 'Name is required' : ''}
          />
          <TextField
            label="Email"
            value={editUser?.email || ''}
            onChange={e => setEditUser({ ...editUser, email: e.target.value })}
            fullWidth
            margin="normal"
            required
            error={!editUser?.email || !/^\S+@\S+\.\S+$/.test(editUser?.email)}
            helperText={!editUser?.email ? 'Email is required' : (!/^\S+@\S+\.\S+$/.test(editUser?.email) ? 'Invalid email' : '')}
          />
          <TextField
            label="Expiration Time"
            type="datetime-local"
            value={editUser?.expirationTime || ''}
            onChange={e => setEditUser({ ...editUser, expirationTime: e.target.value })}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <FormControlLabel
            control={<Switch checked={!!editUser?.administrator} onChange={e => setEditUser({ ...editUser, administrator: e.target.checked })} />}
            label="Administrator"
          />
          <FormControlLabel
            control={<Switch checked={!!editUser?.disabled} onChange={e => setEditUser({ ...editUser, disabled: e.target.checked })} />}
            label="Disabled"
          />
          {/* Add more fields as needed */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)} variant="outlined">Cancel</Button>
          <Button
            onClick={async () => {
              try {
                const response = await fetchOrThrow(`/api/users/${editUser.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(editUser),
                });
                if (!response.ok) throw new Error('Failed to update user');
                setEditUser(null);
                setTimestamp(Date.now()); // refresh list
              } catch (error) {
                alert(error.message || 'Error updating user');
              }
            }}
            variant="contained"
            disabled={
              !editUser?.name ||
              !editUser?.email ||
              !/^\S+@\S+\.\S+$/.test(editUser?.email)
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      {/* Connections dialog can be implemented similarly */}
    </div>
  );
};

export default UsersPage;
