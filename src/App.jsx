// src/App.js

import React, { useState, useEffect, useRef } from "react";
import TurnosTable from "./components/TurnosTable";
import AgregarPersonaForm from "./components/AgregarPersonaForm";
import AdminPanel from "./components/AdminPanel";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import ParticipantesPanel from "./components/ParticipantesPanel";
import MapViewer from "./components/MapViewer";
import defaultCroquis from "./images/default_croquis.jpg";
import html2canvas from "html2canvas";

const dias = ["viernes", "sábado", "domingo"];
const API_URL =
  "https://script.google.com/macros/s/AKfycbzIHRB1u69pJOLQPUlKzyGUUyVmNudW-g6lzE-iJmiA55m4nEyw1SrbfLJ57gQhXbvc/exec";

function App() {
  const [selectedDay, setSelectedDay] = useState("viernes");
  // MODIFICACIÓN CLAVE AQUÍ: Inicializa asignaciones directamente desde localStorage
  const [asignaciones, setAsignaciones] = useState(() => {
    const savedAsignaciones = localStorage.getItem("asignaciones");
    return savedAsignaciones ? JSON.parse(savedAsignaciones) : {};
  });
  // ELIMINA EL useEffect para cargar asignaciones (el que tenía [] como dependencia)
  // porque la inicialización ya lo hace.

  const [modoEdicion, setModoEdicion] = useState(null);
  const [alerta, setAlerta] = useState(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [mostrarDisponibles, setMostrarDisponibles] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  // ... (el resto de tus estados, como personas, turnosPorDia, cajasPorDia, etc., están bien)

  const [personas, setPersonas] = useState(() => {
    const data = localStorage.getItem("personas");
    return data ? JSON.parse(data) : [];
  });

  const [turnosPorDia, setTurnosPorDia] = useState(() => {
    const savedTurnos = localStorage.getItem("turnosPorDia");
    if (savedTurnos) {
      return JSON.parse(savedTurnos);
    }
    return {
      viernes: [
        { id: 1, hora: "8:30 AM - 9:40 AM" },
        { id: 2, hora: "11:45 AM - 12:50 PM" },
        { id: 3, hora: "12:50 PM - 1:50 PM" },
        { id: 4, hora: "4:20 PM - 5:30 PM" },
        { id: 5, hora: "Permanente 9:40 AM - 11:45 AM" },
        { id: 6, hora: "Permanente 1:50 PM - 4:20 PM" },
      ],
      sábado: [
        { id: 1, hora: "8:30 AM - 9:40 AM" },
        { id: 2, hora: "11:45 AM - 12:50 PM" },
        { id: 3, hora: "12:50 PM - 1:50 PM" },
        { id: 4, hora: "4:10 PM - 5:20 PM" },
        { id: 5, hora: "Permanente 9:40 AM - 11:45 AM" },
        { id: 6, hora: "Permanente 1:50 PM - 4:10 PM" },
      ],
      domingo: [
        { id: 1, hora: "8:30 AM - 9:40 AM" },
        { id: 2, hora: "11:45 AM - 12:50 PM" },
        { id: 3, hora: "12:50 PM - 1:50 PM" },
        { id: 4, hora: "3:15 PM - 4:30 PM" },
        { id: 5, hora: "Permanente 9:40 AM - 11:45 AM" },
        { id: 6, hora: "Permanente 1:50 PM - 3:15 PM" },
      ],
    };
  });

  const [cajasPorDia, setCajasPorDia] = useState(() => {
    const savedCajas = localStorage.getItem("cajasPorDia");
    if (savedCajas) {
      return JSON.parse(savedCajas);
    }
    return {
      viernes: ["Caja 1", "Caja 2", "Caja 3"],
      sábado: ["Caja 1", "Caja 2", "Caja 3"],
      domingo: ["Caja 1", "Caja 2", "Caja 3"],
    };
  });

  // REFERENCIA PARA LA TABLA DE TURNOS (para la descarga PNG de la vista actual)
  const turnosTableRef = useRef(null);

  // Referencia para el contenedor del reporte por persona (oculto)
  const reportePersonasRef = useRef(null);

  // Colores para los días (para el listado PNG por persona)
  const dayColors = {
    viernes: "#c1fdffff",
    sábado: "#bdfcd9ff",
    domingo: "#f3ccffff",
  };

  const [mapImageUrl, setMapImageUrl] = useState(() => {
    const savedMapUrl = localStorage.getItem("mapImageUrl");
    return savedMapUrl || null;
  });

  useEffect(() => {
    localStorage.setItem("mapImageUrl", mapImageUrl || "");
  }, [mapImageUrl]);

  useEffect(() => {
    localStorage.setItem("personas", JSON.stringify(personas));
  }, [personas]);

  // Mantén este useEffect para guardar 'asignaciones' cada vez que cambie
  useEffect(() => {
    localStorage.setItem("asignaciones", JSON.stringify(asignaciones));
  }, [asignaciones]);

  useEffect(() => {
    localStorage.setItem("turnosPorDia", JSON.stringify(turnosPorDia));
  }, [turnosPorDia]);

  useEffect(() => {
    localStorage.setItem("cajasPorDia", JSON.stringify(cajasPorDia));
  }, [cajasPorDia]);

  // ... (el resto de tus funciones y JSX)

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

  const setCajasParaDiaSeleccionado = (nuevasCajas) => {
    setCajasPorDia((prev) => ({
      ...prev,
      [selectedDay]: nuevasCajas,
    }));
  };

  const handleDownloadPng = async () => {
    const element = turnosTableRef.current;
    if (!element) {
      mostrarAlerta(
        "No se pudo encontrar la tabla de turnos para descargar.",
        "danger"
      );
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2,
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `listado_turnos_${selectedDay}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      mostrarAlerta("✅ Listado de turnos descargado como PNG.", "success");
    } catch (error) {
      console.error("Error al descargar PNG (vista de turnos):", error);
      mostrarAlerta(
        "❌ Error al descargar el listado de turnos como PNG.",
        "danger"
      );
    }
  };

  const handleDownloadPersonListPng = async () => {
    const container = document.createElement("div");
    container.style.padding = "20px";
    container.style.backgroundColor = "white";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.fontSize = "12px";
    container.style.lineHeight = "1.5";
    container.style.width = "800px";
    container.style.boxSizing = "border-box";

    let contentHtml = `
      <h2 style="text-align: center; margin-bottom: 20px; color: #333;">Listado de Asignaciones por Persona</h2>
      <div style="margin-bottom: 25px; text-align: right; font-size: 10px; color: #666;">
        Fecha de Generación: ${new Date().toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </div>
    `;

    const dayInitials = {
      viernes: { initial: "V", color: dayColors.viernes },
      sábado: { initial: "S", color: dayColors.sábado },
      domingo: { initial: "D", color: dayColors.domingo },
    };

    const personasConAsignaciones = new Set();
    Object.values(asignaciones).forEach((dayAsign) => {
      Object.values(dayAsign).forEach((turnoAsign) => {
        Object.values(turnoAsign).forEach((persona) => {
          if (persona) personasConAsignaciones.add(persona);
        });
      });
    });

    const personasOrdenadas = Array.from(personasConAsignaciones).sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );

    if (personasOrdenadas.length === 0) {
      contentHtml += `<p style="text-align: center; color: gray; margin-top: 30px;">No hay personas con asignaciones actualmente.</p>`;
    } else {
      personasOrdenadas.forEach((persona) => {
        contentHtml += `
          <div style="margin-bottom: 25px; border: 1px solid #ccc; padding: 15px; border-radius: 8px; background-color: #fcfcfc; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <h3 style="margin-top: 0; margin-bottom: 12px; color: #0056b3; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.2em;">📋</span> ${persona}
            </h3>
            <div class="d-flex flex-wrap justify-content-start"> `;
        let hasAssignments = false;
        dias.forEach((day) => {
          const asignacionesDia = asignaciones[day] || {};
          let dayAssignmentsHtml = "";
          const dayInfo = dayInitials[day];

          // Obtener los turnos definidos para el día actual para acceder al horario
          const currentDayTurnosDef = turnosPorDia[day];

          turnosPorDia[day].forEach((turnoDef) => {
            const turnoId = `T${turnoDef.id}`;
            const asignacionTurno = asignacionesDia[turnoId] || {};
            const cajasDePersonaEnTurno = Object.entries(asignacionTurno)
              .filter(([, asignado]) => asignado === persona)
              .map(([caja]) => caja);

            if (cajasDePersonaEnTurno.length > 0) {
              hasAssignments = true;
              dayAssignmentsHtml += `
                <div style="margin-bottom: 3px; display: flex; align-items: flex-start; gap: 5px; font-size: 0.9em;">
                  <span style="margin-right: 5px;">⏰</span>
                  <strong>${turnoId} (${turnoDef.hora})</strong> en
                  <span style="margin-left: 5px;">📦</span> ${cajasDePersonaEnTurno.join(
                    ", "
                  )}
                </div>
              `;
            }
          });

          if (dayAssignmentsHtml) {
            contentHtml += `
              <div class="p-2 rounded shadow-sm mb-2 me-2" style="
                  background-color: ${dayInfo.color};
                  flex: 0 0 calc(50% - 10px);
                  max-width: calc(50% - 10px);
                  min-width: 250px;
                  box-sizing: border-box;
              ">
                <h5 class="mb-2" style="font-weight: bold; font-size: 1em; color: ${dayInfo.color === '#c1ffd3ff' ? '#A0522D' : '#333'};">
                    ${day.charAt(0).toUpperCase() + day.slice(1)} </h5>
                ${dayAssignmentsHtml}
              </div>
            `;
          }

        });

        if (!hasAssignments) {
          contentHtml += `<p class="text-center text-muted p-3">(Sin asignaciones para esta persona)</p>`;
        }

        contentHtml += `
            </div> </div>
        `;
      });
    }

    container.innerHTML = contentHtml;
    document.body.appendChild(container);
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "-9999px";

    try {
      const canvas = await html2canvas(container, {
        useCORS: true,
        scale: 2,
        windowWidth: container.scrollWidth,
        windowHeight: container.scrollHeight,
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `listado_participantes_${new Date()
        .toISOString()
        .slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      mostrarAlerta(
        "✅ Listado de participantes descargado como PNG.",
        "success"
      );
    } catch (error) {
      console.error(
        "Error al descargar el listado de participantes PNG:",
        error
      );
      mostrarAlerta(
        "❌ Error al descargar el listado de participantes como PNG.",
        "danger"
      );
    } finally {
      document.body.removeChild(container);
    }
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
            onClick={() => setShowMapModal(!showMapModal)}
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
          cajas={cajas}
          setCajas={setCajasParaDiaSeleccionado}
          horarios={turnos}
          selectedDay={selectedDay}
          setTurnosPorDia={setTurnosPorDia}
          turnosPorDia={turnosPorDia} // Asegúrate de pasar la prop completa aquí
          asignaciones={asignaciones} // Asegúrate de pasar la prop completa aquí
          setSelectedDay={setSelectedDay}
          mapImageUrl={mapImageUrl}
          setMapImageUrl={setMapImageUrl}
          onDownloadPng={handleDownloadPng}
          onDownloadPersonListPng={handleDownloadPersonListPng}
        />

        {showMapModal && (
          <div className="mb-4">
            <MapViewer
              imageUrl={mapImageUrl}
              show={showMapModal}
              onClose={() => setShowMapModal(false)}
            />
          </div>
        )}

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
          tableRef={turnosTableRef}
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
