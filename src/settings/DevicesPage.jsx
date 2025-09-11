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
        <Paper square className={sidebarClasses.drawer}>
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
          <Divider />
          <Button onClick={handleExport} variant="text" sx={{ m: 2 }}>{t('reportExport')}</Button>
          <Divider />
          <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
          <div style={{ flexGrow: 1, overflow: 'auto' }}>
            <Table size="small">
              <TableBody>
                {!loading ? items.filter(filterByKeyword(searchKeyword)).map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="right" style={{ minWidth: 106 }}>
                      <IconButton size="small" onClick={() => navigate(`/settings/device/${item.id}/connections`)}>
                        <LinkIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => navigate(`/settings/device/${item.id}`)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => setPopupDevice(item)}>
                        <InfoIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => {/* implement delete logic or dialog here if needed */}}>
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
          <div style={{ flex: 1, width: '100%', height: '100%', padding: 0, margin: 0 }}>
            <MainMap filteredPositions={Object.values(positions)} />
          </div>
        </div>
      </div>
    </div>
  );
};
export default DevicesPage;


