import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import { useCatch } from '../reactHelper';

const UserRolesPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [assignData, setAssignData] = useState({
    userId: '',
    roleId: ''
  });

  const loadUsers = useCatch(async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        throw new Error('Failed to load users');
      }
    } catch (err) {
      setError(err.message);
    }
  });

  const loadRoles = useCatch(async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      } else {
        throw new Error('Failed to load roles');
      }
    } catch (err) {
      setError(err.message);
    }
  });

  const loadUserRoles = useCatch(async () => {
    setLoading(true);
    try {
      // Load user roles for each user
      const userRolesData = [];
      for (const user of users) {
        const response = await fetch(`/api/roles/user/${user.id}`);
        if (response.ok) {
          const userRoles = await response.json();
          userRolesData.push(...userRoles.map(role => ({ ...role, userId: user.id, userName: user.name, userEmail: user.email })));
        }
      }
      setUserRoles(userRolesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  });

  const assignRole = useCatch(async () => {
    try {
      const response = await fetch('/api/roles/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignData)
      });

      if (response.ok) {
        setAssignDialogOpen(false);
        setAssignData({ userId: '', roleId: '' });
        await loadUserRoles();
      } else {
        throw new Error('Failed to assign role');
      }
    } catch (err) {
      setError(err.message);
    }
  });

  const unassignRole = useCatch(async (userId, roleId) => {
    try {
      const response = await fetch('/api/roles/unassign', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleId })
      });

      if (response.ok) {
        await loadUserRoles();
      } else {
        throw new Error('Failed to unassign role');
      }
    } catch (err) {
      setError(err.message);
    }
  });

  const handleUnassign = (userId, roleId, userName, roleName) => {
    if (window.confirm(`Are you sure you want to remove role "${roleName}" from user "${userName}"?`)) {
      unassignRole(userId, roleId);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserRoles = (userId) => {
    return userRoles.filter(ur => ur.userId === userId);
  };

  useEffect(() => {
    const loadData = async () => {
      await loadUsers();
      await loadRoles();
    };
    loadData();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      loadUserRoles();
    }
  }, [users]);

  if (loading) {
    return (
      <PageLayout>
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {t('userRoles')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAssignDialogOpen(true)}
          >
            {t('assignRole')}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box mb={3}>
          <TextField
            fullWidth
            placeholder={t('searchUsers')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('user')}</TableCell>
                    <TableCell>{t('roles')}</TableCell>
                    <TableCell align="right">{t('actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const userRolesList = getUserRoles(user.id);
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">
                              {user.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {user.email}
                            </Typography>
                            {user.administrator && (
                              <Chip
                                label="Administrator"
                                color="primary"
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {userRolesList.length > 0 ? (
                              userRolesList.map((userRole) => (
                                <Chip
                                  key={`${userRole.userId}-${userRole.id}`}
                                  label={userRole.name}
                                  color={userRole.isSystem ? 'primary' : 'default'}
                                  size="small"
                                  onDelete={() => handleUnassign(userRole.userId, userRole.id, user.name, userRole.name)}
                                />
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                {t('noRolesAssigned')}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              setAssignData({ ...assignData, userId: user.id });
                              setAssignDialogOpen(true);
                            }}
                          >
                            {t('assignRole')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Assign Role Dialog */}
        <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {t('assignRoleToUser')}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>{t('user')}</InputLabel>
                <Select
                  value={assignData.userId}
                  onChange={(e) => setAssignData({ ...assignData, userId: e.target.value })}
                  input={<OutlinedInput label={t('user')} />}
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>{t('role')}</InputLabel>
                <Select
                  value={assignData.roleId}
                  onChange={(e) => setAssignData({ ...assignData, roleId: e.target.value })}
                  input={<OutlinedInput label={t('role')} />}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={assignRole} variant="contained">
              {t('assign')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageLayout>
  );
};

export default UserRolesPage;
