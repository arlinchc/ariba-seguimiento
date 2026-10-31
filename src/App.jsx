
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const POR_PAGINA = 20;

export default function App() {
  const [proveedores, setProveedores] = useState([]);
  const [actualizado, setActualizado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("TODOS");
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarProveedores() {
      try {
        const respuesta = await fetch(
          `${import.meta.env.BASE_URL}proveedores.json?t=${Date.now()}`,
          { cache: "no-store" }
        );

        if (!respuesta.ok) {
          throw new Error("No se pudo consultar proveedores.json");
        }

        const datos = await respuesta.json();

        if (activo) {
          setProveedores(datos.proveedores || []);
          setActualizado(datos.actualizado || null);
          setError("");
        }
      } catch (err) {
        if (activo) setError(err.message);
      }
    }

    cargarProveedores();

    // Consulta automática cada 15 segundos.
    const intervalo = setInterval(cargarProveedores, 15000);

    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, []);

  const totales = useMemo(() => {
    const enviados = proveedores.filter(
      (p) => p.status === "ENVIADO A SAP"
    ).length;

    return {
      total: proveedores.length,
      enviados,
      pendientes: proveedores.length - enviados,
    };
  }, [proveedores]);

  const filtrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return proveedores.filter((p) => {
      const coincideBusqueda = [
        p.vendorId,
        p.razonSocial,
        p.rfc,
      ].some((valor) =>
        String(valor || "").toLowerCase().includes(texto)
      );

      const coincideFiltro =
        filtro === "TODOS" || p.status === filtro;

      return coincideBusqueda && coincideFiltro;
    });
  }, [proveedores, busqueda, filtro]);

  const paginas = Math.max(
    1,
    Math.ceil(filtrados.length / POR_PAGINA)
  );

  const paginaActual = Math.min(pagina, paginas);

  const visibles = filtrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA
  );

  function cambiarBusqueda(valor) {
    setBusqueda(valor);
    setPagina(1);
  }

  function cambiarFiltro(valor) {
    setFiltro(valor);
    setPagina(1);
  }

  function formatearFecha(valor) {
    if (!valor) return "—";

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) return "—";

    return fecha.toLocaleString("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  return (
    <main className="contenedor">
      <header className="encabezado">
        <div>
          <div className="institucion">
            NACIONAL MONTE DE PIEDAD
          </div>
          <h1>Seguimiento de proveedores</h1>
          <p>Integración SAP Ariba · Ambiente QA</p>
        </div>

        <span className="etiqueta">SAP ARIBA</span>
      </header>

      <section className="indicadores">
        <article className="indicador">
          <span>Total de proveedores</span>
          <strong>{totales.total}</strong>
        </article>

        <article className="indicador">
          <span>Pendientes</span>
          <strong>{totales.pendientes}</strong>
        </article>

        <article className="indicador">
          <span>Enviados a SAP</span>
          <strong>{totales.enviados}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panel-encabezado">
          <div>
            <h2>Listado de proveedores</h2>
            <p>
              Estado de los cuestionarios enviados a SAP Ariba
            </p>
          </div>

          <small>
            Última actualización: {formatearFecha(actualizado)}
          </small>
        </div>

        <div className="filtros">
          <label>
            Buscar proveedor
            <input
              type="search"
              value={busqueda}
              placeholder="Vendor ID, razón social o RFC"
              onChange={(e) => cambiarBusqueda(e.target.value)}
            />
          </label>

          <label>
            STATUS
            <select
              value={filtro}
              onChange={(e) => cambiarFiltro(e.target.value)}
            >
              <option value="TODOS">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ENVIADO A SAP">Enviado a SAP</option>
            </select>
          </label>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Vendor ID</th>
                <th>Razón social</th>
                <th>RFC</th>
                <th>STATUS</th>
                <th>Fecha de envío</th>
              </tr>
            </thead>

            <tbody>
              {visibles.map((proveedor) => (
                <tr key={proveedor.vendorId}>
                  <td className="vendor">
                    {proveedor.vendorId}
                  </td>
                  <td>{proveedor.razonSocial || "—"}</td>
                  <td>{proveedor.rfc || "—"}</td>
                  <td>
                    <span
                      className={
                        proveedor.status === "ENVIADO A SAP"
                          ? "estado enviado"
                          : "estado pendiente"
                      }
                    >
                      {proveedor.status}
                    </span>
                  </td>
                  <td>
                    {formatearFecha(proveedor.fechaEnvio)}
                  </td>
                </tr>
              ))}

              {visibles.length === 0 && (
                <tr>
                  <td colSpan="5" className="vacio">
                    No se encontraron proveedores.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="paginacion">
          <span>
            Mostrando{" "}
            {filtrados.length === 0
              ? 0
              : (paginaActual - 1) * POR_PAGINA + 1}
            {" a "}
            {Math.min(
              paginaActual * POR_PAGINA,
              filtrados.length
            )}
            {" de "}
            {filtrados.length} proveedores
          </span>

          <div className="controles">
            <button
              disabled={paginaActual === 1}
              onClick={() => setPagina(paginaActual - 1)}
            >
              Anterior
            </button>

            <span>
              Página {paginaActual} de {paginas}
            </span>

            <button
              disabled={paginaActual === paginas}
              onClick={() => setPagina(paginaActual + 1)}
            >
              Siguiente
            </button>
          </div>
        </footer>
      </section>

      <div className="pie">
        Actualización automática cada 15 segundos.
      </div>
    </main>
  );
}
