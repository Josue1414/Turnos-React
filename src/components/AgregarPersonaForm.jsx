import React, { useState, useEffect } from "react";

const AgregarPersonaForm = ({
  cajas,
  turnos,
  onAgregar,
  modoEdicion,
  setModoEdicion,
}) => {
  const [nombre, setNombre] = useState("");
  const [turno, setTurno] = useState(turnos[0]?.id || 1);
  const [caja, setCaja] = useState(cajas[0]);

  useEffect(() => {
    if (modoEdicion) {
      setNombre(modoEdicion.nombre);
      setTurno(parseInt(modoEdicion.turno.replace("T", "")));
      setCaja(modoEdicion.caja);
    }
  }, [modoEdicion]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onAgregar({ nombre: nombre.trim(), turno: `T${turno}`, caja });
    setNombre("");
    setCaja(cajas[0]);
    setModoEdicion(null);
  };

  return (
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
          />
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
  );
};

export default AgregarPersonaForm;
