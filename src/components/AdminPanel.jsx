import React, { useState } from "react";
import { Offcanvas, Button, Form, Accordion, ListGroup } from "react-bootstrap";

const AdminPanel = ({ show, onClose, cajas, setCajas, turnosPorDia, setTurnosPorDia, diaSeleccionado, selectedDay, asignaciones }) => {
  const [nuevaCaja, setNuevaCaja] = useState("");
  const [nuevoTurno, setNuevoTurno] = useState("");

  const agregarCaja = () => {
    if (nuevaCaja.trim() && !cajas.includes(nuevaCaja)) {
      setCajas([...cajas, nuevaCaja.trim()]);
      setNuevaCaja("");
    }
  };

  const eliminarCaja = (nombre) => {
    setCajas(cajas.filter((c) => c !== nombre));
  };

  const agregarTurno = () => {
    if (!nuevoTurno.trim()) return;
    const turnosActuales = turnosPorDia[selectedDay] || [];
    const nuevoId = turnosActuales.length ? Math.max(...turnosActuales.map(t => t.id)) + 1 : 1;
    const nuevoTurnoObj = { id: nuevoId, hora: nuevoTurno.trim() };
    const actualizados = {
      ...turnosPorDia,
      [selectedDay]: [...turnosActuales, nuevoTurnoObj]
    };
    setTurnosPorDia(actualizados);
    setNuevoTurno("");
  };

  const eliminarTurno = (id) => {
    const actualizados = {
      ...turnosPorDia,
      [selectedDay]: turnosPorDia[selectedDay].filter(t => t.id !== id)
    };
    setTurnosPorDia(actualizados);
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

  // Convertir a CSV y agregar BOM para Excel
  const csvContent =
    "\uFEFF" + rows.map((e) => e.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "turnos.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  return (
    <Offcanvas show={show} onHide={onClose} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Panel de Administración</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Accordion defaultActiveKey="">
          {/* Sección Cajas */}
          <Accordion.Item eventKey="0">
            <Accordion.Header>Cajas</Accordion.Header>
            <Accordion.Body>
              <Form className="d-flex mb-2">
                <Form.Control
                  type="text"
                  placeholder="Nueva caja"
                  value={nuevaCaja}
                  onChange={(e) => setNuevaCaja(e.target.value)}
                />
                <Button variant="primary ms-2" onClick={agregarCaja}>Agregar</Button>
              </Form>
              <ListGroup>
                {cajas.map((caja, index) => (
                  <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                    {caja}
                    <Button variant="outline-danger btn-sm" onClick={() => eliminarCaja(caja)}>✕</Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Accordion.Body>
          </Accordion.Item>

          {/* Sección Turnos */}
          <Accordion.Item eventKey="1">
            <Accordion.Header>Horarios - {selectedDay}</Accordion.Header>
            <Accordion.Body>
              <Form className="d-flex mb-2">
                <Form.Control
                  type="text"
                  placeholder="Nuevo horario"
                  value={nuevoTurno}
                  onChange={(e) => setNuevoTurno(e.target.value)}
                />
                <Button variant="primary ms-2" onClick={agregarTurno}>Agregar</Button>
              </Form>
              <ListGroup>
                {(turnosPorDia[selectedDay] || []).map((turno) => (
                  <ListGroup.Item key={turno.id} className="d-flex justify-content-between align-items-center">
                    {`T${turno.id} - ${turno.hora}`}
                    <Button variant="outline-danger btn-sm" onClick={() => eliminarTurno(turno.id)}>✕</Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Accordion.Body>
          </Accordion.Item>
          <Button
            variant="outline-success"
            className="mb-3"
            onClick={() => exportarCSV(turnosPorDia, diaSeleccionado)}
          >
            Descargar CSV del día
          </Button>
        </Accordion>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default AdminPanel;
