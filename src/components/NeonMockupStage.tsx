import React, { useEffect, useMemo, useRef, useState } from "react";

type NeonMockupStageProps = {
  lengthCm: number;       // reale längste Seite in cm
  waterproof: boolean;    // Outdoor (erzwingt outdoor_30% + Rain)
  neonOn: boolean;        // NEON-Glow an/aus (von deinem UI)
  uvOn: boolean;          // UV-Druck an/aus (von deinem UI)
  bgBrightness?: number;  // 0.30–1.60 (optional extern gesteuert)
  neonIntensity?: number; // 0.40–2.00 (optional extern gesteuert)
  selectedBackground?: string; // Manuell gewählter Hintergrund
  onBackgroundChange?: (background: string) => void; // Callback für Hintergrundwechsel
};

// Reale Wandbreiten für jede Szene in cm
const SCENE_REAL_WIDTHS_CM: Record<string, number> = {
  "ab_20cm_50%": 300,    // 3 Meter Wandbreite
  "ab_100cm_50%": 500,   // 5 Meter Wandbreite  
  "ab_200cm_50%": 700,   // 7 Meter Wandbreite
  "outdoor_30%": 2000,   // 20 Meter Außenbereich
};

// Verfügbare Hintergründe mit Labels
const AVAILABLE_BACKGROUNDS = [
  { key: "ab_20cm_50%", label: "Klein (3m)", description: "Kleiner Raum" },
  { key: "ab_100cm_50%", label: "Mittel (5m)", description: "Mittlerer Raum" },
  { key: "ab_200cm_50%", label: "Groß (7m)", description: "Großer Raum" },
  { key: "outdoor_30%", label: "Outdoor (20m)", description: "Außenbereich" },
];

// Referenz-Viewport-Breite für Skalierung (Pixel)
const VIEWPORT_WIDTH_FOR_SCALING_PX = 400;

const INDOOR_BASE = 0.50;     // „50% kleiner"
const OUTDOOR_BASE = 0.30;    // „70% kleiner"
const GLOW_RADII_BASE = [1.9, 3.8, 6.6, 9.8];
const GLOW_ALPHA_BASE = [0.54, 0.40, 0.26, 0.15];

// % im Dateinamen müssen in der URL als %25 stehen
const encPct = (s:string) => s.replace(/%/g, '%25');

function pickSet(cm:number, outdoor:boolean){
  if(outdoor) return "outdoor_30%";
  if(cm < 100) return "ab_20cm_50%";
  if(cm < 200) return "ab_100cm_50%";
  return "ab_200cm_50%";
}
function parseColor(col?:string){
  if(!col || col==="none") return {r:255,g:255,b:255,a:1};
  col = String(col).trim();
  if(/^#([0-9a-f]{3})$/i.test(col)){const h=col.slice(1);return{r:parseInt(h[0]+h[0],16),g:parseInt(h[1]+h[1],16),b:parseInt(h[2]+h[2],16),a:1}}
  if(/^#([0-9a-f]{6})$/i.test(col)){const h=col.slice(1);return{r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16),a:1}}
  const m = col.match(/^rgba?\(([^)]+)\)$/i);
  if(m){const p=m[1].split(",").map(s=>s.trim()); const [r,g,b]=p.slice(0,3).map(x=>x.endsWith("%")?2.55*parseFloat(x):parseFloat(x)); const a=p[3]!=null?parseFloat(p[3]):1; return {r,g,b,a:isNaN(a)?1:a}}
  const tmp=document.createElement("span"); tmp.style.color=col; document.body.appendChild(tmp);
  const cs=getComputedStyle(tmp).color; document.body.removeChild(tmp);
  return parseColor(cs||"#fff");
}
function mixWithWhite(color:string, whiteRatio=0.80){
  const c=parseColor(color); const r=Math.max(0,Math.min(1,whiteRatio));
  return `rgba(${Math.round(255*r + c.r*(1-r))},${Math.round(255*r + c.g*(1-r))},${Math.round(255*r + c.b*(1-r))},1)`;
}
function getStroke(el:Element){
  const a = (el as HTMLElement).getAttribute("stroke");
  if(a && a!=="none") return a;
  return (getComputedStyle(el as any).stroke || "#fff");
}
function getSW(el:Element){
  const a = (el as HTMLElement).getAttribute("stroke-width");
  if(a!=null && !isNaN(parseFloat(a))) return parseFloat(a);
  const s = getComputedStyle(el as any).strokeWidth;
  const n = parseFloat(s);
  return isNaN(n)?10:n;
}
function ensureViewBox(svg:SVGSVGElement){
  if(svg.hasAttribute("viewBox")) return;
  const w = parseFloat(svg.getAttribute("width")||"0") || 1000;
  const h = parseFloat(svg.getAttribute("height")||"0") || 1000;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
}
function sanitize(svg:SVGSVGElement){
  svg.querySelectorAll("script, link[rel=stylesheet]").forEach(n=>n.remove());
}

const NeonMockupStage: React.FC<NeonMockupStageProps> = ({
  lengthCm, waterproof, neonOn, uvOn,
  bgBrightness, neonIntensity,
  selectedBackground, onBackgroundChange
}) => {
  const planeRef = useRef<HTMLDivElement>(null);
  const svgRef   = useRef<SVGSVGElement|null>(null);

  // State für manuell gewählten Hintergrund
  const [currentBackground, setCurrentBackground] = useState(selectedBackground || "ab_100cm_50%");

  // Fallback-States (falls Props nicht gesetzt sind)
  const [localBg, setLocalBg]       = useState(bgBrightness ?? 1.0);
  const [localNeon, setLocalNeon]   = useState(neonIntensity ?? 1.40);
  const [localNeonOn, setLocalNeonOn] = useState(neonOn);
  useEffect(()=>{ setLocalNeonOn(neonOn); }, [neonOn]);

  const [drag, setDrag] = useState({dx:0, dy:0});

  // Verwende manuell gewählten Hintergrund statt automatischer Auswahl
  const setName = currentBackground;
  const baseScale = setName==="outdoor_30%" ? OUTDOOR_BASE : INDOOR_BASE;
  
  // Dynamische Pixel-pro-Zentimeter Berechnung basierend auf realer Szenenbreite
  const dynamicPxPerCm = useMemo(() => {
    const realSceneWidthCm = SCENE_REAL_WIDTHS_CM[setName] || 300;
    // Berechne Pixel pro cm: Viewport-Breite / reale Szenenbreite * baseScale * Vergrößerungsfaktor
    const enlargementFactor = 15.0; // Stark erhöhter Vergrößerungsfaktor
    const pxPerCm = (VIEWPORT_WIDTH_FOR_SCALING_PX / realSceneWidthCm) * baseScale * enlargementFactor;
    console.log(`📏 Dynamische Skalierung für ${setName}:`, {
      realSceneWidthCm,
      viewportWidth: VIEWPORT_WIDTH_FOR_SCALING_PX,
      baseScale,
      enlargementFactor,
      calculatedPxPerCm: pxPerCm
    });
    return pxPerCm;
  }, [setName, baseScale]);

  // Hintergrund wechseln
  const handleBackgroundChange = (newBackground: string) => {
    setCurrentBackground(newBackground);
    onBackgroundChange?.(newBackground);
    // Reset drag position when changing background
    setDrag({dx: 0, dy: 0});
  };

  const S: Record<string, React.CSSProperties> = {
    scene:{position:"relative", inset:0, width:"100%", height:"100%", background:"#000", overflow:"hidden", borderRadius:12},
    layer:{position:"absolute", inset:0, backgroundPosition:"center", backgroundSize:"cover", backgroundRepeat:"no-repeat", pointerEvents:"none"},
    rain:{position:"absolute", inset:0, pointerEvents:"none", opacity:0.15, zIndex:4, overflow:"hidden"},
    planeWrap:{position:"absolute", inset:0, zIndex:2, pointerEvents:"none"},
    plane:{
      position:"absolute", left:"50%", top:"50%",
      transform:`translate(-50%,-50%) translate(${drag.dx.toFixed(2)}px, ${drag.dy.toFixed(2)}px) scale(1)`,
      width:"600px", height:"600px", display:"grid", placeItems:"center",
      filter:"drop-shadow(0 6px 14px rgba(0,0,0,.35))", cursor:"grab", pointerEvents:"auto", userSelect:"none", touchAction:"none"
    },
    gear:{position:"absolute", top:10, right:10, zIndex:7, background:"rgba(12,16,22,.55)", border:"1px solid #2a3342", backdropFilter:"blur(4px)", borderRadius:10, color:"#e8eef8"},
    gearBtn:{display:"inline-flex", alignItems:"center", gap:6, padding:"6px 8px", cursor:"pointer"},
    gearPanel:{padding:"10px 12px", display:"grid", gap:8, minWidth:220}
  };

  const baseUrl  = `/assets/${encPct(setName)}.png`;
  const mobelUrl = `/assets/${encPct(setName)}_mobel.png`;

  // Acrylic
  function firstShapeWithin(root:Element|null){ if(!root) return null; return root.querySelector("path, polygon, rect, ellipse, circle") as any; }
  function qRole(root:Element, id:string, data:string){ return (root.querySelector(`#${id}, [data-role="${data}"]`) as SVGGElement|null); }
  function addAcrylicOverlays(svg:SVGSVGElement, acrylicGroup:SVGGElement){
    try{
      const defs = svg.querySelector("defs") || svg.insertBefore(document.createElementNS(svg.namespaceURI,"defs"), svg.firstChild);
      const shape = firstShapeWithin(acrylicGroup); if(!shape) return;
      const cpId = `cp-${Math.random().toString(36).slice(2,7)}`;
      const clip = document.createElementNS(svg.namespaceURI,"clipPath");
      clip.setAttribute("id", cpId);
      clip.setAttribute("clipPathUnits","userSpaceOnUse");
      clip.appendChild(shape.cloneNode(true));
      defs.appendChild(clip);

      const bb = (acrylicGroup as any).getBBox();
      const x=bb.x, y=bb.y, w=bb.width, h=bb.height;

      const g = document.createElementNS(svg.namespaceURI,"g");
      g.setAttribute("clip-path", `url(#${cpId})`);
      g.setAttribute("pointer-events","none");
      (g.style as any).mixBlendMode = "screen";

      const base = document.createElementNS(svg.namespaceURI,"rect");
      base.setAttribute("x",`${x}`); base.setAttribute("y",`${y}`);
      base.setAttribute("width",`${w}`); base.setAttribute("height",`${h}`);
      base.setAttribute("fill","rgba(255,255,255,0.08)");
      g.appendChild(base);

      const right = document.createElementNS(svg.namespaceURI,"rect");
      right.setAttribute("x",`${x + w*0.80}`); right.setAttribute("y",`${y - h*0.30}`);
      right.setAttribute("width",`${w*0.40}`); right.setAttribute("height",`${h*1.60}`);
      right.setAttribute("fill","rgba(255,255,255,0.12)");
      right.setAttribute("transform",`rotate(-30 ${x + w*0.90} ${y + h/2})`);
      g.appendChild(right);

      const left = document.createElementNS(svg.namespaceURI,"rect");
      left.setAttribute("x",`${x - w*0.05}`); left.setAttribute("y",`${y - h*0.30}`);
      left.setAttribute("width",`${w*0.14}`); left.setAttribute("height",`${h*1.60}`);
      left.setAttribute("fill","rgba(255,255,255,0.08)");
      left.setAttribute("transform",`rotate(-30 ${x + w*0.10} ${y + h/2})`);
      g.appendChild(left);

      acrylicGroup.after(g);
    }catch(e){ console.error(e); }
  }
  function processAcrylic(svg:SVGSVGElement){
    const g = qRole(svg,"acrylic","acrylic");
    if(!g) return;
    g.querySelectorAll("path, polygon, rect, ellipse, circle").forEach((el:any)=>{
      el.removeAttribute("fill"); el.removeAttribute("fill-opacity");
      el.style.fill="none"; el.setAttribute("fill","none");
      el.setAttribute("stroke","rgba(255,255,255,0.30)");
      el.setAttribute("stroke-width","1.6");
      el.setAttribute("stroke-linecap","round");
      el.setAttribute("stroke-linejoin","round");
    });
    addAcrylicOverlays(svg, g);
  }

  // Neon
  function isNeonCandidate(el:Element){
    const tag=el.tagName.toLowerCase();
    if(!["path","polyline","line","circle","ellipse"].includes(tag)) return false;
    const fill=((el as any).getAttribute("fill")||"").trim().toLowerCase();
    if(fill && fill!=="none" && fill!=="transparent") return false;
    return getSW(el) > 0 && !!getStroke(el);
  }
  function applyNeonGlow(el:HTMLElement, colStr:string, enabled:boolean, intensity:number){
    const w = getSW(el);
    const c = parseColor(colStr);
    if(enabled){
      const coreAlpha = Math.min(0.70, 0.24*intensity);
      const core = `drop-shadow(0 0 ${(w*0.7).toFixed(1)}px rgba(255,255,255,${coreAlpha}))`;
      const layers = GLOW_RADII_BASE.map((k,i)=>{
        const a = Math.min(0.95, GLOW_ALPHA_BASE[i]*intensity);
        return `drop-shadow(0 0 ${(w*k).toFixed(1)}px rgba(${c.r},${c.g},${c.b},${a}))`;
      }).join(" ");
      (el.style as any).filter = `${core} ${layers}`;
    } else (el.style as any).filter = "none";
  }
  function processNeon(svg:SVGSVGElement, enabled:boolean, intensity:number){
    const root = (svg.querySelector("#neon, [data-role='neon']") as SVGGElement) || svg;
    const cand = Array.from(root.querySelectorAll("path, polyline, line, circle, ellipse")).filter(isNeonCandidate) as HTMLElement[];
    cand.forEach(el=>{
      const orig = getStroke(el);
      const tube = mixWithWhite(orig,0.80);
      const col = parseColor(orig);
      el.classList.add("neon-line");
      el.setAttribute("data-neoncolor", `rgb(${Math.round(col.r)},${Math.round(col.g)},${Math.round(col.b)})`);
      el.setAttribute("fill","none"); (el.style as any).fill="none";
      el.setAttribute("stroke", tube);
      el.setAttribute("stroke-linecap","round"); el.setAttribute("stroke-linejoin","round");
      applyNeonGlow(el, el.getAttribute("data-neoncolor")||"#fff", enabled, intensity);
    });
  }
  function toggleNeon(svg:SVGSVGElement|null, enabled:boolean, intensity:number){
    if(!svg) return;
    svg.querySelectorAll(".neon-line").forEach((el:any)=>{
      const col = el.getAttribute("data-neoncolor") || "#fff";
      applyNeonGlow(el, col, enabled, intensity);
    });
  }
  function processUV(svg:SVGSVGElement, show:boolean){
    const uv = (svg.querySelector("#uv_print, [data-role='uv-print']") as SVGGElement);
    if(uv) uv.style.display = show ? "" : "none";
  }

  // Größen nach cm
  function setPlaneSizeByCm(cm:number){
    if(!svgRef.current || !planeRef.current) return;
    const vb = svgRef.current.getAttribute("viewBox")!.split(/\s+/).map(Number);
    const asp = (vb[2]>0 && vb[3]>0) ? (vb[2]/vb[3]) : 1;
    const pxLong = cm * dynamicPxPerCm;
    let w:number,h:number;
    if(asp>=1){ w = pxLong; h = w/asp; } else { h = pxLong; w = h*asp; }
    console.log(`📐 SVG Größe gesetzt:`, {
      lengthCm: cm,
      dynamicPxPerCm,
      calculatedPxLong: pxLong,
      finalWidth: w,
      finalHeight: h,
      aspectRatio: asp
    });
    planeRef.current.style.width  = `${w.toFixed(2)}px`;
    planeRef.current.style.height = `${h.toFixed(2)}px`;
  }

  // Drag ohne Boden-Grenze (nur Randclamp)
  function clampToScene(nextDX:number, nextDY:number){
    const s = 1; // Feste Skalierung, da dynamicPxPerCm bereits die Größe steuert
    const sceneRect = (planeRef.current!.parentElement as HTMLElement).getBoundingClientRect();
    const pw = parseFloat(planeRef.current!.style.width)  || planeRef.current!.clientWidth;
    const ph = parseFloat(planeRef.current!.style.height) || planeRef.current!.clientHeight;
    const w = pw*s, h = ph*s;
    const cx = sceneRect.width/2, cy = sceneRect.height/2;
    const left = cx-w/2, right = cx+w/2, top = cy-h/2, bottom = cy+h/2;

    let L = left + nextDX, R = right + nextDX, T = top + nextDY, B = bottom + nextDY;
    if(L<0) nextDX += -L;
    if(R>sceneRect.width) nextDX -= (R - sceneRect.width);
    if(T<0) nextDY += -T;
    if(B>sceneRect.height) nextDY -= (B - sceneRect.height);
    return {dx: nextDX, dy: nextDY};
  }

  const dd = useRef({dragging:false, startX:0, startY:0, baseDX:0, baseDY:0, neonWasOn:false});

  function onPointerDown(e:React.PointerEvent){
    dd.current.dragging = true;
    dd.current.startX = e.clientX; dd.current.startY = e.clientY;
    dd.current.baseDX = drag.dx;   dd.current.baseDY = drag.dy;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dd.current.neonWasOn = localNeonOn;
    if(localNeonOn) toggleNeon(svgRef.current, false, neonIntensity ?? localNeon); // Auto-Off
  }
  function onPointerMove(e:React.PointerEvent){
    if(!dd.current.dragging) return;
    const tryDX = dd.current.baseDX + (e.clientX - dd.current.startX);
    const tryDY = dd.current.baseDY + (e.clientY - dd.current.startY);
    const cl = clampToScene(tryDX, tryDY);
    setDrag({dx:cl.dx, dy:cl.dy});
  }
  function onPointerUp(e:React.PointerEvent){
    if(!dd.current.dragging) return;
    dd.current.dragging=false;
    try{ (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); }catch{}
    if(dd.current.neonWasOn) setTimeout(()=>toggleNeon(svgRef.current, true, neonIntensity ?? localNeon), 40); // Auto-On
  }

  // SVG-Loader im Overlay
  async function handlePickSvg(){
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = ".svg,image/svg+xml";
    inp.onchange = async () => {
      const f = inp.files?.[0]; if(!f) return;
      const txt = await f.text();
      const doc = new DOMParser().parseFromString(txt, "image/svg+xml");
      const svg = doc.querySelector("svg") as SVGSVGElement | null;
      if(!svg) { alert("SVG nicht gefunden."); return; }
      sanitize(svg); ensureViewBox(svg);
      svg.setAttribute("width","100%"); svg.setAttribute("height","100%");
      svg.setAttribute("preserveAspectRatio","xMidYMid meet");
      planeRef.current!.innerHTML = ""; planeRef.current!.appendChild(svg);
      svgRef.current = svg;

      processAcrylic(svg);
      processUV(svg, uvOn);
      processNeon(svg, localNeonOn, neonIntensity ?? localNeon);
      setPlaneSizeByCm(lengthCm);
    };
    inp.click();
  }

  useEffect(()=>{ if(svgRef.current) setPlaneSizeByCm(lengthCm); }, [lengthCm]);
  useEffect(()=>{ if(svgRef.current) setPlaneSizeByCm(lengthCm); }, [dynamicPxPerCm]); // Re-scale when scene changes
  useEffect(()=>{ if(svgRef.current) processUV(svgRef.current, uvOn); }, [uvOn]);
  useEffect(()=>{ toggleNeon(svgRef.current, localNeonOn, neonIntensity ?? localNeon); }, [localNeonOn, neonIntensity, localNeon, setName]);
  useEffect(()=>{ // Drag → Transform anpassen
    planeRef.current && (planeRef.current.style.transform =
      `translate(-50%,-50%) translate(${drag.dx.toFixed(2)}px, ${drag.dy.toFixed(2)}px) scale(1)`);
  }, [drag.dx, drag.dy]);

  const [open, setOpen] = useState(false);

  return (
    <div style={S.scene}>
      {/* Base */}
      <div style={{
        ...S.layer, zIndex:0,
        filter:`brightness(${(bgBrightness ?? localBg)})`,
        backgroundImage:`url(${baseUrl})`
      }}/>
      {/* Möbel (oberhalb SVG) */}
      <div style={{
        ...S.layer, zIndex:3,
        backgroundImage:`url(${mobelUrl})`
      }}/>
      {/* Rain (12%) */}
      {(setName==="outdoor_30%" && waterproof) && (
        <div style={S.rain}>
          {/* CSS Rain Effect */}
          {Array.from({ length: 120 }).map((_, i) => (
            <div
              key={i}
              className="raindrop"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${0.3 + Math.random() * 0.8}s`
              }}
            />
          ))}
        </div>
      )}

      {/* SVG-Plane */}
      <div style={S.planeWrap}>
        <div
          data-mockup-stage
          ref={planeRef}
          style={S.plane}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>

      {/* Overlay (transparent, kompakt) */}
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={()=>setOpen(v=>!v)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 border backdrop-blur-sm ${
            open 
              ? 'bg-blue-600 text-white border-blue-500 shadow-lg' 
              : 'bg-white/90 text-gray-700 border-gray-200 hover:bg-white hover:shadow-md'
          }`}
        >
          <div className={`w-4 h-4 rounded-full transition-colors ${
            open ? 'bg-white/20' : 'bg-gray-400'
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span>Optionen</span>
        </button>
        
        {open && (
          <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[220px] backdrop-blur-sm">
            <div className="space-y-3">
              <button 
                onClick={()=> setDrag({dx:0,dy:0})} 
                className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
              >
                Zentrieren
              </button>
              <button 
                onClick={handlePickSvg} 
                className="w-full px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm font-medium transition-colors"
              >
                SVG laden…
              </button>

            {bgBrightness===undefined && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">BG-Helligkeit</label>
                <input 
                  type="range" 
                  min={0.30} 
                  max={1.60} 
                  step={0.01}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  defaultValue={localBg}
                  onChange={(e)=> setLocalBg(parseFloat(e.currentTarget.value))}
                />
              </div>
            )}
            {neonIntensity===undefined && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Neon-Intensität</label>
                <input 
                  type="range" 
                  min={0.40} 
                  max={2.00} 
                  step={0.01}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  defaultValue={localNeon}
                  onChange={(e)=>{ const v=parseFloat(e.currentTarget.value); setLocalNeon(v); toggleNeon(svgRef.current, localNeonOn, v); }}
                />
              </div>
            )}
            {/* Neon An/Aus – sofort nutzbar */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Neon an</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localNeonOn}
                  onChange={(e)=>{ const v=e.currentTarget.checked; setLocalNeonOn(v); toggleNeon(svgRef.current, v, neonIntensity ?? localNeon); }}
                  className="sr-only"
                />
                <div className={`relative w-11 h-6 rounded-full transition-colors ${
                  localNeonOn ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform ${
                    localNeonOn ? 'transform translate-x-5' : ''
                  }`}></div>
                </div>
              </label>
            </div>

            {/* Hintergrund-Auswahl */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Hintergrund</label>
              <div className="grid grid-cols-2 gap-1">
                {AVAILABLE_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.key}
                    onClick={() => handleBackgroundChange(bg.key)}
                    className={`px-2 py-1.5 text-xs rounded-md font-medium transition-colors ${
                      currentBackground === bg.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    title={bg.description}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NeonMockupStage;