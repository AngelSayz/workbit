import { useEffect, useState } from 'react';

const RepairsPage = () => {
  const [repairs, setRepairs] = useState([]);

  useEffect(() => {
    // Aquí deberías hacer la petición a tu API real
    setRepairs([
      { id: 1, espacio: 'Aula 101', descripcion: 'Proyector no enciende', estado: 'pendiente' },
      { id: 2, espacio: 'Laboratorio', descripcion: 'Aire acondicionado falla', estado: 'en progreso' }
    ]);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mis Reparaciones</h1>
      <div className="bg-white shadow rounded-lg p-4">
        {repairs.length === 0 ? (
          <p>No tienes reparaciones asignadas.</p>
        ) : (
          <ul>
            {repairs.map(r => (
              <li key={r.id} className="mb-2">
                <span className="font-semibold">{r.espacio}:</span> {r.descripcion}
                <span className="ml-2 text-xs text-gray-500">({r.estado})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RepairsPage;