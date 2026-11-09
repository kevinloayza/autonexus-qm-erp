import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, Download, Filter, User, Plus, X } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [lots, setLots] = useState([]);
  const [metrics, setMetrics] = useState({ total_lots: 0, released: 0, rejected: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLot, setNewLot] = useState({ batch_no: '', material_name: '', inspector: 'Pruebas' });

  const loadData = async () => {
    try {
      const [lotsRes, metricsRes] = await Promise.all([
        axios.get(`${API_URL}/lots`),
        axios.get(`${API_URL}/metrics`)
      ]);
      setLots(lotsRes.data);
      setMetrics(metricsRes.data);
    } catch (error) {
      console.error("Error cargando los datos", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/lots`, newLot);
      setIsModalOpen(false);
      setNewLot({ batch_no: '', material_name: '', inspector: 'Pruebas' });
      loadData();
    } catch (error) {
      alert("ERROR DEL SISTEMA: Verifique conexion a Base de Datos.");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    let reason = null;
    if (newStatus === 'Rechazado') {
      reason = window.prompt("SISTEMA QM: Ingrese motivo del rechazo (sin tildes):");
      if (!reason) return;
    }
    
    try {
      await axios.put(`${API_URL}/lots/${id}/status`, { status: newStatus, defect_reason: reason });
      loadData();
    } catch (error) {
      alert("ERROR DEL SISTEMA: No se pudo actualizar el estado.");
    }
  };

  const filteredLots = lots.filter(lot => {
    const matchesSearch = lot.material_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lot.batch_no.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || lot.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ['Fecha_Hora', 'Lote', 'Material', 'Estado', 'Motivo_Rechazo', 'Inspector'];
    const csvContent = [
      headers.join(';'),
      ...filteredLots.map(lot => [
        new Date(lot.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }).replace(',', ''),
        lot.batch_no,
        `"${lot.material_name}"`,
        lot.status,
        `"${lot.defect_reason || ''}"`,
        lot.inspector
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'SYS_QM_EXPORT.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingLots = metrics.total_lots - metrics.released - metrics.rejected;
  const pieData = [
    { name: 'Liberados', value: Number(metrics.released), color: '#22c55e' },
    { name: 'Rechazados', value: Number(metrics.rejected), color: '#ef4444' },
    { name: 'Pendientes', value: Number(pendingLots), color: '#eab308' }
  ];

  const barData = useMemo(() => {
    const inspectorCounts = lots.reduce((acc, lot) => {
      const existing = acc.find(item => item.name === lot.inspector);
      if (existing) {
        existing.inspecciones += 1;
      } else {
        acc.push({ name: lot.inspector, inspecciones: 1 });
      }
      return acc;
    }, []);
    return inspectorCounts.sort((a, b) => b.inspecciones - a.inspecciones);
  }, [lots]);

  return (
    <div className="min-h-screen bg-[#e5e7eb] font-sans text-slate-800 relative">
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center">
          <div className="bg-slate-200 border-2 border-slate-600 shadow-2xl w-96 rounded-none">
            <div className="bg-[#1e293b] text-white px-3 py-2 flex justify-between items-center border-b-2 border-blue-600">
              <span className="text-xs font-bold tracking-widest">NUEVO INGRESO DE ALMACEN</span>
              <button onClick={() => setIsModalOpen(false)} className="hover:text-red-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-4 flex flex-col gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">NUMERO DE LOTE (BATCH)</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-slate-400 px-2 py-1 text-xs uppercase focus:outline-none focus:border-blue-600" 
                  placeholder="EJ: DSA-3211"
                  value={newLot.batch_no}
                  onChange={(e) => setNewLot({...newLot, batch_no: e.target.value.toUpperCase()})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">DESCRIPCION DEL MATERIAL</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-slate-400 px-2 py-1 text-xs uppercase focus:outline-none focus:border-blue-600" 
                  placeholder="EJ: PERNOS DE ACERO"
                  value={newLot.material_name}
                  onChange={(e) => setNewLot({...newLot, material_name: e.target.value.toUpperCase()})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">USUARIO REGISTRO</label>
                <input 
                  type="text" 
                  readOnly
                  className="w-full border border-slate-300 bg-slate-100 text-slate-500 px-2 py-1 text-xs font-mono" 
                  value={newLot.inspector}
                />
              </div>
              <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-300">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1 bg-slate-400 text-white text-xs font-bold border border-slate-500 hover:bg-slate-500">CANCELAR</button>
                <button type="submit" className="px-3 py-1 bg-blue-600 text-white text-xs font-bold border border-blue-800 hover:bg-blue-700">GUARDAR REGISTRO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-[#1e293b] text-white flex items-center justify-between px-4 py-1 border-b-4 border-blue-600">
        <div className="flex items-center gap-4 text-xs font-bold tracking-wider">
          <span>AutoNexus</span>
          <span className="text-slate-400">|</span>
          <span className="text-blue-400">MOD: QUALITY MANAGEMENT</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            USER: Pruebas
          </div>
          <span className="text-slate-400">|</span>
          <span>SRV: PROD-01</span>
        </div>
      </div>

      <div className="bg-white border-b border-slate-300 px-4 py-2 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">FILTROS DE VISTA:</span>
          <select 
            className="border border-slate-400 text-xs px-2 py-1 bg-slate-50 focus:outline-none focus:border-blue-500 rounded-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Todos">*- TODOS LOS ESTADOS -*</option>
            <option value="Liberado">ESTADO: LIBERADO</option>
            <option value="Rechazado">ESTADO: RECHAZADO</option>
            <option value="Pendiente">ESTADO: PENDIENTE</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar lote o material..." 
              className="pl-7 pr-2 py-1 border border-slate-400 text-xs bg-slate-50 focus:outline-none focus:border-blue-500 rounded-none w-64 uppercase"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs font-bold transition-colors border border-blue-800 rounded-none"
          >
            <Plus className="h-3 w-3" />
            NUEVO INGRESO
          </button>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-1 bg-slate-700 hover:bg-slate-800 text-white px-3 py-1 text-xs font-bold transition-colors border border-slate-900 rounded-none"
          >
            <Download className="h-3 w-3" />
            EXPORTAR
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-400 p-3 border-t-4 border-t-blue-500 rounded-none">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Volumen Total</div>
            <div className="text-2xl font-bold font-mono">{metrics.total_lots}</div>
          </div>
          <div className="bg-white border border-slate-400 p-3 border-t-4 border-t-green-500 rounded-none">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Aprobados</div>
            <div className="text-2xl font-bold font-mono text-green-700">{metrics.released}</div>
          </div>
          <div className="bg-white border border-slate-400 p-3 border-t-4 border-t-red-500 rounded-none">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Rechazados</div>
            <div className="text-2xl font-bold font-mono text-red-700">{metrics.rejected}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-400 rounded-none">
            <div className="bg-slate-200 border-b border-slate-400 px-3 py-1.5 text-xs font-bold text-slate-700">
              METRICAS: ESTADOS DE CALIDAD
            </div>
            <div className="h-56 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '0px', border: '1px solid #94a3b8', fontSize: '12px' }}/>
                  <Legend verticalAlign="bottom" height={24} iconType="square" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-400 rounded-none">
            <div className="bg-slate-200 border-b border-slate-400 px-3 py-1.5 text-xs font-bold text-slate-700">
              METRICAS: RENDIMIENTO OPERATIVO
            </div>
            <div className="h-56 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                  <XAxis dataKey="name" axisLine={{ stroke: '#94a3b8' }} tickLine={false} tick={{fill: '#475569', fontSize: 11}} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11}} />
                  <RechartsTooltip cursor={{fill: '#e2e8f0'}} contentStyle={{ borderRadius: '0px', border: '1px solid #94a3b8', fontSize: '12px' }}/>
                  <Bar dataKey="inspecciones" fill="#3b82f6" maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-400 rounded-none overflow-hidden">
          <div className="bg-slate-200 border-b border-slate-400 px-3 py-1.5 text-xs font-bold text-slate-700 flex justify-between">
            <span>GRID: REGISTROS DE INSPECCION</span>
            <span className="text-[10px] font-normal">Mostrando {filteredLots.length} registros</span>
          </div>
          <div className="overflow-x-auto h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-3 py-2 border-b border-r border-slate-300 font-bold w-32 bg-slate-100">FECHA/HORA</th>
                  <th className="px-3 py-2 border-b border-r border-slate-300 font-bold bg-slate-100">LOTE</th>
                  <th className="px-3 py-2 border-b border-r border-slate-300 font-bold bg-slate-100">MATERIAL</th>
                  <th className="px-3 py-2 border-b border-r border-slate-300 font-bold w-28 bg-slate-100">ESTADO</th>
                  <th className="px-3 py-2 border-b border-r border-slate-300 font-bold bg-slate-100">OBSERVACIONES</th>
                  <th className="px-3 py-2 border-b border-r border-slate-300 font-bold bg-slate-100">USUARIO</th>
                  <th className="px-3 py-2 border-b border-slate-300 font-bold w-36 text-center bg-slate-100">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredLots.map((lot) => (
                  <tr key={lot.id} className="hover:bg-[#fdf8e3] transition-colors even:bg-slate-50">
                    <td className="px-3 py-1.5 border-b border-r border-slate-300 text-slate-600 font-mono">
                      {new Date(lot.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-3 py-1.5 border-b border-r border-slate-300 font-mono font-bold text-blue-800">
                      {lot.batch_no}
                    </td>
                    <td className="px-3 py-1.5 border-b border-r border-slate-300 uppercase">
                      {lot.material_name}
                    </td>
                    <td className="px-3 py-1.5 border-b border-r border-slate-300">
                      {lot.status === 'Liberado' && <span className="inline-block w-2 h-2 bg-green-500 mr-2 border border-green-700"></span>}
                      {lot.status === 'Rechazado' && <span className="inline-block w-2 h-2 bg-red-500 mr-2 border border-red-700"></span>}
                      {lot.status === 'Pendiente' && <span className="inline-block w-2 h-2 bg-yellow-400 mr-2 border border-yellow-600"></span>}
                      <span className="font-bold">{lot.status.toUpperCase()}</span>
                    </td>
                    <td className="px-3 py-1.5 border-b border-r border-slate-300 uppercase text-slate-600">
                      {lot.defect_reason || '-'}
                    </td>
                    <td className="px-3 py-1.5 border-b border-r border-slate-300 font-mono">
                      {lot.inspector.toUpperCase()}
                    </td>
                    <td className="px-2 py-1.5 border-b border-slate-300 text-center">
                      {lot.status === 'Pendiente' ? (
                        <div className="flex justify-center gap-1">
                          <button 
                            onClick={() => handleStatusChange(lot.id, 'Liberado')}
                            className="bg-green-600 hover:bg-green-500 text-white text-[9px] font-bold px-2 py-1 border border-green-800"
                          >
                            LIBERAR
                          </button>
                          <button 
                            onClick={() => handleStatusChange(lot.id, 'Rechazado')}
                            className="bg-red-600 hover:bg-red-500 text-white text-[9px] font-bold px-2 py-1 border border-red-800"
                          >
                            RECHAZAR
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">--- CERRADO ---</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredLots.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-3 py-8 text-center text-slate-500 bg-slate-50 border-b border-slate-300">
                      0 ROWS RETURNED. VERIFY FILTERS.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;