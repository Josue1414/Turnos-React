import React, { useState } from "react";
import { Offcanvas, Button, Form, Accordion, ListGroup, ButtonGroup } from "react-bootstrap";
import * as XLSX from 'xlsx';

const dias = ["viernes", "sábado", "domingo"];

const AdminPanel = ({ show, onClose, cajas, setCajas, turnosPorDia, setTurnosPorDia, selectedDay, setSelectedDay, asignaciones, mapImageUrl,
  setMapImageUrl, }) => {
  const [nuevaCaja, setNuevaCaja] = useState("");
  const [nuevoTurno, setNuevoTurno] = useState("");
  const [alerta, setAlerta] = useState(null);

  const mostrarAlerta = (mensaje, variante = "warning") => {
    setAlerta({ mensaje, variante });
    setTimeout(() => setAlerta(null), 3000);
  };

  // función para manejar el envío del formulario de cajas
  const manejarAgregarCaja = (e) => {
    e.preventDefault(); // <--- ESTO ES CLAVE: Previene la recarga de la página

    if (nuevaCaja.trim() && !cajas.includes(nuevaCaja.trim())) { // Asegúrate de usar .trim() al verificar existencia también
      setCajas([...cajas, nuevaCaja.trim()]);
      setNuevaCaja("");
      // Opcional: mostrar una alerta de éxito
      // mostrarAlerta("Caja agregada exitosamente.", "success");
    } else if (cajas.includes(nuevaCaja.trim())) {
      mostrarAlerta("¡Esa caja ya existe!", "danger");
    } else {
      mostrarAlerta("El nombre de la caja no puede estar vacío.", "warning");
    }
  };

  const eliminarCaja = (nombre) => {
    // Implementa lógica para evitar eliminar si tiene asignaciones
    // Por ahora, solo elimina si no está asignada.
    // Si necesitas verificar asignaciones antes de eliminar una caja,
    // tendrías que pasar 'asignaciones' a esta función o buscar aquí.
    const isCajaAsignada = Object.values(asignaciones[selectedDay] || {}).some(turnoObj =>
      Object.keys(turnoObj).includes(nombre)
    );

    if (isCajaAsignada) {
      mostrarAlerta(`No se puede eliminar "${nombre}" porque tiene asignaciones activas.`);
      return;
    }

    setCajas(cajas.filter((c) => c !== nombre));
  };


  // Función ya existente para manejar el envío del formulario de horarios (al presionar Enter)
  const manejarAgregarHorario = (e) => {
    e.preventDefault(); // Previene la recarga de la página

    const hora = nuevoTurno.trim();
    const turnosActuales = turnosPorDia[selectedDay] || [];

    if (!hora) {
      mostrarAlerta("⚠️ El horario no puede estar vacío.");
      return;
    }

    const yaExiste = turnosActuales.some(
      (t) => t.hora.toLowerCase() === hora.toLowerCase()
    );

    if (yaExiste) {
      mostrarAlerta("🚫 Ese horario ya existe en este día.");
      return;
    }

    const nuevoId = turnosActuales.length
      ? Math.max(...turnosActuales.map((t) => t.id)) + 1
      : 1;

    const nuevoTurnoObj = { id: nuevoId, hora };

    const actualizados = {
      ...turnosPorDia,
      [selectedDay]: [...turnosActuales, nuevoTurnoObj],
    };

    setTurnosPorDia(actualizados);
    setNuevoTurno("");
  };

  const exportarCSV = () => {
    const rows = [["Día", "Turno", "Hora", "Caja", "Persona"]];

    Object.entries(turnosPorDia).forEach(([dia, turnos]) => {
      const asignacionesDia = asignaciones[dia] || {};
      turnos.forEach((turno) => {
        const turnoId = `T${turno.id}`;
        const asignacionTurno = asignacionesDia[turnoId] || {};
        Object.entries(asignacionTurno).forEach(([caja, persona]) => {
          rows.push([dia, turnoId, turno.hora, caja, persona]);
        });
      });
    });

    const csvContent = "\uFEFF" + rows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "turnos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarExcel = () => {
    const data = [];
    data.push(["Día", "Turno", "Hora", "Caja", "Persona"]); // Encabezados

    Object.entries(turnosPorDia).forEach(([dia, turnos]) => {
      const asignacionesDia = asignaciones[dia] || {};
      turnos.forEach((turno) => {
        const turnoId = `T${turno.id}`;
        const asignacionTurno = asignacionesDia[turnoId] || {};
        // Si no hay asignaciones para este turno, aún lo incluimos para mostrar el horario
        if (Object.keys(asignacionTurno).length === 0) {
          data.push([dia, turnoId, turno.hora, "", ""]); // Fila vacía para turno sin asignación
        } else {
          Object.entries(asignacionTurno).forEach(([caja, persona]) => {
            data.push([dia, turnoId, turno.hora, caja, persona]);
          });
        }
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Turnos Asignados");
    XLSX.writeFile(wb, "turnos.xlsx");
  };

  const handleMapImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Limite de 2MB
        mostrarAlerta("La imagen es demasiado grande. Por favor, sube una imagen de menos de 2MB.", "danger");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setMapImageUrl(reader.result); // Guarda la URL base64 en el estado
        mostrarAlerta("✨ Imagen del croquis cargada con éxito.", "success");
      };
      reader.onerror = () => {
        mostrarAlerta("❌ Error al leer la imagen. Inténtalo de nuevo.", "danger");
      };
      reader.readAsDataURL(file); // Convierte la imagen a Base64
    }
  };

  const handleRemoveMapImage = () => {
    setMapImageUrl(null);
    mostrarAlerta("🗑️ Croquis eliminado.", "info");
  };

  return (
    <Offcanvas show={show} onHide={onClose} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Panel de Administración</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {/* Navegación por días */}
        <div className="d-flex justify-content-center mb-3">
          <ButtonGroup>
            {dias.map((dia) => (
              <Button
                key={dia}
                variant={selectedDay === dia ? "primary" : "outline-primary"}
                onClick={() => setSelectedDay(dia)}
              >
                {dia.charAt(0).toUpperCase() + dia.slice(1)}
              </Button>
            ))}
          </ButtonGroup>
        </div>

        <Accordion defaultActiveKey="">
          {/* Sección Cajas */}
          <Accordion.Item eventKey="0">
            <Accordion.Header>Cajas</Accordion.Header>
            <Accordion.Body>
              <Form className="d-flex mb-2" onSubmit={manejarAgregarCaja}>
                <Form.Control
                  type="text"
                  placeholder="Nueva caja"
                  value={nuevaCaja}
                  onChange={(e) => setNuevaCaja(e.target.value)}
                />
                <Button variant="primary ms-2" type="submit">
                  Agregar
                </Button>
              </Form>
              <ListGroup>
                {cajas.map((caja, index) => (
                  <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                    {caja}
                    <Button variant="outline-danger btn-sm" onClick={() => eliminarCaja(caja)}>
                      ✕
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Accordion.Body>
          </Accordion.Item>

          {/* Sección Turnos */}
          <Accordion.Item eventKey="1">
            <Accordion.Header>Horarios - {selectedDay}</Accordion.Header>
            <Accordion.Body>
              <Form className="d-flex mb-3" onSubmit={manejarAgregarHorario}>
                <Form.Control
                  type="text"
                  placeholder="Nuevo horario (ej. 10:00 AM - 11:00 AM)"
                  value={nuevoTurno}
                  onChange={(e) => setNuevoTurno(e.target.value)}
                />
                <Button
                  variant="primary ms-2"
                  type="submit"
                >
                  Agregar
                </Button>
              </Form>

              <ListGroup>
                {(turnosPorDia[selectedDay] || []).map((turno) => (
                  <ListGroup.Item key={turno.id} className="d-flex align-items-center justify-content-between">
                    <Form.Control
                      type="text"
                      value={turno.hora}
                      className="me-2"
                      onChange={(e) => {
                        const nuevaHora = e.target.value.trim();
                        const turnosActuales = turnosPorDia[selectedDay] || [];

                        if (nuevaHora === "") {
                          mostrarAlerta("⚠️ El horario no puede estar vacío.");
                          return;
                        }

                        const yaExiste = turnosActuales.some(
                          (t) => t.id !== turno.id && t.hora.toLowerCase() === nuevaHora.toLowerCase()
                        );

                        if (yaExiste) {
                          mostrarAlerta("🚫 Ese horario ya existe en este día.");
                          return;
                        }

                        const nuevosTurnos = turnosActuales.map((t) =>
                          t.id === turno.id ? { ...t, hora: nuevaHora } : t
                        );

                        setTurnosPorDia({
                          ...turnosPorDia,
                          [selectedDay]: nuevosTurnos,
                        });
                      }}
                    />
                    <Button
                      variant="outline-danger btn-sm ms-2"
                      onClick={() => {
                        const turnosActuales = turnosPorDia[selectedDay];
                        if (turnosActuales.length <= 1) {
                          mostrarAlerta("🚫 No puedes eliminar el único horario.");
                          return;
                        }

                        const actualizados = {
                          ...turnosPorDia,
                          [selectedDay]: turnosActuales.filter((t) => t.id !== turno.id),
                        };

                        setTurnosPorDia(actualizados);
                      }}
                    >
                      ✕
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="2">
            <Accordion.Header>Croquis de Cajas</Accordion.Header>
            <Accordion.Body>
              <Form.Group controlId="formFile" className="mb-3">
                <Form.Label>Subir o cambiar imagen del croquis</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleMapImageUpload}
                />
                <Form.Text className="text-muted">
                  Sube una imagen (PNG, JPG, etc.) para el croquis de las cajas. Max 2MB.
                </Form.Text>
              </Form.Group>
              {mapImageUrl && (
                <div className="d-flex flex-column align-items-center mt-3">
                  <img src={mapImageUrl} alt="Croquis actual" className="img-thumbnail mb-2" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                  <Button variant="outline-danger btn-sm" onClick={handleRemoveMapImage}>
                    Eliminar Croquis Actual
                  </Button>
                </div>
              )}
            </Accordion.Body>
          </Accordion.Item>

          <div className="d-grid gap-2 mt-3">
            <Button
              variant="outline-success"
              onClick={exportarCSV}
            >
              Descargar CSV 📄
            </Button>
            <Button
              variant="outline-info"
              onClick={exportarExcel}
            >
              Descargar Excel 📊
            </Button>
          </div>
        </Accordion>

        {alerta && (
          <div className={`alert alert-${alerta.variante} position-fixed bottom-0 end-0 m-3 shadow`} role="alert" style={{ zIndex: 9999 }}>
            {alerta.mensaje}
          </div>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default AdminPanel;