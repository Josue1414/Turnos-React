import React, { useState, useEffect } from "react";
import TurnosTable from "./components/TurnosTable";
import AgregarPersonaForm from "./components/AgregarPersonaForm";
import AdminPanel from "./components/AdminPanel";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import ParticipantesPanel from "./components/ParticipantesPanel";

const dias = ["viernes", "sábado", "domingo"];
const API_URL =
  "https://script.google.com/macros/s/AKfycbzIHRB1u69pJOLQPUlKzyGUUyVmNudW-g6lzE-iJmiA55m4nEyw1SrbfLJ57gQhXbvc/exec";

function App() {
  const [selectedDay, setSelectedDay] = useState("viernes");
  const [asignaciones, setAsignaciones] = useState({});
  const [modoEdicion, setModoEdicion] = useState(null);
  const [alerta, setAlerta] = useState(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [mostrarDisponibles, setMostrarDisponibles] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [participantes, setParticipantes] = useState([]);

  const [personas, setPersonas] = useState(() => {
    const data = localStorage.getItem("personas");
    return data ? JSON.parse(data) : [];
  });

  const [turnosPorDia, setTurnosPorDia] = useState({
    viernes: [
      { id: 1, hora: "8:30 AM - 9:40 AM" },
      { id: 2, hora: "11:45 AM - 12:50 PM" },
      { id: 3, hora: "12:50 PM - 1:50 PM" },
      { id: 4, hora: "4:20 PM - 5:30 PM" },
    ],
    sábado: [
      { id: 1, hora: "8:30 AM - 9:40 AM" },
      { id: 2, hora: "11:45 AM - 12:50 PM" },
      { id: 3, hora: "12:50 PM - 1:50 PM" },
      { id: 4, hora: "4:10 PM - 5:20 PM" },
    ],
    domingo: [
      { id: 1, hora: "8:30 AM - 9:40 AM" },
      { id: 2, hora: "11:45 AM - 12:50 PM" },
      { id: 3, hora: "12:50 PM - 1:50 PM" },
      { id: 4, hora: "3:15 PM - 4:30 PM" },
    ],
  });

  const [cajasPorDia, setCajasPorDia] = useState({
    viernes: ["Caja 1", "Caja 2", "Caja 3"],
    sábado: ["Caja 1", "Caja 2", "Caja 3"],
    domingo: ["Caja 1", "Caja 2", "Caja 3"],
  });

  useEffect(() => {
    localStorage.setItem("personas", JSON.stringify(personas));
  }, [personas]);

  useEffect(() => {
    const guardado = localStorage.getItem("asignaciones");
    if (guardado) setAsignaciones(JSON.parse(guardado));
  }, []);

  useEffect(() => {
    localStorage.setItem("asignaciones", JSON.stringify(asignaciones));
  }, [asignaciones]);

  const mostrarAlerta = (mensaje, tipo = "danger") => {
    setAlerta({ mensaje, tipo });
    setTimeout(() => setAlerta(null), 4000);
  };

  const agregarAsignacion = ({ nombre, turno, caja }) => {
    const asignacionesDia = asignaciones[selectedDay] || {};
    const asignacionTurno = asignacionesDia[turno] || {};

    const esEdicion =
      modoEdicion && modoEdicion.turno === turno && modoEdicion.caja === caja;

    if (esEdicion) {
      const nueva = {
        ...asignaciones,
        [selectedDay]: {
          ...asignacionesDia,
          [turno]: { ...asignacionTurno, [caja]: nombre },
        },
      };
      setAsignaciones(nueva);
      setModoEdicion(null);
      return;
    }

    if (Object.values(asignacionTurno).includes(nombre)) {
      mostrarAlerta(`"${nombre}" ya está asignado en el turno ${turno}.`);
      return;
    }

    if (!asignacionTurno[caja]) {
      const nueva = {
        ...asignaciones,
        [selectedDay]: {
          ...asignacionesDia,
          [turno]: { ...asignacionTurno, [caja]: nombre },
        },
      };
      setAsignaciones(nueva);
      return;
    }

    const cajaDisponible = cajasPorDia[selectedDay].find(
      (c) => !asignacionTurno[c]
    );
    if (cajaDisponible) {
      mostrarAlerta(
        `La ${caja} ya está ocupada. Se reasignó a ${cajaDisponible}.`,
        "warning"
      );
      const nueva = {
        ...asignaciones,
        [selectedDay]: {
          ...asignacionesDia,
          [turno]: { ...asignacionTurno, [cajaDisponible]: nombre },
        },
      };
      setAsignaciones(nueva);
    } else {
      mostrarAlerta(`No hay cajas disponibles para el turno ${turno}.`);
    }
  };

  const eliminarAsignacion = ({ turno, caja }) => {
    setConfirmarEliminar({ turno, caja });
  };

  const confirmarEliminarAsignacion = () => {
    const { turno, caja } = confirmarEliminar;
    const copia = { ...asignaciones };
    if (copia[selectedDay]?.[turno]?.[caja]) {
      delete copia[selectedDay][turno][caja];
      setAsignaciones(copia);
    }
    setConfirmarEliminar(null);
  };

  const obtenerDisponibles = () => {
    const disponibles = {};
    const asignacionesDia = asignaciones[selectedDay] || {};

    turnosPorDia[selectedDay].forEach((turno) => {
      const turnoId = `T${turno.id}`;
      const asignacionTurno = asignacionesDia[turnoId] || {};
      const cajasDisponibles = cajasPorDia[selectedDay].filter(
        (caja) => !asignacionTurno[caja]
      );
      disponibles[turnoId] = {
        hora: turno.hora,
        cajas: cajasDisponibles,
      };
    });

    return disponibles;
  };

  const editarAsignacion = (datos) => setModoEdicion(datos);

  const turnos = turnosPorDia[selectedDay];
  const cajas = cajasPorDia[selectedDay];
  const asignacionesDia = asignaciones[selectedDay] || {};

  const setCajas = (nuevasCajas) => {
    setCajasPorDia((prev) => ({
      ...prev,
      [selectedDay]: nuevasCajas,
    }));
  };

  return (
    <div className="d-flex">
      <ParticipantesPanel
        show={mostrarPanel}
        onClose={() => setMostrarPanel(false)}
        personas={personas}
        setPersonas={setPersonas}
        turnosPorDia={turnosPorDia}
      />

      <div className="container mt-4 flex-grow-1">
        <div className="d-flex justify-content-between mb-2">
          <button
            className="btn btn-outline-primary"
            onClick={() => setMostrarPanel(true)}
          >
            👤 Participantes
          </button>

          <button
            className="btn btn-outline-dark"
            onClick={() => setShowAdmin(true)}
          >
            ☰ Menú Admin
          </button>
        </div>

        <AdminPanel
          show={showAdmin}
          onClose={() => setShowAdmin(false)}
          cajas={cajasPorDia[selectedDay]}
          setCajas={(nuevasCajas) => {
            setCajasPorDia((prev) => ({
              ...prev,
              [selectedDay]: nuevasCajas,
            }));
          }}
          horarios={turnosPorDia[selectedDay]}
          selectedDay={selectedDay}
          setTurnosPorDia={setTurnosPorDia}
          turnosPorDia={turnosPorDia}
          asignaciones={asignaciones}
          setSelectedDay={setSelectedDay}
        />

        <div className="d-flex justify-content-center mb-4 flex-wrap">
          {dias.map((dia) => (
            <button
              key={dia}
              className={`btn mx-1 mb-2 ${
                selectedDay === dia ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => {
                setSelectedDay(dia);
                setModoEdicion(null);
              }}
            >
              {dia.charAt(0).toUpperCase() + dia.slice(1)}
            </button>
          ))}
        </div>

        {alerta && (
          <div
            className={`alert alert-${alerta.tipo} position-fixed top-0 start-50 translate-middle-x mt-3 z-3`}
            style={{ minWidth: "300px", maxWidth: "80%" }}
          >
            {alerta.mensaje}
          </div>
        )}

        <div className="d-flex justify-content-center mb-3">
          <button
            className="btn btn-outline-secondary"
            onClick={() => setMostrarDisponibles(!mostrarDisponibles)}
          >
            {mostrarDisponibles
              ? "Ocultar lugares disponibles"
              : "Ver lugares disponibles"}{" "}
            <span>{mostrarDisponibles ? "▲" : "▼"}</span>
          </button>
        </div>

        {mostrarDisponibles && (
          <div className="mb-4">
            <div className="card card-body">
              <h5 className="mb-3 text-center">
                Lugares disponibles - {selectedDay}
              </h5>
              <div className="table-responsive">
                <table className="table table-bordered text-center">
                  <thead className="table-light">
                    <tr>
                      <th>Turno</th>
                      <th>Horario</th>
                      <th>Cajas disponibles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(obtenerDisponibles()).map(
                      ([turnoId, info]) => (
                        <tr key={turnoId}>
                          <td>{turnoId}</td>
                          <td>{info.hora}</td>
                          <td>
                            {info.cajas.length > 0 ? (
                              info.cajas.join(", ")
                            ) : (
                              <span className="text-danger">Sin espacios</span>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <AgregarPersonaForm
          cajas={cajas}
          turnos={turnos}
          onAgregar={agregarAsignacion}
          modoEdicion={modoEdicion}
          setModoEdicion={setModoEdicion}
          personas={personas}
          setPersonas={setPersonas}
          setTurnosPorDia={setTurnosPorDia}
        />

        <TurnosTable
          asignaciones={asignacionesDia}
          turnos={turnos}
          cajas={cajas}
          onEditar={editarAsignacion}
          onEliminar={eliminarAsignacion}
        />

        {confirmarEliminar && (
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirmar eliminación</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setConfirmarEliminar(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  ¿Estás seguro de que deseas eliminar esta asignación?
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setConfirmarEliminar(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={confirmarEliminarAsignacion}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
