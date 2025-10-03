// src/components/RecojoHistory.js
import React, { useMemo, useState } from 'react';
import {
  Container, Paper, Stack, Typography, TextField, Button, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
  Chip, CircularProgress, Box, Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import RefreshIcon from '@mui/icons-material/Refresh';

const API_BASE = 'http://localhost:8000/api';

function tipoToColor(tipo) {
  const t = (tipo || '').toLowerCase();
  if (t === 'padre') return 'primary';
  if (t === 'madre') return 'secondary';
  if (t === 'tutor') return 'info';
  if (t === 'familiar') return 'warning';
  return 'default';
}

/** Normaliza fecha_hora del backend a { fecha: dd/mm/yyyy, hora: hh.mm.ss } */
function parseFechaHora(input) {
  if (!input) return { fecha: '—', hora: '—' };

  let s = String(input).trim();

  // Quitar milisegundos y/o 'Z'
  s = s.replace(/\.\d+Z?$/i, '').replace(/Z$/i, '');

  // Aceptar "YYYY-MM-DD HH:MM:SS" o "YYYY-MM-DDTHH:MM:SS"
  s = s.replace('T', ' ');

  let [datePart, timePart] = s.split(' ');
  // Si por algún motivo viene todo junto sin espacio
  if (!timePart && datePart?.includes(':')) {
    const parts = datePart.split(' ');
    datePart = parts[0];
    timePart = parts[1] || '';
  }

  // Formatear fecha a dd/mm/yyyy
  let fecha = '—';
  if (datePart && datePart.includes('-')) {
    const [y, m, d] = datePart.split('-');
    if (y && m && d) {
      fecha = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
  }

  // Formatear hora a hh.mm.ss (puntos)
  let hora = '—';
  if (timePart) {
    const t = timePart.split('.')[0];     // hh:mm:ss
    if (t) hora = t.replace(/:/g, '.');   // hh.mm.ss
  }

  return { fecha, hora };
}

export default function RecojoHistory() {
  const [ci, setCi] = useState('');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [page, setPage] = useState(0);
  const [rpp, setRpp] = useState(10);

  // Buscar por CI
  const fetchByCi = async () => {
    const value = ci.trim();
    if (!value) return;

    setLoading(true);
    setError('');
    setRows([]);
    setPage(0);
    setQuery(value);

    try {
      const res = await fetch(`${API_BASE}/hijos/${value}/historial-recojos`, {
        credentials: 'include',
      });

      if (res.status === 404) {
        setError('Estudiante no encontrado.');
        setRows([]);
      } else if (!res.ok) {
        setError('Error al recuperar datos.');
        setRows([]);
      } else {
        const data = await res.json();

        const mapped = Array.isArray(data)
          ? data.map((item) => {
              const { fecha, hora } = parseFechaHora(item.fecha_hora);
              return {
                estudiante: item.hijo
                  ? `${item.hijo.nombre ?? ''} ${item.hijo.apellido ?? ''}`.trim() || '—'
                  : '—',
                grado: item.hijo?.grado || '—',
                recogido_por: item.personal
                  ? `${item.personal.name ?? ''} ${item.personal.apellido ?? ''}`.trim() || '—'
                  : '—',
                ci: item.personal?.ci || '—',
                tipo: item.personal?.tipo || '—',
                descripcion: item.personal?.descripcion || '', // ⬅️ NUEVO: descripción del tutor/familiar
                fecha, // dd/mm/yyyy
                hora,  // hh.mm.ss
              };
            })
          : [];

        setRows(mapped);
      }
    } catch (e) {
      console.error(e);
      setError('Error de red.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // Exportar PDF (diálogo del navegador)
  const exportPDF = () => {
    if (!rows.length) return;
    window.print();
  };

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(rows.length / rpp)),
    [rows.length, rpp]
  );
  const paged = useMemo(
    () => rows.slice(page * rpp, page * rpp + rpp),
    [rows, page, rpp]
  );
  const from = rows.length ? page * rpp + 1 : 0;
  const to = Math.min(rows.length, page * rpp + rpp);

  return (
    <>
      {/* CSS de impresión: solo #printArea */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          body * { visibility: hidden !important; }
          #printArea, #printArea * { visibility: visible !important; }
          #printArea { position: absolute; inset: 0; }
          #printArea .no-shadow { box-shadow: none !important; border: 1px solid #e0e0e0 !important; }
          .hide-on-print { display: none !important; }
          table { page-break-inside: auto; }
          tr    { page-break-inside: avoid; page-break-after: auto; }
        }
      `}</style>

      <Container sx={{ py: 4 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <div>
            <Typography variant="h4">Historial de Recojos</Typography>
            <Typography variant="body2" color="text.secondary">
              Consulta retiros del estudiante buscando por su CI.
            </Typography>
          </div>

          <Stack direction="row" spacing={1} alignItems="center" className="hide-on-print">
            <TextField
              size="small"
              label="CI del Estudiante"
              placeholder="Ej.: 2499582"
              value={ci}
              onChange={(e) => setCi(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchByCi()}
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={fetchByCi}
              disabled={loading}
            >
              {loading ? 'Buscando…' : 'Buscar'}
            </Button>
            <Divider flexItem orientation="vertical" />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setCi('');
                setQuery('');
                setRows([]);
                setError('');
                setPage(0);
              }}
            >
              Limpiar
            </Button>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdfIcon />}
              onClick={exportPDF}
              disabled={!rows.length}
            >
              Exportar PDF
            </Button>
          </Stack>
        </Stack>

        {query && !loading && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Última consulta: <b>{query}</b>
          </Typography>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <div id="printArea">
          <Paper variant="outlined" className="no-shadow">
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <div>
                <Typography variant="subtitle1" fontWeight={600}>
                  Reporte — Historial de Recojos
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {query ? `CI consultado: ${query}` : 'Ingrese un CI y presione Buscar'}
                </Typography>
              </div>
              <Typography variant="caption" color="text.secondary">
                Generado el{' '}
                <b>
                  {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </b>
              </Typography>
            </Box>

            <TableContainer sx={{ maxHeight: 560 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Estudiante</TableCell>
                    <TableCell>Grado</TableCell>
                    <TableCell>Recogido por</TableCell>
                    <TableCell>CI</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Descripción</TableCell> {/* ⬅️ NUEVA COLUMNA */}
                    <TableCell>Fecha</TableCell>
                    <TableCell>Hora</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Box sx={{ py: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <CircularProgress size={22} />
                          <Typography variant="body2" color="text.secondary">Cargando…</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : paged.length ? (
                    paged.map((r, i) => {
                      const showDesc = (r.tipo || '').toLowerCase() === 'tutor' || (r.tipo || '').toLowerCase() === 'familiar';
                      return (
                        <TableRow hover key={i}>
                          <TableCell>{r.estudiante}</TableCell>
                          <TableCell>{r.grado}</TableCell>
                          <TableCell>{r.recogido_por}</TableCell>
                          <TableCell>{r.ci}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={r.tipo || '—'}
                              color={tipoToColor(r.tipo)}
                              variant={tipoToColor(r.tipo) === 'default' ? 'outlined' : 'filled'}
                            />
                          </TableCell>
                          <TableCell>
                            {showDesc ? (r.descripcion || '—') : '—'}
                          </TableCell>
                          <TableCell>{r.fecha}</TableCell> {/* dd/mm/yyyy */}
                          <TableCell>{r.hora}</TableCell>  {/* hh.mm.ss */}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            No hay registros para mostrar.
                          </Typography>
                          <Typography variant="caption" color="text.disabled" className="hide-on-print">
                            Realiza una búsqueda o ajusta el paginado.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Footer (oculto en impresión) */}
            <Box
              className="hide-on-print"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1,
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {rows.length ? `Mostrando ${from}–${to} de ${rows.length} registros` : 'Sin resultados'}
              </Typography>
              <TablePagination
                component="div"
                rowsPerPageOptions={[10, 20, 50, 100]}
                count={rows.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rpp}
                onRowsPerPageChange={(e) => {
                  setRpp(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </Box>
          </Paper>
        </div>
      </Container>
    </>
  );
}
