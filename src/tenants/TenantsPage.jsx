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
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import { useCatch } from '../reactHelper';

const TenantsPage = () => {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    plan: 'PROFESSIONAL',
    maxUsers: 50,
    maxDevices: 200,
    status: 'ACTIVE'
  });

  const plans = [
    { value: 'BASIC', label: 'Basic', color: 'default' },
    { value: 'PROFESSIONAL', label: 'Professional', color: 'primary' },
    { value: 'ENTERPRISE', label: 'Enterprise', color: 'secondary' },
    { value: 'SUPER_ADMIN', label: 'Super Admin', color: 'error' }
  ];

  const statuses = [
    { value: 'ACTIVE', label: 'Active', color: 'success' },
    { value: 'INACTIVE', label: 'Inactive', color: 'default' },
    { value: 'SUSPENDED', label: 'Suspended', color: 'warning' }
  ];

  const loadTenants = useCatch(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tenants');
      if (response.ok) {
        const data = await response.json();
        setTenants(data);
      } else {
        throw new Error('Failed to load tenants');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  });

  const saveTenant = useCatch(async () => {
    try {
      const url = editingTenant ? `/api/tenants/${editingTenant.id}` : '/api/tenants';
      const method = editingTenant ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await loadTenants();
        setDialogOpen(false);
        setEditingTenant(null);
        setFormData({
          name: '',
          subdomain: '',
          plan: 'PROFESSIONAL',
          maxUsers: 50,
          maxDevices: 200,
          status: 'ACTIVE'
        });
      } else {
        throw new Error('Failed to save tenant');
      }
    } catch (err) {
      setError(err.message);
    }
  });

  const deleteTenant = useCatch(async (tenantId) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadTenants();
      } else {
        throw new Error('Failed to delete tenant');
      }
    } catch (err) {
      setError(err.message);
    }
  });

  const handleEdit = (tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name || '',
      subdomain: tenant.subdomain || '',
      plan: tenant.plan || 'PROFESSIONAL',
      maxUsers: tenant.maxUsers || 50,
      maxDevices: tenant.maxDevices || 200,
      status: tenant.status || 'ACTIVE'
    });
    setDialogOpen(true);
  };

  const handleDelete = (tenant) => {
    if (window.confirm(`Are you sure you want to delete tenant "${tenant.name}"?`)) {
      deleteTenant(tenant.id);
    }
  };

  const handleMenuOpen = (event, tenant) => {
    setAnchorEl(event.currentTarget);
    setSelectedTenant(tenant);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTenant(null);
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const getPlanInfo = (plan) => {
    return plans.find(p => p.value === plan) || { label: plan, color: 'default' };
  };

  const getStatusInfo = (status) => {
    return statuses.find(s => s.value === status) || { label: status, color: 'default' };
  };

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
            <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {t('tenants')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            {t('addTenant')}
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
                    <TableCell>{t('subdomain')}</TableCell>
                    <TableCell>{t('plan')}</TableCell>
                    <TableCell>{t('status')}</TableCell>
                    <TableCell>{t('maxUsers')}</TableCell>
                    <TableCell>{t('maxDevices')}</TableCell>
                    <TableCell align="right">{t('actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tenants.map((tenant) => {
                    const planInfo = getPlanInfo(tenant.plan);
                    const statusInfo = getStatusInfo(tenant.status);
                    
                    return (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {tenant.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {tenant.subdomain}.traccar.com
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={planInfo.label}
                            color={planInfo.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusInfo.label}
                            color={statusInfo.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{tenant.maxUsers}</TableCell>
                        <TableCell>{tenant.maxDevices}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, tenant)}
                            size="small"
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
            handleEdit(selectedTenant);
            handleMenuClose();
          }}>
            <EditIcon sx={{ mr: 1 }} />
            {t('edit')}
          </MenuItem>
          <MenuItem onClick={() => {
            handleDelete(selectedTenant);
            handleMenuClose();
          }}>
            <DeleteIcon sx={{ mr: 1 }} />
            {t('delete')}
          </MenuItem>
        </Menu>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingTenant ? t('editTenant') : t('addTenant')}
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
                label={t('subdomain')}
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                margin="normal"
                required
                helperText="Will be used as subdomain.traccar.com"
              />
              <TextField
                fullWidth
                select
                label={t('plan')}
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                margin="normal"
                SelectProps={{ native: true }}
              >
                {plans.map((plan) => (
                  <option key={plan.value} value={plan.value}>
                    {plan.label}
                  </option>
                ))}
              </TextField>
              <TextField
                fullWidth
                select
                label={t('status')}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                margin="normal"
                SelectProps={{ native: true }}
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </TextField>
              <TextField
                fullWidth
                type="number"
                label={t('maxUsers')}
                value={formData.maxUsers}
                onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
                margin="normal"
              />
              <TextField
                fullWidth
                type="number"
                label={t('maxDevices')}
                value={formData.maxDevices}
                onChange={(e) => setFormData({ ...formData, maxDevices: parseInt(e.target.value) })}
                margin="normal"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={saveTenant} variant="contained">
              {editingTenant ? t('update') : t('create')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageLayout>
  );
};

export default TenantsPage;
