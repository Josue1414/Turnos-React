import React from "react";

const TurnosTable = ({ asignaciones, turnos, cajas, onEditar, onEliminar }) => {
  return (
    <div className="table-responsive mb-4">
      <table className="table table-bordered text-center align-middle">
        <thead className="table-dark">
          <tr>
            <th>Turno</th>
            <th>Horario</th>
            {cajas.map((caja) => (
              <th key={caja}>{caja}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {turnos.map((turno) => {
            const turnoId = `T${turno.id}`;
            const fila = asignaciones[turnoId] || {};
            return (
              <tr key={turno.id}>
                <td>{turnoId}</td>
                <td>{turno.hora}</td>
                {cajas.map((caja) => (
                  <td key={caja}>
                    {fila[caja] ? (
                      <div className="d-flex justify-content-between align-items-center">
                        <span>{fila[caja]}</span>
                        <div className="btn-group btn-group-sm ms-2">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() =>
                              onEditar({
                                nombre: fila[caja],
                                turno: turnoId,
                                caja,
                              })
                            }
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() =>
                              onEliminar({ turno: turnoId, caja })
                            }
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TurnosTable;
