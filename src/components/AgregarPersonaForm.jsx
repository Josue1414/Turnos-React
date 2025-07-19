import React, { useState, useEffect } from "react";
import { Alert } from "react-bootstrap";

const AgregarPersonaForm = ({
  cajas,
  turnos,
  onAgregar,
  modoEdicion,
  setModoEdicion,
  personas,
  setPersonas,
}) => {
  const [nombre, setNombre] = useState("");
  const [turno, setTurno] = useState(turnos[0]?.id || 1);
  const [caja, setCaja] = useState(cajas[0]);
  const [alerta, setAlerta] = useState(null);

  useEffect(() => {
    if (modoEdicion) {
      setNombre(modoEdicion.nombre);
      setTurno(parseInt(modoEdicion.turno.replace("T", "")));
      setCaja(modoEdicion.caja);
    }
  }, [modoEdicion]);

  const mostrarAlerta = (mensaje, tipo = "warning") => {
    setAlerta({ mensaje, tipo });
    setTimeout(() => setAlerta(null), 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nombreTrim = nombre.trim();
    if (!nombreTrim) return;

    // Validar duplicado en lista de personas
    const yaExistePersona = personas.some(
      (p) => p.toLowerCase() === nombreTrim.toLowerCase()
    );

    if (!yaExistePersona) {
      setPersonas([...personas, nombreTrim]);
    }

    // Validación adicional: evitar duplicados en turnos (esto ya lo haces en onAgregar)
    const resultado = onAgregar({ nombre: nombreTrim, turno: `T${turno}`, caja });

    if (resultado?.error) {
      mostrarAlerta(resultado.error); // Permite mostrar errores del onAgregar si se devuelven
      return;
    }

    // Limpiar solo si fue exitoso
    setNombre("");
    setCaja(cajas[0]);
    setModoEdicion(null);
  };

  return (
    <>
      {alerta && (
        <Alert variant={alerta.tipo} className="position-fixed top-0 start-50 translate-middle-x mt-3 z-3">
          {alerta.mensaje}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row g-2">
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              list="sugerencias-personas"
            />
            <datalist id="sugerencias-personas">
              {personas.map((p, i) => (
                <option key={i} value={p} />
              ))}
            </datalist>
          </div>

          <div className="col-md-3">
            <select
              className="form-select"
              value={turno}
              onChange={(e) => setTurno(parseInt(e.target.value))}
            >
              {turnos.map((t) => (
                <option key={t.id} value={t.id}>
                  {`T${t.id} - ${t.hora}`}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <select
              className="form-select"
              value={caja}
              onChange={(e) => setCaja(e.target.value)}
            >
              {cajas.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-2">
            <button className="btn btn-success w-100" type="submit">
              {modoEdicion ? "Actualizar" : "Agregar"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default AgregarPersonaForm;
