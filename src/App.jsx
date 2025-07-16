// src/App.jsx
import React, { useState, useEffect } from "react";
import TurnosTable from "./components/TurnosTable";
import AgregarPersonaForm from "./components/AgregarPersonaForm";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const dias = ["viernes", "sábado", "domingo"];
const API_URL = "https://script.google.com/macros/s/AKfycbzIHRB1u69pJOLQPUlKzyGUUyVmNudW-g6lzE-iJmiA55m4nEyw1SrbfLJ57gQhXbvc/exec"; // Cambia esto por tu URL

const turnosPorDia = {
  viernes: [
    { id: 1, hora: "8:30 AM - 9:40 AM" },
    { id: 2, hora: "11:45 AM - 12:50 PM" },
    { id: 3, hora: "12:50 PM - 1:50 PM" },
    { id: 4, hora: "4:20 PM - 5:30 PM" },
  ],
  sábado: [
    { id: 1, hora: "9:00 AM - 10:00 AM" },
    { id: 2, hora: "12:00 PM - 1:00 PM" },
    { id: 3, hora: "3:00 PM - 4:00 PM" },
  ],
  domingo: [
    { id: 1, hora: "10:00 AM - 11:00 AM" },
    { id: 2, hora: "1:00 PM - 2:00 PM" },
  ],
};

const cajas = ["Caja 1", "Caja 2", "Caja 3"];

function App() {
  const [selectedDay, setSelectedDay] = useState("viernes");
  const [asignaciones, setAsignaciones] = useState({});
  const [modoEdicion, setModoEdicion] = useState(null);
  const [alerta, setAlerta] = useState(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [mostrarDisponibles, setMostrarDisponibles] = useState(false);


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
      modoEdicion &&
      modoEdicion.turno === turno &&
      modoEdicion.caja === caja;

    // Si es edición, simplemente actualizamos el nombre en la misma caja y turno
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

    // Validación: nombre ya asignado en otro lado del mismo turno
    if (Object.values(asignacionTurno).includes(nombre)) {
      mostrarAlerta(`"${nombre}" ya está asignado en el turno ${turno}.`);
      return;
    }

    // Si la caja está libre, simplemente la usamos
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

    // Buscar otra caja disponible
    const cajaDisponible = cajas.find((c) => !asignacionTurno[c]);
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
      const cajasDisponibles = cajas.filter((caja) => !asignacionTurno[caja]);
      disponibles[turnoId] = {
        hora: turno.hora,
        cajas: cajasDisponibles,
      };
    });

    return disponibles;
  };

  const editarAsignacion = (datos) => setModoEdicion(datos);

  const guardarEnDrive = async () => {
  try {
    const res = await fetch(`${API_URL}?method=guardar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: asignaciones }),
    });

    const data = await res.json();

    if (data.success) {
      mostrarAlerta("Guardado correctamente en Drive", "success");
    } else {
      mostrarAlerta("Error al guardar: " + (data.error || ""));
    }
  } catch (error) {
    mostrarAlerta("Error al guardar en Drive");
    console.error("Detalle del error:", error);
  }
};


  const cargarDesdeDrive = async () => {
    try {
      // Agregamos headers específicos para Google Apps Script
      const res = await fetch(API_URL + "?method=cargar", {
        method: "GET"
      });
      // Verificamos si la respuesta es válida
      if (!res.ok) {
        throw new Error(`Error de red: ${res.status}`);
      }

      const data = await res.json();

      // Validamos la estructura de la respuesta
      if (!data.success) {
        throw new Error(`Error en el servidor: ${data.error || 'Sin mensaje de error'}`);
      }

      // Verificamos que los datos tengan el formato esperado
      if (!data.data || typeof data.data !== 'object') {
        throw new Error('Datos inválidos recibidos del servidor');
      }

      // Actualizamos el estado solo si los datos son válidos
      setAsignaciones(data.data);
      mostrarAlerta("Datos cargados desde Drive", "success");

    } catch (error) {
      mostrarAlerta(`Error al cargar datos: ${error.message}`, "danger");
      console.error('Detalle del error:', error);
    }
  };

  const exportarCSV = () => {
    let filas = [["Día", "Turno", "Caja", "Nombre"]];

    for (let dia in asignaciones) {
      const turnosDia = asignaciones[dia];
      for (let turno in turnosDia) {
        const cajasTurno = turnosDia[turno];
        for (let caja in cajasTurno) {
          filas.push([dia, turno, caja, cajasTurno[caja]]);
        }
      }
    }

    const contenido = filas.map((fila) => fila.join(",")).join("\n");
    const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "asignaciones.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const turnos = turnosPorDia[selectedDay];
  const asignacionesDia = asignaciones[selectedDay] || {};

  return (
    <div className="container mt-4">
      <h1 className="mb-4 text-center">Gestión de Turnos</h1>

      <div className="d-flex justify-content-center mb-4 flex-wrap">
        {dias.map((dia) => (
          <button
            key={dia}
            className={`btn mx-1 mb-2 ${selectedDay === dia ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => {
              setSelectedDay(dia);
              setModoEdicion(null);
            }}
          >
            {dia.charAt(0).toUpperCase() + dia.slice(1)}
          </button>
        ))}
      </div>

      <div className="d-flex justify-content-center gap-2 mb-3 flex-wrap">
        <button className="btn btn-outline-success" onClick={guardarEnDrive}>Guardar en Drive</button>
        <button className="btn btn-outline-info" onClick={cargarDesdeDrive}>Cargar desde Drive</button>
        <button className="btn btn-outline-secondary" onClick={exportarCSV}>Exportar CSV</button>
      </div>

      {alerta && (
        <div className={`alert alert-${alerta.tipo} position-fixed top-0 start-50 translate-middle-x mt-3 z-3`} style={{ minWidth: "300px", maxWidth: "80%" }}>
          {alerta.mensaje}
        </div>
      )}

      <div className="d-flex justify-content-center mb-3">
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={() => setMostrarDisponibles(!mostrarDisponibles)}
          aria-expanded={mostrarDisponibles}
          aria-controls="disponiblesCollapse"
        >
          {mostrarDisponibles ? "Ocultar lugares disponibles" : "Ver lugares disponibles"}{" "}
          <span>{mostrarDisponibles ? "▲" : "▼"}</span>
        </button>
      </div>


      <div className={`mb-4 ${mostrarDisponibles ? "" : "d-none"}`} id="disponiblesCollapse">
        <div className="card card-body">
          <h5 className="mb-3 text-center">Lugares disponibles - {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}</h5>
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
                {Object.entries(obtenerDisponibles()).map(([turnoId, info]) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>


      <AgregarPersonaForm
        cajas={cajas}
        turnos={turnos}
        onAgregar={agregarAsignacion}
        modoEdicion={modoEdicion}
        setModoEdicion={setModoEdicion}
      />

      <TurnosTable
        asignaciones={asignacionesDia}
        turnos={turnos}
        cajas={cajas}
        onEditar={editarAsignacion}
        onEliminar={eliminarAsignacion}
      />

      {/* Modal de confirmación Bootstrap */}
      {confirmarEliminar && (
        <div className="modal fade show d-block" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar eliminación</h5>
                <button type="button" className="btn-close" onClick={() => setConfirmarEliminar(null)}></button>
              </div>
              <div className="modal-body">
                ¿Estás seguro de que deseas eliminar esta asignación?
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setConfirmarEliminar(null)}>Cancelar</button>
                <button className="btn btn-danger" onClick={confirmarEliminarAsignacion}>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
