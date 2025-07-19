import React, { useState } from "react";
import { Offcanvas, Form, ListGroup, Button, Badge } from "react-bootstrap";

const ParticipantesPanel = ({ show, onClose, personas, setPersonas, turnosPorDia, setTurnosPorDia }) => {
  const [busqueda, setBusqueda] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [modoEdicion, setModoEdicion] = useState(null);
  const [nombreEditado, setNombreEditado] = useState("");

  const mostrarAlerta = (mensaje, tipo = "warning") => {
    const alerta = document.createElement("div");
    alerta.className = `alert alert-${tipo} position-fixed top-0 start-50 translate-middle-x mt-3 shadow`;
    alerta.style.zIndex = 9999;
    alerta.innerText = mensaje;
    document.body.appendChild(alerta);
    setTimeout(() => alerta.remove(), 3000);
  };

  const agregarParticipante = () => {
    const nombre = nuevoNombre.trim();
    if (!nombre) return;

    if (personas.includes(nombre)) {
      mostrarAlerta("Este participante ya existe.");
      return;
    }

    setPersonas([...personas, nombre]);
    setNuevoNombre("");
  };

  const editarParticipante = (index) => {
    const nuevo = nombreEditado.trim();
    if (!nuevo) return;

    if (personas.includes(nuevo)) {
      mostrarAlerta("Ya existe un participante con ese nombre.");
      return;
    }

    const actualizada = [...personas];
    const nombreAnterior = actualizada[index];
    actualizada[index] = nuevo;
    setPersonas(actualizada);
    setModoEdicion(null);
    setNombreEditado("");

    // 🔁 ACTUALIZAR también en turnosPorDia
    const copiaTurnos = JSON.parse(JSON.stringify(turnosPorDia));
    for (let dia in copiaTurnos) {
      const turnos = copiaTurnos[dia];
      for (let horario in turnos) {
        for (let caja in turnos[horario]) {
          if (turnos[horario][caja] === nombreAnterior) {
            turnos[horario][caja] = nuevo;
          }
        }
      }
    }
    setTurnosPorDia(copiaTurnos);
  };

  const eliminarParticipante = (index) => {
    const nombre = personas[index];
    if (verificarAsignado(nombre)) {
      if (!window.confirm(`⚠️ "${nombre}" ya está asignado. ¿Eliminar de todos modos?`)) return;
    }

    const actualizada = [...personas];
    actualizada.splice(index, 1);
    setPersonas(actualizada);

    // ❌ ELIMINAR de las asignaciones también
    const copiaTurnos = JSON.parse(JSON.stringify(turnosPorDia));
    for (let dia in copiaTurnos) {
      const turnos = copiaTurnos[dia];
      for (let horario in turnos) {
        for (let caja in turnos[horario]) {
          if (turnos[horario][caja] === nombre) {
            turnos[horario][caja] = "";
          }
        }
      }
    }
    setTurnosPorDia(copiaTurnos);
  };

  const filtrarParticipantes = personas.filter((p) =>
    p.toLowerCase().includes(busqueda.toLowerCase())
  );

  const verificarAsignado = (nombre) => {
    for (let dia in turnosPorDia) {
      const turnos = turnosPorDia[dia];
      for (let horario in turnos) {
        for (let caja in turnos[horario]) {
          if (turnos[horario][caja] === nombre) return true;
        }
      }
    }
    return false;
  };

  return (
    <Offcanvas show={show} onHide={onClose} placement="start">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>👤 Participantes</Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body>
        <Form.Control
          type="text"
          placeholder="Buscar participante..."
          className="mb-2"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <ListGroup className="mb-3">
          {filtrarParticipantes.length > 0 ? (
            filtrarParticipantes.map((p, idx) => {
              const iOriginal = personas.indexOf(p);
              return (
                <ListGroup.Item
                  key={idx}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div className="d-flex align-items-center w-100">
                    {modoEdicion === iOriginal ? (
                      <Form.Control
                        size="sm"
                        value={nombreEditado}
                        onChange={(e) => setNombreEditado(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") editarParticipante(iOriginal);
                          if (e.key === "Escape") setModoEdicion(null);
                        }}
                        autoFocus
                      />
                    ) : (
                      <span className="me-2 flex-grow-1">{p}</span>
                    )}

                    <Badge
                      bg={verificarAsignado(p) ? "success" : "secondary"}
                      className="me-2"
                    >
                      {verificarAsignado(p) ? "Asignado" : "Libre"}
                    </Badge>

                    {modoEdicion === iOriginal ? (
                      <Button
                        variant="primary"
                        size="sm"
                        className="me-1"
                        onClick={() => editarParticipante(iOriginal)}
                      >
                        ✅
                      </Button>
                    ) : (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => {
                          setModoEdicion(iOriginal);
                          setNombreEditado(p);
                        }}
                      >
                        ✏️
                      </Button>
                    )}

                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => eliminarParticipante(iOriginal)}
                    >
                      🗑️
                    </Button>
                  </div>
                </ListGroup.Item>
              );
            })
          ) : (
            <ListGroup.Item className="text-muted">Sin resultados</ListGroup.Item>
          )}
        </ListGroup>

        <Form
          onSubmit={(e) => {
            e.preventDefault();
            agregarParticipante();
          }}
        >
          <div className="input-group">
            <Form.Control
              type="text"
              placeholder="Agregar nuevo participante"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
            />
            <Button variant="success" onClick={agregarParticipante}>
              Agregar
            </Button>
          </div>
        </Form>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default ParticipantesPanel;
