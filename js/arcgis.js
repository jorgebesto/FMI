/* Consultas a servicios ArcGIS REST desde el navegador.
   Primero intenta fetch normal; si el servidor no permite consultas desde otra página (CORS), usa JSONP,
   que los servidores ArcGIS aceptan con el parámetro 'callback'. */
(function (g) {
  const IP = (g.IP = g.IP || {});
  let contador = 0;

  function jsonp(url, ms) {
    return new Promise((resolve, reject) => {
      if (typeof document === "undefined") return reject(new Error("JSONP no disponible"));
      const nombre = "__ip_cb" + Date.now() + "_" + contador++;
      const s = document.createElement("script");
      const limpiar = () => { delete g[nombre]; s.remove(); clearTimeout(t); };
      const t = setTimeout(() => { limpiar(); reject(new Error("tiempo agotado")); }, ms);
      g[nombre] = (js) => { limpiar(); resolve(js); };
      s.onerror = () => { limpiar(); reject(new Error("no se pudo conectar")); };
      s.src = url + (url.includes("?") ? "&" : "?") + "callback=" + nombre;
      document.head.appendChild(s);
    });
  }

  class ErrorServicio extends Error {}

  function revisar(js) {
    if (js && js.error) throw new ErrorServicio(js.error.message || JSON.stringify(js.error));
    return js;
  }

  IP.arcgis = {
    ErrorServicio,
    async get(url, params = {}, ms = 25000) {
      const qs = new URLSearchParams({ ...params, f: "json" }).toString();
      const completa = url + (url.includes("?") ? "&" : "?") + qs;
      try {
        const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
        const t = ctrl ? setTimeout(() => ctrl.abort(), ms) : null;
        const r = await fetch(completa, ctrl ? { signal: ctrl.signal } : {});
        if (t) clearTimeout(t);
        if (!r.ok) throw new Error("HTTP " + r.status);
        return revisar(await r.json());
      } catch (e) {
        if (e instanceof ErrorServicio) throw e;
        return revisar(await jsonp(completa, ms));
      }
    },
    query(urlCapa, params, ms) {
      return IP.arcgis.get(urlCapa.replace(/\/$/, "") + "/query",
        { outFields: "*", returnGeometry: "false", ...params }, ms);
    },
    sql: (v) => "'" + String(v).replace(/'/g, "''") + "'",
    centroide(geom) {
      if (!geom) return [null, null];
      if ("x" in geom && "y" in geom) return [geom.y, geom.x];
      const pts = (geom.rings || [])[0];
      if (!pts || !pts.length) return [null, null];
      return [pts.reduce((s, p) => s + p[1], 0) / pts.length, pts.reduce((s, p) => s + p[0], 0) / pts.length];
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
