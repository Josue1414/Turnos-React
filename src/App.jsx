import React, { useState, useEffect } from "react";
import TurnosTable from "./components/TurnosTable";
import AgregarPersonaForm from "./components/AgregarPersonaForm";
import AdminPanel from "./components/AdminPanel";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import ParticipantesPanel from "./components/ParticipantesPanel";
import MapViewer from "./components/MapViewer";

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
  const [participantes, setParticipantes] = useState([]); // Este estado parece no usarse directamente, pero lo dejo
  const [showMapModal, setShowMapModal] = useState(false);

  // Estado para personas
  const [personas, setPersonas] = useState(() => {
    const data = localStorage.getItem("personas");
    return data ? JSON.parse(data) : [];
  });

  //Inicializar turnosPorDia desde localStorage
  const [turnosPorDia, setTurnosPorDia] = useState(() => {
    const savedTurnos = localStorage.getItem("turnosPorDia");
    if (savedTurnos) {
      return JSON.parse(savedTurnos);
    }
    // Si no hay datos guardados, usa los valores por defecto
    return {
      viernes: [
        { id: 1, hora: "8:30 AM - 9:40 AM" },
        { id: 2, hora: "11:45 AM - 12:50 PM" },
        { id: 3, hora: "12:50 PM - 1:50 PM" },
        { id: 4, hora: "4:20 PM - 5:30 PM" },
        // *** NUEVOS HORARIOS PARA VIERNES ***
        { id: 5, hora: "Permanente 9:40 AM - 11:45 AM" },
        { id: 6, hora: "Permanente 1:50 PM - 4:20 PM" },
      ],
      sábado: [
        { id: 1, hora: "8:30 AM - 9:40 AM" },
        { id: 2, hora: "11:45 AM - 12:50 PM" },
        { id: 3, hora: "12:50 PM - 1:50 PM" },
        { id: 4, hora: "4:10 PM - 5:20 PM" },
        // *** NUEVOS HORARIOS PARA SÁBADO ***
        { id: 5, hora: "Permanente 9:40 AM - 11:45 AM" },
        { id: 6, hora: "Permanente 1:50 PM - 4:10 PM" },
      ],
      domingo: [
        { id: 1, hora: "8:30 AM - 9:40 AM" },
        { id: 2, hora: "11:45 AM - 12:50 PM" },
        { id: 3, hora: "12:50 PM - 1:50 PM" },
        { id: 4, hora: "3:15 PM - 4:30 PM" },
        // *** NUEVOS HORARIOS PARA DOMINGO ***
        { id: 5, hora: "Permanente 9:40 AM - 11:45 AM" },
        { id: 6, hora: "Permanente 1:50 PM - 3:15 PM" },
      ],
    };
  });

  //Inicializar cajasPorDia desde localStorage
  const [cajasPorDia, setCajasPorDia] = useState(() => {
    const savedCajas = localStorage.getItem("cajasPorDia");
    if (savedCajas) {
      return JSON.parse(savedCajas);
    }
    // Si no hay datos guardados, usa los valores por defecto
    return {
      viernes: ["Caja 1", "Caja 2", "Caja 3"],
      sábado: ["Caja 1", "Caja 2", "Caja 3"],
      domingo: ["Caja 1", "Caja 2", "Caja 3"],
    };
  });

  const [mapImageUrl, setMapImageUrl] = useState(() => {
    const savedMapUrl = localStorage.getItem("mapImageUrl");
    return savedMapUrl || null;
  });

  useEffect(() => {
    localStorage.setItem("mapImageUrl", mapImageUrl || "");
  }, [mapImageUrl]);

  // useEffect para guardar 'personas'
  useEffect(() => {
    localStorage.setItem("personas", JSON.stringify(personas));
  }, [personas]);

  // useEffect para cargar 'asignaciones'
  useEffect(() => {
    const guardado = localStorage.getItem("asignaciones");
    if (guardado) setAsignaciones(JSON.parse(guardado));
  }, []);

  // useEffect para guardar 'asignaciones' (ya lo tenías)
  useEffect(() => {
    localStorage.setItem("asignaciones", JSON.stringify(asignaciones));
  }, [asignaciones]);

  useEffect(() => {
    localStorage.setItem("turnosPorDia", JSON.stringify(turnosPorDia));
  }, [turnosPorDia]);

  useEffect(() => {
    localStorage.setItem("cajasPorDia", JSON.stringify(cajasPorDia));
  }, [cajasPorDia]);

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

  // Estas líneas ahora obtienen los valores de los estados persistidos
  const turnos = turnosPorDia[selectedDay];
  const cajas = cajasPorDia[selectedDay];
  const asignacionesDia = asignaciones[selectedDay] || {};

  // La función setCajas aquí es un envoltorio que actualiza cajasPorDia
  // para el día seleccionado, y gracias al useEffect, esto se persistirá.
  const setCajasParaDiaSeleccionado = (nuevasCajas) => {
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
        asignaciones={asignaciones}
        setAsignaciones={setAsignaciones}
        turnosPorDia={turnosPorDia}
      />


      <div className="container mt-4 flex-grow-1">
        <h1 className="mb-4 text-center">Gestión de Turnos</h1>
        <div className="d-flex justify-content-between mb-2">
          <button
            className="btn btn-outline-primary"
            onClick={() => setMostrarPanel(true)}
          >
            👤 Participantes
          </button>

          <button
            className="btn btn-outline-info"
            onClick={() => setShowMapModal(!showMapModal)} // Alterna el estado
          >
            🗺️ {showMapModal ? "Ocultar Croquis" : "Ver Croquis"}
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
          // Ahora pasamos el array de cajas del día seleccionado
          cajas={cajas}
          // Y el setter que actualiza solo las cajas del día seleccionado
          setCajas={setCajasParaDiaSeleccionado}
          // Pasamos los turnos del día seleccionado
          horarios={turnos}
          selectedDay={selectedDay}
          setTurnosPorDia={setTurnosPorDia} // Este setter se encarga de todo el objeto turnosPorDia
          turnosPorDia={turnosPorDia} // Pasamos todo el objeto turnosPorDia
          asignaciones={asignaciones}
          setSelectedDay={setSelectedDay}
          mapImageUrl={mapImageUrl}
          setMapImageUrl={setMapImageUrl}
        />

        {/* Puedes decidir si lo muestras siempre o solo al hacer clic en un botón */}
        {/* Solo se renderiza si showMapModal es true */}
        {showMapModal && (
          <div className="mb-4">
            <MapViewer imageUrl={mapImageUrl} show={showMapModal} onClose={() => setShowMapModal(false)} />
          </div>
        )}

        <div className="d-flex justify-content-center mb-4 flex-wrap">
          {dias.map((dia) => (
            <button
              key={dia}
              className={`btn mx-1 mb-2 ${selectedDay === dia ? "btn-primary" : "btn-outline-primary"
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