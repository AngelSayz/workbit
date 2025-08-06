import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Wrench, 
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  UserPlus,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { usersAPI, tasksAPI, authAPI, spacesAPI } from '../../api/apiService';

const StaffPage = () => {
  const [technicians, setTechnicians] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('technicians'); // 'technicians' or 'tasks'
  const [showAddTechnicianModal, setShowAddTechnicianModal] = useState(false);
  const [showEditTechnicianModal, setShowEditTechnicianModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const { t } = useTranslation();

  // Form states
  const [newTechnician, setNewTechnician] = useState({
    name: '',
    lastname: '',
    username: '',
    email: '',
    password: '',
    cardCode: ''
  });
  const [editTechnician, setEditTechnician] = useState({
    id: '',
    name: '',
    lastname: '',
    username: '',
    cardCode: ''
  });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    space_id: '',
    assigned_to: ''
  });
  const [spaces, setSpaces] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [updatingTasks, setUpdatingTasks] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTechnicians(),
        fetchTasks(),
        fetchSpaces()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await usersAPI.getUsersByRole('technician');
      if (response.users) {
        setTechnicians(response.users);
      } else {
        setError('Error al cargar los técnicos');
      }
    } catch (err) {
      console.error('Error fetching technicians:', err);
      setError('Error al cargar los técnicos');
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await tasksAPI.getTasks();
      if (response.data?.tasks) {
        setTasks(response.data.tasks);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setTasks([]);
    }
  };

  const fetchSpaces = async () => {
    try {
      const response = await spacesAPI.getSpaces();
      console.log('Spaces API response:', response);
      if (response.spaces) {
        setSpaces(response.spaces);
        console.log('Spaces loaded:', response.spaces.length);
      } else {
        setSpaces([]);
        console.log('No spaces found in response');
      }
    } catch (err) {
      console.error('Error fetching spaces:', err);
      setSpaces([]);
    }
  };

  const filteredTechnicians = technicians.filter(technician => 
    technician.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    technician.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    technician.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTechnician = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const technicianData = {
        ...newTechnician,
        role: 'technician'
      };
      
      const response = await authAPI.adminRegister(technicianData);
      
      if (response.message || response.success) {
        await fetchTechnicians();
        setNewTechnician({
          name: '',
          lastname: '',
          username: '',
          email: '',
          password: '',
          cardCode: ''
        });
        setShowAddTechnicianModal(false);
        alert('Técnico creado exitosamente');
      } else {
        throw new Error(response.error || 'Error al crear técnico');
      }
    } catch (err) {
      console.error('Error creating technician:', err);
      setFormError(err.response?.data?.message || err.message || 'Error al crear técnico');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const response = await tasksAPI.createTask(newTask);
      
      if (response.success) {
        await fetchTasks();
        setNewTask({
          title: '',
          description: '',
          priority: 'medium',
          space_id: '',
          assigned_to: ''
        });
        setShowAddTaskModal(false);
        alert('Tarea creada exitosamente');
      } else {
        throw new Error(response.error || 'Error al crear tarea');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setFormError(err.response?.data?.message || err.message || 'Error al crear tarea');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditTechnician = (technician) => {
    setEditTechnician({
      id: technician.id,
      name: technician.name,
      lastname: technician.lastname,
      username: technician.username,
      cardCode: technician.cardCode || ''
    });
    setShowEditTechnicianModal(true);
  };

  const handleUpdateTechnician = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      // Update basic user information
      const userUpdateData = {
        name: editTechnician.name,
        lastname: editTechnician.lastname,
        username: editTechnician.username
      };

      const response = await usersAPI.updateUser(editTechnician.id, userUpdateData);
      
      if (response.success || response.message) {
        // If card code is provided, update it separately
        if (editTechnician.cardCode && editTechnician.cardCode.trim()) {
          try {
            await usersAPI.updateUserCardCode(editTechnician.id, editTechnician.cardCode.trim());
          } catch (cardError) {
            console.error('Error updating card code:', cardError);
            setFormError(cardError.response?.data?.message || 'Error al actualizar el código de tarjeta');
            setFormLoading(false);
            return;
          }
        }

        await fetchTechnicians();
        setEditTechnician({
          id: '',
          name: '',
          lastname: '',
          username: '',
          cardCode: ''
        });
        setShowEditTechnicianModal(false);
        alert('Técnico actualizado exitosamente');
      } else {
        throw new Error(response.error || 'Error al actualizar técnico');
      }
    } catch (err) {
      console.error('Error updating technician:', err);
      setFormError(err.response?.data?.message || err.message || 'Error al actualizar técnico');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTechnician = async (technicianId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este técnico? Esta acción no se puede deshacer.')) {
      try {
        const response = await usersAPI.deleteUser(technicianId);
        
        if (response.success || response.message) {
          await fetchTechnicians();
          alert('Técnico eliminado exitosamente');
        } else {
          throw new Error(response.error || 'Error al eliminar técnico');
        }
      } catch (err) {
        console.error('Error deleting technician:', err);
        alert(err.response?.data?.message || err.message || 'Error al eliminar técnico');
      }
    }
  };

  const handleUpdateTaskAssignment = async (taskId, assignedTo) => {
    setUpdatingTasks(prev => new Set(prev).add(taskId));
    try {
      const response = await tasksAPI.updateTask(taskId, { assigned_to: assignedTo || null });
      
      if (response.success) {
        await fetchTasks();
        // Silently update without alert
      } else {
        throw new Error(response.error || 'Error al actualizar tarea');
      }
    } catch (err) {
      console.error('Error updating task:', err);
      alert(err.response?.data?.message || err.message || 'Error al actualizar tarea');
    } finally {
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    setUpdatingTasks(prev => new Set(prev).add(taskId));
    try {
      const response = await tasksAPI.updateTask(taskId, { status });
      
      if (response.success) {
        await fetchTasks();
        // Silently update without alert
      } else {
        throw new Error(response.error || 'Error al actualizar estado');
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      alert(err.response?.data?.message || err.message || 'Error al actualizar estado');
    } finally {
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      try {
        const response = await tasksAPI.deleteTask(taskId);
        
        if (response.success) {
          await fetchTasks();
          alert('Tarea eliminada exitosamente');
        } else {
          throw new Error(response.error || 'Error al eliminar tarea');
        }
      } catch (err) {
        console.error('Error deleting task:', err);
        alert(err.response?.data?.message || err.message || 'Error al eliminar tarea');
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchTechnicians}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Staff</h1>
          <p className="text-gray-600 mt-2">Administrar técnicos y tareas del sistema</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'technicians' && (
            <button 
              onClick={() => setShowAddTechnicianModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Agregar Técnico
            </button>
          )}
          {activeTab === 'tasks' && (
            <button 
              onClick={() => setShowAddTaskModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Tarea
            </button>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-1"
      >
        <div className="flex">
          <button
            onClick={() => setActiveTab('technicians')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'technicians'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Técnicos ({technicians.length})
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'tasks'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Wrench className="w-4 h-4 inline mr-2" />
            Tareas ({tasks.length})
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={`Buscar ${activeTab === 'technicians' ? 'técnicos' : 'tareas'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </motion.div>

      {/* Content based on active tab */}
      {activeTab === 'technicians' ? (
        <>
          {/* Technicians Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredTechnicians.length > 0 ? (
              filteredTechnicians.map((technician) => (
                <motion.div
                  key={technician.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Wrench className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {technician.name} {technician.lastname}
                        </h3>
                        <p className="text-sm text-gray-500">@{technician.username}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditTechnician(technician)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar técnico"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTechnician(technician.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar técnico"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      <span>{technician.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span className="capitalize">{technician.role}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Registrado:</span>
                      <span className="text-gray-900">
                        {new Date(technician.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-500">Acceso Maestro:</span>
                      {technician.cardCode ? (
                        <div className="flex items-center">
                          <span className="text-green-600 font-medium mr-2">✓ Activo</span>
                          <span className="text-gray-700 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {technician.cardCode}
                          </span>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-medium">⚠ Sin tarjeta</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full">
                <div className="text-center py-12">
                  <Wrench className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No se encontraron técnicos
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'No hay técnicos que coincidan con la búsqueda' : 'No hay técnicos registrados en el sistema'}
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Technicians Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Técnicos</p>
                  <p className="text-2xl font-bold text-gray-900">{technicians.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{technicians.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Con Tarjeta</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {technicians.filter(t => t.cardCode).length}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      ) : (
        <>
          {/* Tasks Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarea
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asignado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task, index) => (
                      <motion.tr
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{task.title}</div>
                            <div className="text-sm text-gray-500">{task.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                          </span>
                        </td>
                                                 <td className="px-6 py-4 whitespace-nowrap">
                           <select
                             value={task.status || 'pending'}
                             onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                             disabled={updatingTasks.has(task.id)}
                             className={`px-2 py-1 border border-gray-300 rounded text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${updatingTasks.has(task.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                           >
                             <option value="pending">Pendiente</option>
                             <option value="in_progress">En Progreso</option>
                             <option value="completed">Completada</option>
                             <option value="cancelled">Cancelada</option>
                           </select>
                         </td>
                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           <select
                             value={task.assigned_to || ''}
                             onChange={(e) => handleUpdateTaskAssignment(task.id, e.target.value)}
                             disabled={updatingTasks.has(task.id)}
                             className={`px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[120px] ${updatingTasks.has(task.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                           >
                             <option value="">Sin asignar</option>
                             {technicians.map(tech => (
                               <option key={tech.id} value={tech.id}>
                                 {tech.name} {tech.lastname}
                               </option>
                             ))}
                           </select>
                         </td>
                                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                           <div className="flex items-center space-x-2">
                             <button 
                               onClick={() => handleDeleteTask(task.id)}
                               className="text-red-600 hover:text-red-900"
                               title="Eliminar tarea"
                             >
                               <Trash2 size={16} />
                             </button>
                           </div>
                         </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="text-center">
                          <Wrench className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No se encontraron tareas
                          </h3>
                          <p className="text-gray-500">
                            {searchTerm ? 'No hay tareas que coincidan con la búsqueda' : 'No hay tareas registradas en el sistema'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Tasks Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Wrench className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tareas</p>
                  <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tasks.filter(t => t.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En Progreso</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tasks.filter(t => t.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completadas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tasks.filter(t => t.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Add Technician Modal */}
      {showAddTechnicianModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Agregar Técnico</h2>
              <button
                onClick={() => setShowAddTechnicianModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTechnician} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={newTechnician.name}
                  onChange={(e) => setNewTechnician({...newTechnician, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  required
                  value={newTechnician.lastname}
                  onChange={(e) => setNewTechnician({...newTechnician, lastname: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario
                </label>
                <input
                  type="text"
                  required
                  value={newTechnician.username}
                  onChange={(e) => setNewTechnician({...newTechnician, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={newTechnician.email}
                  onChange={(e) => setNewTechnician({...newTechnician, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={newTechnician.password}
                  onChange={(e) => setNewTechnician({...newTechnician, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code Card (opcional)
                </label>
                <input
                  type="text"
                  value={newTechnician.cardCode}
                  onChange={(e) => setNewTechnician({...newTechnician, cardCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTechnicianModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading ? 'Creando...' : 'Crear Técnico'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Agregar Tarea</h2>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  required
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridad
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Espacio
                </label>
                <select
                  required
                  value={newTask.space_id}
                  onChange={(e) => setNewTask({...newTask, space_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar espacio</option>
                  {spaces.map(space => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asignar a Técnico (opcional)
                </label>
                <select
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sin asignar</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} {tech.lastname}
                    </option>
                  ))}
                </select>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {formLoading ? 'Creando...' : 'Crear Tarea'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Technician Modal */}
      {showEditTechnicianModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Editar Técnico</h2>
              <button
                onClick={() => setShowEditTechnicianModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateTechnician} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={editTechnician.name}
                  onChange={(e) => setEditTechnician({...editTechnician, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  required
                  value={editTechnician.lastname}
                  onChange={(e) => setEditTechnician({...editTechnician, lastname: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario
                </label>
                <input
                  type="text"
                  required
                  value={editTechnician.username}
                  onChange={(e) => setEditTechnician({...editTechnician, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code Card <span className="text-sm text-gray-500">(Master Card)</span>
                </label>
                <input
                  type="text"
                  value={editTechnician.cardCode}
                  onChange={(e) => setEditTechnician({...editTechnician, cardCode: e.target.value})}
                  placeholder="Asignar tarjeta RFID para acceso maestro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Los técnicos con code card tendrán acceso maestro a todos los espacios
                </p>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditTechnicianModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading ? 'Actualizando...' : 'Actualizar Técnico'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StaffPage; 