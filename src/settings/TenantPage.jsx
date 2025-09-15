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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Devices as DevicesIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useCatch } from '../reactHelper';
import { sessionActions } from '../store';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useIsSuperAdmin, useCanManageTenant } from '../common/util/tenantContext';

const TenantPage = () => {
  const dispatch = useDispatch();
  const isSuperAdmin = useIsSuperAdmin();
  const canManageTenant = useCanManageTenant();
  const currentTenant = useSelector((state) => state.session.tenant);
  const [tenants, setTenants] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState({ open: false, tenant: null });
  const [roleDialog, setRoleDialog] = useState({ open: false, role: null });

  const loadTenants = useCatch(async () => {
    if (!isSuperAdmin) return;
    
    const response = await fetchOrThrow('/api/tenants');
    setTenants(await response.json());
  });

  const loadRoles = useCatch(async () => {
    const response = await fetchOrThrow('/api/roles');
    setRoles(await response.json());
  });

  const loadCurrentTenant = useCatch(async () => {
    const response = await fetchOrThrow('/api/tenants/current');
    dispatch(sessionActions.updateTenant(await response.json()));
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadTenants(),
          loadRoles(),
          loadCurrentTenant(),
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleCreateTenant = useCatch(async (tenantData) => {
    const response = await fetchOrThrow('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tenantData),
    });
    const newTenant = await response.json();
    setTenants([...tenants, newTenant]);
    setEditDialog({ open: false, tenant: null });
  });

  const handleUpdateTenant = useCatch(async (id, tenantData) => {
    const response = await fetchOrThrow(`/api/tenants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tenantData),
    });
    const updatedTenant = await response.json();
    setTenants(tenants.map(t => t.id === id ? updatedTenant : t));
    setEditDialog({ open: false, tenant: null });
  });

  const handleDeleteTenant = useCatch(async (id) => {
    await fetchOrThrow(`/api/tenants/${id}`, { method: 'DELETE' });
    setTenants(tenants.filter(t => t.id !== id));
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'SUSPENDED': return 'error';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'SUPER_ADMIN': return 'error';
      case 'ENTERPRISE': return 'primary';
      case 'PROFESSIONAL': return 'secondary';
      case 'BASIC': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tenant Management
      </Typography>

      {!isSuperAdmin && !canManageTenant && (
        <Alert severity="error">
          You don't have permission to manage tenants.
        </Alert>
      )}

      {currentTenant && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Tenant
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Name
                </Typography>
                <Typography variant="body1">
                  {currentTenant.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Subdomain
                </Typography>
                <Typography variant="body1">
                  {currentTenant.subdomain}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Status
                </Typography>
                <Chip 
                  label={currentTenant.status} 
                  color={getStatusColor(currentTenant.status)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Plan
                </Typography>
                <Chip 
                  label={currentTenant.plan} 
                  color={getPlanColor(currentTenant.plan)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Max Users
                </Typography>
                <Typography variant="body1">
                  {currentTenant.maxUsers}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Max Devices
                </Typography>
                <Typography variant="body1">
                  {currentTenant.maxDevices}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {isSuperAdmin && (
        <>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              All Tenants
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setEditDialog({ open: true, tenant: null })}
            >
              Create Tenant
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Subdomain</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Max Users</TableCell>
                  <TableCell>Max Devices</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>{tenant.name}</TableCell>
                    <TableCell>{tenant.subdomain}</TableCell>
                    <TableCell>
                      <Chip 
                        label={tenant.status} 
                        color={getStatusColor(tenant.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={tenant.plan} 
                        color={getPlanColor(tenant.plan)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{tenant.maxUsers}</TableCell>
                    <TableCell>{tenant.maxDevices}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => setEditDialog({ open: true, tenant })}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteTenant(tenant.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Edit Tenant Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, tenant: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editDialog.tenant ? 'Edit Tenant' : 'Create Tenant'}
        </DialogTitle>
        <DialogContent>
          <TenantForm
            tenant={editDialog.tenant}
            onSubmit={editDialog.tenant ? 
              (data) => handleUpdateTenant(editDialog.tenant.id, data) :
              handleCreateTenant
            }
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

const TenantForm = ({ tenant, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    subdomain: tenant?.subdomain || '',
    domain: tenant?.domain || '',
    status: tenant?.status || 'ACTIVE',
    plan: tenant?.plan || 'BASIC',
    maxUsers: tenant?.maxUsers || 10,
    maxDevices: tenant?.maxDevices || 50,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
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
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Subdomain"
            value={formData.subdomain}
            onChange={handleChange('subdomain')}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Domain"
            value={formData.domain}
            onChange={handleChange('domain')}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            label="Status"
            value={formData.status}
            onChange={handleChange('status')}
            SelectProps={{ native: true }}
          >
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="PENDING">Pending</option>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            label="Plan"
            value={formData.plan}
            onChange={handleChange('plan')}
            SelectProps={{ native: true }}
          >
            <option value="BASIC">Basic</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="ENTERPRISE">Enterprise</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Max Users"
            value={formData.maxUsers}
            onChange={handleChange('maxUsers')}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Max Devices"
            value={formData.maxDevices}
            onChange={handleChange('maxDevices')}
            required
          />
        </Grid>
      </Grid>
      <DialogActions>
        <Button onClick={() => setFormData({})}>Cancel</Button>
        <Button type="submit" variant="contained">
          {tenant ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </form>
  );
};

export default TenantPage;
