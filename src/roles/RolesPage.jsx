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
  TextField,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Security as SecurityIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import { useCatch } from '../reactHelper';

const RolesPage = () => {
  const { t } = useTranslation();
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });

  const [assignData, setAssignData] = useState({
    userId: '',
    roleId: ''
  });

  const availablePermissions = [
    { resource: 'DEVICE', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'] },
    { resource: 'USER', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'] },
    { resource: 'REPORT', actions: ['READ', 'EXPORT'] },
    { resource: 'GEOFENCE', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'] },
    { resource: 'TENANT', actions: ['MANAGE'] },
    { resource: 'SYSTEM', actions: ['ADMIN'] }
  ];

  const loadRoles = useCatch(async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  });

  const loadUsers = useCatch(async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  });

  const saveRole = useCatch(async () => {
    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles';
      const method = editingRole ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await loadRoles();
        setDialogOpen(false);
        setEditingRole(null);
        setFormData({
          name: '',
          description: '',
          permissions: []
        });
      } else {
        throw new Error('Failed to save role');
      }
    } catch (err) {
      setError(err.message);
    }
  });

  const deleteRole = useCatch(async (roleId) => {
    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadRoles();
      } else {
        throw new Error('Failed to delete role');
      }
    } catch (err) {
      setError(err.message);
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
        // Refresh data
        await loadRoles();
      } else {
        throw new Error('Failed to assign role');
      }
    } catch (err) {
      setError(err.message);
    }
  });

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name || '',
      description: role.description || '',
      permissions: role.permissions ? role.permissions.split(',') : []
    });
    setDialogOpen(true);
  };

  const handleDelete = (role) => {
    if (window.confirm(`Are you sure you want to delete role "${role.name}"?`)) {
      deleteRole(role.id);
    }
  };

  const handleAssign = (role) => {
    setAssignData({ ...assignData, roleId: role.id });
    setAssignDialogOpen(true);
  };

  const handleMenuOpen = (event, role) => {
    setAnchorEl(event.currentTarget);
    setSelectedRole(role);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRole(null);
  };

  const handlePermissionChange = (permission) => {
    const newPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter(p => p !== permission)
      : [...formData.permissions, permission];
    setFormData({ ...formData, permissions: newPermissions });
  };

  const formatPermissions = (permissions) => {
    if (!permissions) return 'None';
    return permissions.split(',').map(p => p.trim()).join(', ');
  };

  useEffect(() => {
    loadRoles();
    loadUsers();
  }, []);

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
            <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {t('roles')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            {t('addRole')}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('name')}</TableCell>
                    <TableCell>{t('description')}</TableCell>
                    <TableCell>{t('permissions')}</TableCell>
                    <TableCell>{t('isSystem')}</TableCell>
                    <TableCell align="right">{t('actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {role.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {role.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300, wordBreak: 'break-word' }}>
                          {formatPermissions(role.permissions)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={role.isSystem ? 'System' : 'Custom'}
                          color={role.isSystem ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, role)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            handleEdit(selectedRole);
            handleMenuClose();
          }}>
            <EditIcon sx={{ mr: 1 }} />
            {t('edit')}
          </MenuItem>
          <MenuItem onClick={() => {
            handleAssign(selectedRole);
            handleMenuClose();
          }}>
            <PersonIcon sx={{ mr: 1 }} />
            {t('assignToUser')}
          </MenuItem>
          {!selectedRole?.isSystem && (
            <MenuItem onClick={() => {
              handleDelete(selectedRole);
              handleMenuClose();
            }}>
              <DeleteIcon sx={{ mr: 1 }} />
              {t('delete')}
            </MenuItem>
          )}
        </Menu>

        {/* Role Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingRole ? t('editRole') : t('addRole')}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label={t('name')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label={t('description')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                {t('permissions')}
              </Typography>
              {availablePermissions.map((resource) => (
                <Box key={resource.resource} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {resource.resource}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {resource.actions.map((action) => {
                      const permission = `${resource.resource}:${action}`;
                      return (
                        <Chip
                          key={permission}
                          label={action}
                          clickable
                          color={formData.permissions.includes(permission) ? 'primary' : 'default'}
                          onClick={() => handlePermissionChange(permission)}
                        />
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={saveRole} variant="contained">
              {editingRole ? t('update') : t('create')}
            </Button>
          </DialogActions>
        </Dialog>

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

export default RolesPage;
