import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import Button from '@mui/material/Button';
import TableFooter from '@mui/material/TableFooter';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Paper from '@mui/material/Paper';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinkIcon from '@mui/icons-material/Link';
import AddIcon from '@mui/icons-material/Add';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TextField from '@mui/material/TextField';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTheme } from '@mui/material/styles';
import { useEffectAsync } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import { formatStatus, formatTime } from '../common/util/formatter';
import { useDeviceReadonly, useManager } from '../common/util/permissions';
import useSettingsStyles from './common/useSettingsStyles';
import DeviceUsersValue from './components/DeviceUsersValue';
import MainMap from '../main/MainMap';
import usePersistedState from '../common/util/usePersistedState';
import fetchOrThrow from '../common/util/fetchOrThrow';
import AddressValue from '../common/components/AddressValue';
import { makeStyles } from 'tss-react/mui';
import { useMediaQuery } from '@mui/material';
import LinkField from '../common/components/LinkField';

const useSidebarStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flexGrow: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'row',
  },
  drawer: {
    display: 'flex',
    flexDirection: 'column',
    background: '#fafafa',
    borderRight: '1px solid #eee',
    [theme.breakpoints.up('sm')]: {
      width: theme.dimensions.drawerWidthDesktop,
      minWidth: theme.dimensions.drawerWidthDesktop,
      maxWidth: theme.dimensions.drawerWidthDesktop,
    },
    [theme.breakpoints.down('sm')]: {
      height: theme.dimensions.drawerHeightPhone,
      width: '100%',
      minWidth: 0,
      maxWidth: '100%',
    },
  },
  main: {
    flexGrow: 1,
    padding: 24,
    overflow: 'auto',
  },
  title: {
    flexGrow: 1,
  },
}));

const DevicesPage = () => {
  const { classes } = useSettingsStyles();
  const theme = useTheme();
  const navigate = useNavigate();
  const t = useTranslation();

  const groups = useSelector((state) => state.groups.items);

  const manager = useManager();
  const deviceReadonly = useDeviceReadonly();

  const positions = useSelector((state) => state.session.positions);

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showAll, setShowAll] = usePersistedState('showAllDevices', false);
  const [loading, setLoading] = useState(false);
  const [popupDevice, setPopupDevice] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', uniqueId: '' });
  const [connectionsDevice, setConnectionsDevice] = useState(null);
  const [editDevice, setEditDevice] = useState(null);
  const [infoDevice, setInfoDevice] = useState(null);
  const [deleteDevice, setDeleteDevice] = useState(null);

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ all: showAll });
      const response = await fetchOrThrow(`/api/devices?${query.toString()}`);
      setItems(await response.json());
    } finally {
      setLoading(false);
    }
  }, [timestamp, showAll]);

  const handleExport = async () => {
    const data = items.filter(filterByKeyword(searchKeyword)).map((item) => ({
      [t('sharedName')]: item.name,
      [t('deviceIdentifier')]: item.uniqueId,
      [t('groupParent')]: item.groupId ? groups[item.groupId]?.name : null,
      [t('sharedPhone')]: item.phone,
      [t('deviceModel')]: item.model,
      [t('deviceContact')]: item.contact,
      [t('userExpirationTime')]: formatTime(item.expirationTime, 'date'),
      [t('deviceStatus')]: formatStatus(item.status, t),
      [t('deviceLastUpdate')]: formatTime(item.lastUpdate, 'minutes'),
      [t('positionAddress')]: positions[item.id]?.address || '',
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(t('deviceTitle'));
    const headers = Object.keys(data[0]);

    const titleRow = worksheet.addRow([t('deviceTitle')]);
    worksheet.mergeCells(1, 1, 1, headers.length);
    titleRow.font = { bold: true };

    const border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.border = border;
      cell.font = {};
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${theme.palette.primary.main.replace('#', '').toUpperCase()}` },
      };
    });
    data.forEach((item) => {
      const row = worksheet.addRow(headers.map((h) => item[h]));
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = border;
        cell.font = {};
      });
    });

    const blob = new Blob(
      [await workbook.xlsx.writeBuffer()],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    );
    saveAs(blob, 'devices.xlsx');
  };

  const actionConnections = {
    key: 'connections',
    title: t('sharedConnections'),
    icon: <LinkIcon fontSize="small" />,
    handler: (deviceId) => navigate(`/settings/device/${deviceId}/connections`),
  };

  const { classes: sidebarClasses } = useSidebarStyles();
  return (
    <div className={sidebarClasses.root}>
      <div className={sidebarClasses.content}>
        <Paper
          square
          sx={{
            width: useMediaQuery(theme.breakpoints.down('sm')) ? '100%' : theme.dimensions.drawerWidthDesktop,
            minWidth: useMediaQuery(theme.breakpoints.down('sm')) ? '100%' : theme.dimensions.drawerWidthDesktop,
            maxWidth: useMediaQuery(theme.breakpoints.down('sm')) ? '100%' : theme.dimensions.drawerWidthDesktop,
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            height: '100%',
          }}
        >
          <Toolbar>
            <Typography variant="h6" className={sidebarClasses.title}>{t('deviceTitle')}</Typography>
            <IconButton size="small" color="primary" onClick={handleExport} sx={{ ml: 1 }} title="Export">
              <SaveAltIcon />
            </IconButton>
            <IconButton size="small" color="primary" onClick={() => setShowAddDialog(true)} sx={{ ml: 1 }}>
              <AddIcon />
            </IconButton>
      {/* Add Device Popup */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Device</DialogTitle>
        <DialogContent dividers>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography>Required</Typography></AccordionSummary>
            <AccordionDetails>
              <TextField
                label="Name"
                value={newDevice.name}
                onChange={e => setNewDevice({ ...newDevice, name: e.target.value })}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Identifier"
                value={newDevice.uniqueId}
                onChange={e => setNewDevice({ ...newDevice, uniqueId: e.target.value })}
                fullWidth
                margin="normal"
                helperText="IMEI, serial number or other id. It has to match the identifier device reports to the server."
              />
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography>Extra</Typography></AccordionSummary>
            <AccordionDetails>
              <TextField label="Model" value={newDevice.model || ''} onChange={e => setNewDevice({ ...newDevice, model: e.target.value })} fullWidth margin="normal" />
              <TextField label="Phone" value={newDevice.phone || ''} onChange={e => setNewDevice({ ...newDevice, phone: e.target.value })} fullWidth margin="normal" />
              <TextField label="Contact" value={newDevice.contact || ''} onChange={e => setNewDevice({ ...newDevice, contact: e.target.value })} fullWidth margin="normal" />
              <TextField label="Expiration" value={newDevice.expirationTime || ''} onChange={e => setNewDevice({ ...newDevice, expirationTime: e.target.value })} fullWidth margin="normal" />
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography>Device Image</Typography></AccordionSummary>
            <AccordionDetails>
              <Button variant="outlined" component="label" sx={{ mb: 2 }}>
                Upload Image
                <input type="file" hidden accept="image/*" onChange={e => {
                  const file = e.target.files[0];
                  setNewDevice({ ...newDevice, image: file });
                }} />
              </Button>
              {newDevice.image && <Typography variant="body2">Selected: {newDevice.image.name}</Typography>}
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography>Attributes</Typography></AccordionSummary>
            <AccordionDetails>
              {(newDevice.attributes || []).map((attr, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <TextField label="Key" value={attr.key} onChange={e => {
                    const attrs = [...newDevice.attributes];
                    attrs[idx].key = e.target.value;
                    setNewDevice({ ...newDevice, attributes: attrs });
                  }} />
                  <TextField label="Value" value={attr.value} onChange={e => {
                    const attrs = [...newDevice.attributes];
                    attrs[idx].value = e.target.value;
                    setNewDevice({ ...newDevice, attributes: attrs });
                  }} />
                  <IconButton onClick={() => {
                    setNewDevice({ ...newDevice, attributes: newDevice.attributes.filter((_, i) => i !== idx) });
                  }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </div>
              ))}
              <Button onClick={() => setNewDevice({ ...newDevice, attributes: [...(newDevice.attributes || []), { key: '', value: '' }] })} variant="outlined" sx={{ mb: 2 }}>Add Attribute</Button>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)} variant="outlined">Cancel</Button>
          <Button
            onClick={async () => {
              // Save device via API
              await fetchOrThrow('/api/devices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDevice),
              });
              setShowAddDialog(false);
              setNewDevice({ name: '', uniqueId: '' });
              setTimestamp(Date.now()); // refresh list
            }}
            variant="contained"
            disabled={!newDevice.name || !newDevice.uniqueId}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
          </Toolbar>
          <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
          <div style={{ flexGrow: 1, overflow: 'auto' }}>
            <Table size="small">
              <TableBody>
                {!loading ? items.filter(filterByKeyword(searchKeyword)).map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="right" style={{ minWidth: 106 }}>
                      <IconButton size="small" onClick={() => setConnectionsDevice(item)}>
                        <LinkIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => setEditDevice(item)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => setInfoDevice(item)}>
                        <InfoIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => setDeleteDevice(item)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )) : (<TableShimmer columns={2} endAction />)}
              </TableBody>
            </Table>
          </div>
        </Paper>
        <div className={sidebarClasses.main} style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, margin: 0 }}>
          {/* Main content area: only the map is shown here */}
          {!useMediaQuery(theme.breakpoints.down('sm')) && (
            <div style={{ flex: 1, width: '100%', height: '100%', padding: 0, margin: 0 }}>
              <MainMap filteredPositions={Object.values(positions)} />
            </div>
          )}
        </div>
      </div>
      {/* Device Connections Popup */}
      <Dialog open={!!connectionsDevice} onClose={() => setConnectionsDevice(null)} maxWidth="sm" fullWidth={false} PaperProps={{ style: { width: '480px', maxWidth: '90vw' } }}>
        <DialogTitle>
          Connections
          {connectionsDevice && (
            <Typography variant="subtitle1" style={{ marginTop: 8, textAlign: 'left' }}>
              {connectionsDevice.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {connectionsDevice && (
            <>
              {/* Geofences */}
              <div style={{ marginBottom: 24 }}>
                <LinkField
                  endpointAll="/api/geofences"
                  endpointLinked={`/api/geofences?deviceId=${connectionsDevice.id}`}
                  baseId={connectionsDevice.id}
                  keyBase="deviceId"
                  keyLink="geofenceId"
                  label={t('sharedGeofences')}
                />
              </div>
              {/* Notifications */}
              <div style={{ marginBottom: 24 }}>
                <LinkField
                  endpointAll="/api/notifications"
                  endpointLinked={`/api/notifications?deviceId=${connectionsDevice.id}`}
                  baseId={connectionsDevice.id}
                  keyBase="deviceId"
                  keyLink="notificationId"
                  label={t('sharedNotifications')}
                />
              </div>
              {/* Drivers */}
              <div style={{ marginBottom: 24 }}>
                <LinkField
                  endpointAll="/api/drivers"
                  endpointLinked={`/api/drivers?deviceId=${connectionsDevice.id}`}
                  baseId={connectionsDevice.id}
                  keyBase="deviceId"
                  keyLink="driverId"
                  label={t('sharedDrivers')}
                />
              </div>
              {/* Computed Attributes */}
              <div style={{ marginBottom: 24 }}>
                <LinkField
                  endpointAll="/api/attributes/computed"
                  endpointLinked={`/api/attributes/computed?deviceId=${connectionsDevice.id}`}
                  baseId={connectionsDevice.id}
                  keyBase="deviceId"
                  keyLink="attributeId"
                  label={t('sharedComputedAttributes')}
                />
              </div>
              {/* Saved Commands */}
              <div style={{ marginBottom: 24 }}>
                <LinkField
                  endpointAll="/api/commands"
                  endpointLinked={`/api/commands?deviceId=${connectionsDevice.id}`}
                  baseId={connectionsDevice.id}
                  keyBase="deviceId"
                  keyLink="commandId"
                  label={t('sharedSavedCommands')}
                />
              </div>
              {/* Maintenance */}
              <div style={{ marginBottom: 24 }}>
                <LinkField
                  endpointAll="/api/maintenance"
                  endpointLinked={`/api/maintenance?deviceId=${connectionsDevice.id}`}
                  baseId={connectionsDevice.id}
                  keyBase="deviceId"
                  keyLink="maintenanceId"
                  label={t('sharedMaintenance')}
                />
              </div>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConnectionsDevice(null)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Edit Device Popup */}
      <Dialog open={!!editDevice} onClose={() => setEditDevice(null)} maxWidth="sm" fullWidth={false} PaperProps={{ style: { width: '480px', maxWidth: '90vw' } }}>
        <DialogTitle>
          Edit Device
          {editDevice && (
            <Typography variant="subtitle1" style={{ marginTop: 8, textAlign: 'left' }}>
              {editDevice.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {editDevice && (
            <div>
              <TextField label="Name" value={editDevice.name || ''} onChange={e => setEditDevice({ ...editDevice, name: e.target.value })} fullWidth margin="normal" />
              <TextField label="Identifier" value={editDevice.uniqueId || ''} onChange={e => setEditDevice({ ...editDevice, uniqueId: e.target.value })} fullWidth margin="normal" />
              <TextField label="Model" value={editDevice.model || ''} onChange={e => setEditDevice({ ...editDevice, model: e.target.value })} fullWidth margin="normal" />
              <TextField label="Phone" value={editDevice.phone || ''} onChange={e => setEditDevice({ ...editDevice, phone: e.target.value })} fullWidth margin="normal" />
              <TextField label="Contact" value={editDevice.contact || ''} onChange={e => setEditDevice({ ...editDevice, contact: e.target.value })} fullWidth margin="normal" />
              <TextField label="Expiration" value={editDevice.expirationTime || ''} onChange={e => setEditDevice({ ...editDevice, expirationTime: e.target.value })} fullWidth margin="normal" />
              {/* Group */}
              <TextField label="Group" value={editDevice.groupId || ''} onChange={e => setEditDevice({ ...editDevice, groupId: e.target.value })} fullWidth margin="normal" />
              {/* Category */}
              <TextField label="Category" value={editDevice.category || ''} onChange={e => setEditDevice({ ...editDevice, category: e.target.value })} fullWidth margin="normal" />
              {/* Calendar */}
              <TextField label="Calendar" value={editDevice.calendarId || ''} onChange={e => setEditDevice({ ...editDevice, calendarId: e.target.value })} fullWidth margin="normal" />
              {/* Disabled */}
              <FormControlLabel control={<Switch checked={!!editDevice.disabled} onChange={e => setEditDevice({ ...editDevice, disabled: e.target.checked })} />} label="Disabled" />
              {/* Image upload placeholder */}
              <Button variant="outlined" component="label" sx={{ mb: 2 }}>
                Upload Image
                <input type="file" hidden accept="image/*" onChange={e => {
                  const file = e.target.files[0];
                  setEditDevice({ ...editDevice, image: file });
                }} />
              </Button>
              {editDevice.image && <Typography variant="body2">Selected: {editDevice.image.name}</Typography>}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDevice(null)}>Cancel</Button>
          <Button
            onClick={async () => {
              // Save device via API
              await fetchOrThrow(`/api/devices/${editDevice.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editDevice),
              });
              setEditDevice(null);
              setTimestamp(Date.now()); // refresh list
            }}
            variant="contained"
            disabled={!editDevice?.name || !editDevice?.uniqueId}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      {/* Device Info Popup */}
      <Dialog open={!!infoDevice} onClose={() => setInfoDevice(null)} maxWidth="sm" fullWidth={false} PaperProps={{ style: { width: '480px', maxWidth: '90vw' } }}>
        <DialogTitle>
          Device Info
          {infoDevice && (
            <Typography variant="subtitle1" style={{ marginTop: 8, textAlign: 'left' }}>
              {infoDevice.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {infoDevice && (
            <div>
              <Typography variant="body2">Identifier: {infoDevice.uniqueId}</Typography>
              <Typography variant="body2">Model: {infoDevice.model}</Typography>
              <Typography variant="body2">Phone: {infoDevice.phone}</Typography>
              <Typography variant="body2">Contact: {infoDevice.contact}</Typography>
              <Typography variant="body2">Expiration: {infoDevice.expirationTime}</Typography>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDevice(null)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Delete Device Confirmation Popup */}
      <Dialog open={!!deleteDevice} onClose={() => setDeleteDevice(null)} maxWidth="xs" fullWidth={false} PaperProps={{ style: { width: '360px', maxWidth: '90vw' } }}>
        <DialogTitle>
          Delete Device
          {deleteDevice && (
            <Typography variant="subtitle1" style={{ marginTop: 8, textAlign: 'left' }}>
              {deleteDevice.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">Are you sure you want to delete this device?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDevice(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              await fetchOrThrow(`/api/devices/${deleteDevice.id}`, {
                method: 'DELETE',
              });
              setDeleteDevice(null);
              setTimestamp(Date.now()); // refresh list
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DevicesPage;


