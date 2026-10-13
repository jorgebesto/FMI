/* Catastro en línea (plataforma usada por Ibagué y otros gestores).
   Sus búsquedas son métodos ASP.NET por POST (sig.aspx/BuscaMatricula, sig.aspx/GetAlfaNumPredio2) que solo
   responden a su propia página: Ibagué publica por http y su https tiene un certificado inválido, así que el
   navegador no deja que esta página los llame. Por eso se usa un marcador del navegador:
   1) esta página arma un "pedido" (código DANE y matrículas);
   2) en el sitio de Catastro en línea el marcador hace las mismas búsquedas que el botón del sitio;
   3) el marcador abre esta página con el resultado en la dirección (#cel=...), que se lee y se guarda en el navegador. */
(function (g) {
  const IP = (g.IP = g.IP || {});
  const U = IP.util;

  // Sitios conocidos de la plataforma y el municipio que atienden
  const SITIOS = { "ibaguemultiproposito.com.co": "73001" };

  // Código que corre dentro del sitio de Catastro en línea. Debe ser autónomo (no ve nada de esta página).
  function codigoMarcador(destino) {
    return `(async function(){
var DEST=${JSON.stringify(destino)},SITIOS=${JSON.stringify(SITIOS)};
if(!/sig\\.aspx/i.test(location.pathname)){alert("Abra primero la búsqueda predial de Catastro en línea (la página sig.aspx) y vuelva a hacer clic en el marcador.");return;}
var txt=prompt("Pegue el pedido que copió en el Investigador de predios.\\nEjemplo:  73001 350-12345 350-1234");
if(!txt)return;
var host=location.hostname.replace(/^www\\./,""),pedidos=[];
txt.split(/\\n+/).forEach(function(linea){
 var t=linea.split(/[\\s,;]+/).filter(Boolean),dane=SITIOS[host]||"";
 if(t.length&&/^\\d{5}$/.test(t[0]))dane=t.shift();
 t.forEach(function(m){var x=m.match(/^([0-9A-Za-z]{1,4})-0*(\\d+)$/);if(x)pedidos.push({dane:dane,orip:x[1],num:x[2]});});
});
if(!pedidos.length){alert("No encontré matrículas en el pedido. Deben ir con su círculo, por ejemplo 350-12345.");return;}
var sin=pedidos.filter(function(p){return !p.dane;});
if(sin.length){var d=prompt("Código DANE del municipio (5 dígitos, por ejemplo 73001 para Ibagué):");if(!/^\\d{5}$/.test(d||""))return;sin.forEach(function(p){p.dane=d;});}
var base=location.origin+location.pathname.replace(/(sig\\.aspx).*$/i,"$1");
async function post(metodo,cuerpo){
 var r=await fetch(base+"/"+metodo,{method:"POST",headers:{"content-type":"application/json; charset=UTF-8"},body:JSON.stringify(cuerpo),credentials:"include"});
 if(!r.ok)throw new Error(metodo+": el servidor respondió "+r.status);
 return (await r.json()).d;
}
var resultados=[];
for(var i=0;i<pedidos.length;i++){
 var p=pedidos[i],it={matricula:p.orip+"-"+p.num,dane:p.dane,sitio:base,fecha:new Date().toISOString()};
 try{
  it.busca=await post("BuscaMatricula",{CodDpto:p.dane.slice(0,2),CodMpio:p.dane.slice(2),CodigoORIP:p.orip,Matricula:p.num});
  var npns=[];String(it.busca||"").replace(/<NPN>([^<]+)<\\/NPN>/g,function(_,n){npns.push(n);});
  it.predios=[];
  for(var j=0;j<npns.length&&j<20;j++)it.predios.push({npn:npns[j],alfa:await post("GetAlfaNumPredio2",{Predio:npns[j]})});
 }catch(e){it.error=String(e&&e.message||e);}
 resultados.push(it);
}
var url=DEST+"#cel="+encodeURIComponent(JSON.stringify({tipo:"catastroenlinea",v:1,resultados:resultados}));
var w=window.open(url,"investigador_predios");
if(!w)location.href=url;
})();`;
  }

  const etiqueta = (xml, tag) => U.limpiar((String(xml).match(new RegExp(`<${tag}>([^<]*)</${tag}>`, "i")) || [])[1]);
  const numero = (v) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? "" : Number(v));
  const sinCero = (v) => { const s = U.limpiar(v); return /^0*$/.test(s) ? "" : s; };

  function leerAlfa(alfa) {
    if (!alfa) return {};
    if (typeof alfa === "object") return alfa;
    try { return JSON.parse(alfa); } catch (e) { return {}; }
  }

  // Datos de un predio de Catastro en línea con los mismos nombres que usan las demás fuentes
  function datosDe(predio, orip) {
    const a = predio.alfa || {};
    const npn = U.soloDigitos(predio.npn);
    const mat = predio.matricula || (a.Matricula ? `${U.limpiar(a.CodigoORIP) || orip || ""}-${U.limpiar(a.Matricula)}` : "");
    const props = (a.Propietario || []).map((p) => {
      const nombre = U.limpiar(p.RazonSocial) || [p.Nombre1, p.Nombre2, p.Apellido1, p.Apellido2].map(U.limpiar).filter(Boolean).join(" ");
      const doc = [U.limpiar(p.TipoDoc), U.limpiar(p.NumDoc)].filter(Boolean).join(" ");
      const porc = Number(p.Porc);
      return `${nombre}${doc ? ` (${doc})` : ""}${Number.isFinite(porc) && porc > 0 && porc < 1 ? ` ${U.formatoNumero(porc * 100, 2)} %` : ""}`;
    }).filter(Boolean);
    const cons = (a.Construccion || []).map((c) => [
      U.limpiar(c.NUnidad) && `Unidad ${U.limpiar(c.NUnidad)}`, U.limpiar(c.Uso).replace(".", ": ").replace(/_/g, " "),
      numero(c.Area) !== "" && `${U.formatoNumero(c.Area)} m²`, c.NPisos && `${c.NPisos} piso(s)`, c.AnoConstruccion && `año ${c.AnoConstruccion}`,
    ].filter(Boolean).join(" · "));
    const unicos = (xs) => [...new Set(xs.map(U.limpiar).filter(Boolean))].join(", ");
    return {
      numero_predial: npn.length === 30 ? npn : U.limpiar(predio.npn),
      matricula_inmobiliaria: mat ? U.normalizarMatricula(mat) : "",
      zona: U.limpiar(predio.zona).replace(/^(\w)(\w*)$/, (_, x, y) => x + y.toLowerCase()),
      destino_economico: U.limpiar(a.Destino),
      direccion: (a.Direccion || []).map((d) => U.limpiar(d.Direccion_Unida)).filter(Boolean).join(" | "),
      area_terreno_m2: numero(a.AreaT),
      area_construida_m2: numero(a.AreaC),
      avaluo: numero(a.Avaluo),
      avaluo_terreno: numero(a.ValorTerreno),
      avaluo_construccion: numero(a.ValorConstruccion),
      estrato: sinCero(a.Estrato),
      comuna: sinCero(a.Comuna),
      nupre: U.limpiar(a.NUPRE),
      codigo_homologado: U.limpiar(a.Codigo_Homologado),
      tipo_catastro: U.limpiar(a.TipoCatastro),
      coeficiente: Number(a.Coopropiedad) > 0 ? a.Coopropiedad : "",
      es_matriz: a.EsMatriz ? "Sí" : "",
      zona_fisica: unicos((a.Zona || []).map((z) => String(z.ZF ?? ""))),
      zona_economica: unicos((a.Zona || []).map((z) => String(z.ZE ?? ""))),
      construcciones: cons.join(" | "),
      propietarios_catastro: props.join("; "),
    };
  }

  // Convierte lo que trae el marcador en registros por matrícula
  function registros(paquete) {
    if (typeof paquete === "string") paquete = JSON.parse(paquete);
    if (!paquete || paquete.tipo !== "catastroenlinea" || !Array.isArray(paquete.resultados)) throw new Error("No es un resultado de Catastro en línea");
    return paquete.resultados.map((r) => {
      const matricula = U.normalizarMatricula(r.matricula);
      const orip = U.circuloDeMatricula(matricula);
      const xml = String(r.busca || "");
      const enBusca = [...xml.matchAll(/<Predio>([\s\S]*?)<\/Predio>/gi)].map((m) => ({
        npn: etiqueta(m[1], "NPN"), matricula: etiqueta(m[1], "Matricula"), zona: etiqueta(m[1], "Zona"),
      }));
      const predios = (r.predios || []).map((p) => {
        const b = enBusca.find((x) => x.npn === p.npn) || {};
        const pr = { npn: U.limpiar(p.npn), matricula: b.matricula || "", zona: b.zona || "", alfa: leerAlfa(p.alfa) };
        pr.datos = datosDe(pr, orip);
        return pr;
      });
      return { matricula, dane: U.limpiar(r.dane), sitio: U.limpiar(r.sitio), fecha: U.limpiar(r.fecha), error: U.limpiar(r.error), predios };
    }).filter((r) => r.matricula);
  }

  // Pedido para el marcador: una línea por municipio con el código DANE y sus matrículas
  function pedido(items) {
    const grupos = new Map();
    for (const { dane, matricula } of items) {
      if (!matricula) continue;
      const k = dane || "";
      if (!grupos.has(k)) grupos.set(k, []);
      if (!grupos.get(k).includes(matricula)) grupos.get(k).push(matricula);
    }
    return [...grupos].map(([d, ms]) => [d, ...ms].filter(Boolean).join(" ")).join("\n");
  }

  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return U.limpiar(u); } };

  IP.cel = {
    SITIOS, codigoMarcador, registros, pedido, datosDe, host,
    marcador: (destino) => "javascript:" + encodeURIComponent(codigoMarcador(destino)),
    // Lee el resultado si viene en la dirección de la página (#cel=...)
    desdeHash(hash) {
      const m = String(hash || "").match(/^#cel=([\s\S]*)$/);
      if (!m) return null;
      return registros(decodeURIComponent(m[1]));
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
