import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useCatch } from '../reactHelper';
import { sessionActions } from '../store';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useCanManageTenant, useUserRoles } from '../common/util/tenantContext';

const ROLES = [
  { name: 'TENANT_ADMIN', description: 'Tenant Administrator', color: 'error' },
  { name: 'TENANT_MANAGER', description: 'Tenant Manager', color: 'primary' },
  { name: 'TENANT_USER', description: 'Tenant User', color: 'secondary' },
  { name: 'TENANT_VIEWER', description: 'Tenant Viewer', color: 'default' },
];

const PERMISSIONS = [
  { resource: 'DEVICE', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'] },
  { resource: 'USER', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'] },
  { resource: 'REPORT', actions: ['READ', 'EXPORT'] },
  { resource: 'GEOFENCE', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'] },
  { resource: 'TENANT', actions: ['MANAGE'] },
  { resource: 'SYSTEM', actions: ['ADMIN'] },
];

const RolesPage = () => {
  const dispatch = useDispatch();
  const canManageTenant = useCanManageTenant();
  const userRoles = useUserRoles();
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState({ open: false, role: null });
  const [assignDialog, setAssignDialog] = useState({ open: false, user: null });

  const loadRoles = useCatch(async () => {
    const response = await fetchOrThrow('/api/roles');
    setRoles(await response.json());
  });

  const loadUsers = useCatch(async () => {
    const response = await fetchOrThrow('/api/users');
    setUsers(await response.json());
  });

  const loadUserRoles = useCatch(async () => {
    const response = await fetchOrThrow('/api/session');
    const sessionData = await response.json();
    dispatch(sessionActions.updateUserRoles(sessionData.userRoles || []));
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadRoles(),
          loadUsers(),
          loadUserRoles(),
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleCreateRole = useCatch(async (roleData) => {
    const response = await fetchOrThrow('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData),
    });
    const newRole = await response.json();
    setRoles([...roles, newRole]);
    setEditDialog({ open: false, role: null });
  });

  const handleUpdateRole = useCatch(async (id, roleData) => {
    const response = await fetchOrThrow(`/api/roles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData),
    });
    const updatedRole = await response.json();
    setRoles(roles.map(r => r.id === id ? updatedRole : r));
    setEditDialog({ open: false, role: null });
  });

  const handleDeleteRole = useCatch(async (id) => {
    await fetchOrThrow(`/api/roles/${id}`, { method: 'DELETE' });
    setRoles(roles.filter(r => r.id !== id));
  });

  const handleAssignRole = useCatch(async (userId, roleId) => {
    await fetchOrThrow(`/api/roles/assign?userId=${userId}&roleId=${roleId}`, {
      method: 'POST',
    });
    setAssignDialog({ open: false, user: null });
    loadUserRoles();
  });

  const handleUnassignRole = useCatch(async (userId, roleId) => {
    await fetchOrThrow(`/api/roles/unassign?userId=${userId}&roleId=${roleId}`, {
      method: 'DELETE',
    });
    loadUserRoles();
  });

  const getUserRoles = (userId) => {
    return userRoles.filter(ur => ur.userId === userId);
  };

  if (loading) {
    return <Box>Loading...</Box>;
  }

  if (!canManageTenant) {
    return (
      <Alert severity="error">
        You don't have permission to manage roles.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Role Management
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Roles
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setEditDialog({ open: true, role: null })}
        >
          Create Role
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SecurityIcon sx={{ mr: 1 }} />
                    {role.name}
                  </Box>
                </TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>
                  <Chip 
                    label={role.system ? 'System' : 'Custom'} 
                    color={role.system ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {role.permissions?.split(',').map(permission => (
                      <Chip 
                        key={permission} 
                        label={permission} 
                        size="small" 
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  {!role.system && (
                    <>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => setEditDialog({ open: true, role })}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" gutterBottom>
        User Role Assignments
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 1 }} />
                    {user.name} ({user.email})
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {getUserRoles(user.id).map(userRole => {
                      const role = roles.find(r => r.id === userRole.roleId);
                      return role ? (
                        <Chip 
                          key={userRole.roleId}
                          label={role.name}
                          size="small"
                          onDelete={() => handleUnassignRole(user.id, userRole.roleId)}
                        />
                      ) : null;
                    })}
                  </Box>
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => setAssignDialog({ open: true, user })}
                  >
                    Assign Role
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Role Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, role: null })} maxWidth="md" fullWidth>
        <DialogTitle>
          {editDialog.role ? 'Edit Role' : 'Create Role'}
        </DialogTitle>
        <DialogContent>
          <RoleForm
            role={editDialog.role}
            onSubmit={editDialog.role ? 
              (data) => handleUpdateRole(editDialog.role.id, data) :
              handleCreateRole
            }
          />
        </DialogContent>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={assignDialog.open} onClose={() => setAssignDialog({ open: false, user: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign Role to {assignDialog.user?.name}
        </DialogTitle>
        <DialogContent>
          <RoleAssignmentForm
            user={assignDialog.user}
            roles={roles}
            onAssign={handleAssignRole}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

const RoleForm = ({ role, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions?.split(',') || [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      permissions: formData.permissions.join(','),
    });
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handlePermissionChange = (permission) => (e) => {
    const permissions = formData.permissions;
    if (e.target.checked) {
      setFormData({ ...formData, permissions: [...permissions, permission] });
    } else {
      setFormData({ ...formData, permissions: permissions.filter(p => p !== permission) });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={handleChange('name')}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={handleChange('description')}
            multiline
            rows={2}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Permissions
          </Typography>
          {PERMISSIONS.map(permissionGroup => (
            <Box key={permissionGroup.resource} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {permissionGroup.resource}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {permissionGroup.actions.map(action => {
                  const permission = `${permissionGroup.resource}:${action}`;
                  return (
                    <Box key={permission} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Checkbox
                        checked={formData.permissions.includes(permission)}
                        onChange={handlePermissionChange(permission)}
                      />
                      <Typography variant="body2">{action}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Grid>
      </Grid>
      <DialogActions>
        <Button onClick={() => setFormData({})}>Cancel</Button>
        <Button type="submit" variant="contained">
          {role ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </form>
  );
};

const RoleAssignmentForm = ({ user, roles, onAssign }) => {
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedRoleId) {
      onAssign(user.id, parseInt(selectedRoleId));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel>Select Role</InputLabel>
        <Select
          value={selectedRoleId}
          onChange={(e) => setSelectedRoleId(e.target.value)}
          required
        >
          {roles.map(role => (
            <MenuItem key={role.id} value={role.id}>
              {role.name} - {role.description}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <DialogActions>
        <Button onClick={() => setSelectedRoleId('')}>Cancel</Button>
        <Button type="submit" variant="contained">
          Assign Role
        </Button>
      </DialogActions>
    </form>
  );
};

export default RolesPage;
