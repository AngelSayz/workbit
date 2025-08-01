import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const RepairsPage = () => {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRepairs = async () => {
      setLoading(true);
      try {
        // Ajusta la URL según tu backend real
        const response = await fetch(`/api/tasks?userId=${user.id}`);
        const data = await response.json();
        // Suponiendo que cada tarea incluye espacio y descripción
        setRepairs(data);
      } catch (error) {
        setRepairs([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchRepairs();
    }
  }, [user]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mis Reparaciones</h1>
      <div className="bg-white shadow rounded-lg p-4">
        {loading ? (
          <p>Cargando...</p>
        ) : repairs.length === 0 ? (
          <p>No tienes reparaciones asignadas.</p>
        ) : (
          <ul>
            {repairs.map(r => (
              <li key={r.id} className="mb-2">
                <span className="font-semibold">{r.espacio || r.space_name}:</span> {r.descripcion || r.description}
                <span className="ml-2 text-xs text-gray-500">({r.estado || r.status})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RepairsPage;