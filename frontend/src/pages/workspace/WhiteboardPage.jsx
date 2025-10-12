import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useParams } from "react-router-dom";
import {
  RoomProvider,
  ClientSideSuspense,
  useMyPresence,
  useOthers,
  useStorage,
  useMutation,
} from "@liveblocks/react";
import { LiveObject, LiveMap } from "@liveblocks/client";

// Constants
const COLORS = [
  "#DC2626",
  "#D97706",
  "#059669",
  "#7C3AED",
  "#DB2777",
  "#06b6d4",
  "#3b82f6",
];
const GRID_SIZE = 40;
const MIN_SIZE = 50;
const ARROW_SIZE = 15;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

const SHAPE_CONFIGS = {
  rectangle: (x, y, c) => ({
    type: "rectangle",
    x,
    y,
    width: 150,
    height: 100,
    fill: c,
  }),
  circle: (x, y, c) => ({ type: "circle", x, y, radius: 60, fill: c }),
  diamond: (x, y, c) => ({
    type: "diamond",
    x,
    y,
    width: 100,
    height: 70,
    fill: c,
  }),
  ellipse: (x, y, c) => ({ type: "ellipse", x, y, rx: 80, ry: 50, fill: c }),
  arrow: (x, y, c) => ({ type: "arrow", x, y, x2: x + 150, y2: y, fill: c }),
  line: (x, y, c) => ({ type: "line", x, y, x2: x + 150, y2: y, fill: c }),
  textBox: (x, y) => ({
    type: "textBox",
    x,
    y,
    width: 200,
    height: 80,
    fill: "#1e293b",
    text: "",
    textColor: "#fff",
  }),
};

const TOOLS = [
  { id: "rectangle", icon: "rect", title: "Rectangle (R)" },
  { id: "circle", icon: "circle", title: "Circle (C)" },
  { id: "diamond", icon: "diamond", title: "Diamond (D)" },
  { id: "ellipse", icon: "ellipse", title: "Ellipse (E)" },
  { id: "arrow", icon: "arrow", title: "Arrow (A)" },
  { id: "line", icon: "line", title: "Line (L)" },
  { id: "textBox", icon: "text", title: "Text (T)" },
];

const getUserColor = (id) => COLORS[id % COLORS.length];

// Cursor Component
const Cursor = React.memo(({ x, y, color, name }) => (
  <g transform={`translate(${x}, ${y})`}>
    <path
      d="M0 0 L0 20 L5 15 L8 22 L11 21 L8 14 L14 14 Z"
      fill={color}
      stroke="white"
      strokeWidth="1"
    />
    <text
      x="18"
      y="10"
      fill={color}
      fontSize="12"
      fontWeight="bold"
      style={{ userSelect: "none" }}
    >
      {name}
    </text>
  </g>
));

// Custom Hook for Simple Drag (no x2/y2)
const useDrag = (id, shape, onStart, zoom) => {
  const updatePos = useMutation(
    ({ storage }, x, y) => {
      const s = storage.get("shapes").get(id);
      if (s) {
        s.set("x", x);
        s.set("y", y);
      }
    },
    [id]
  );

  return useCallback(
    (e) => {
      e.stopPropagation();
      onStart?.();
      const target = e.currentTarget;
      const svg = target.closest("svg");
      const rect = svg.getBoundingClientRect();
      const startOffsetX = (e.clientX - rect.left) / zoom - shape.x;
      const startOffsetY = (e.clientY - rect.top) / zoom - shape.y;

      const move = (me) => {
        const nx = (me.clientX - rect.left) / zoom - startOffsetX;
        const ny = (me.clientY - rect.top) / zoom - startOffsetY;
        updatePos(nx, ny);
      };
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    },
    [shape.x, shape.y, updatePos, onStart, zoom]
  );
};

// Rectangle with resize
const Rectangle = ({ id, shape, sel, onStart, zoom }) => {
  const drag = useDrag(id, shape, onStart, zoom);
  const resize = useMutation(
    ({ storage }, w, h) => {
      const s = storage.get("shapes").get(id);
      if (s) {
        s.set("width", w);
        s.set("height", h);
      }
    },
    [id]
  );

  const handleResize = useCallback(
    (e) => {
      e.stopPropagation();
      const svg = e.currentTarget.closest("svg");
      const rect = svg.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const sw = shape.width;
      const sh = shape.height;

      const move = (me) => {
        const dx = (me.clientX - startX) / zoom;
        const dy = (me.clientY - startY) / zoom;
        resize(Math.max(MIN_SIZE, sw + dx), Math.max(MIN_SIZE, sh + dy));
      };
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    },
    [shape.width, shape.height, resize, zoom]
  );

  return (
    <g>
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        stroke={sel ? "#06b6d4" : "transparent"}
        strokeWidth={sel ? 3 : 0}
        onPointerDown={drag}
        style={{ cursor: "move" }}
        rx="2"
      />
      {sel && (
        <circle
          cx={shape.x + shape.width}
          cy={shape.y + shape.height}
          r="6"
          fill="#06b6d4"
          stroke="white"
          strokeWidth="2"
          onPointerDown={handleResize}
          style={{ cursor: "nwse-resize" }}
        />
      )}
    </g>
  );
};

// Circle with radius resize
const Circle = ({ id, shape, sel, onStart, zoom }) => {
  const drag = useDrag(id, shape, onStart, zoom);
  const resize = useMutation(
    ({ storage }, r) => {
      const s = storage.get("shapes").get(id);
      if (s) s.set("radius", r);
    },
    [id]
  );

  const handleResize = useCallback(
    (e) => {
      e.stopPropagation();
      const startX = e.clientX;
      const sr = shape.radius;

      const move = (me) => {
        const dx = (me.clientX - startX) / zoom;
        resize(Math.max(20, sr + dx));
      };
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    },
    [shape.radius, resize, zoom]
  );

  return (
    <g>
      <circle
        cx={shape.x}
        cy={shape.y}
        r={shape.radius}
        fill={shape.fill}
        stroke={sel ? "#06b6d4" : "transparent"}
        strokeWidth={sel ? 3 : 0}
        onPointerDown={drag}
        style={{ cursor: "move" }}
      />
      {sel && (
        <circle
          cx={shape.x + shape.radius}
          cy={shape.y}
          r="6"
          fill="#06b6d4"
          stroke="white"
          strokeWidth="2"
          onPointerDown={handleResize}
          style={{ cursor: "ew-resize" }}
        />
      )}
    </g>
  );
};

// Diamond
const Diamond = ({ id, shape, sel, onStart, zoom }) => {
  const drag = useDrag(id, shape, onStart, zoom);
  const w = shape.width || 80;
  const h = shape.height || 80;
  const pts = `${shape.x},${shape.y - h / 2} ${shape.x + w / 2},${shape.y} ${
    shape.x
  },${shape.y + h / 2} ${shape.x - w / 2},${shape.y}`;
  return (
    <polygon
      points={pts}
      fill={shape.fill}
      stroke={sel ? "#06b6d4" : "transparent"}
      strokeWidth={sel ? 3 : 0}
      onPointerDown={drag}
      style={{ cursor: "move" }}
    />
  );
};

// Ellipse
const Ellipse = ({ id, shape, sel, onStart, zoom }) => {
  const drag = useDrag(id, shape, onStart, zoom);
  return (
    <ellipse
      cx={shape.x}
      cy={shape.y}
      rx={shape.rx || 80}
      ry={shape.ry || 50}
      fill={shape.fill}
      stroke={sel ? "#06b6d4" : "transparent"}
      strokeWidth={sel ? 3 : 0}
      onPointerDown={drag}
      style={{ cursor: "move" }}
    />
  );
};

// Arrow/Line with endpoint dragging - Fixed to read current values from storage
const ArrowLine = ({ id, shape, sel, onStart, zoom, isArrow }) => {
  const updatePos = useMutation(
    ({ storage }, x, y) => {
      const s = storage.get("shapes").get(id);
      if (s) {
        const currentX = s.get("x");
        const currentY = s.get("y");
        const currentX2 = s.get("x2");
        const currentY2 = s.get("y2");
        const dx = x - currentX;
        const dy = y - currentY;
        s.set("x", x);
        s.set("y", y);
        s.set("x2", currentX2 + dx);
        s.set("y2", currentY2 + dy);
      }
    },
    [id]
  );

  const updateEnd = useMutation(
    ({ storage }, x2, y2) => {
      const s = storage.get("shapes").get(id);
      if (s) {
        s.set("x2", x2);
        s.set("y2", y2);
      }
    },
    [id]
  );

  const drag = useCallback(
    (e) => {
      e.stopPropagation();
      onStart?.();
      const svg = e.currentTarget.closest("svg");
      const rect = svg.getBoundingClientRect();
      const startOffsetX = (e.clientX - rect.left) / zoom - shape.x;
      const startOffsetY = (e.clientY - rect.top) / zoom - shape.y;

      const move = (me) => {
        const nx = (me.clientX - rect.left) / zoom - startOffsetX;
        const ny = (me.clientY - rect.top) / zoom - startOffsetY;
        updatePos(nx, ny);
      };
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    },
    [shape.x, shape.y, updatePos, onStart, zoom]
  );

  const dragEnd = useCallback(
    (e) => {
      e.stopPropagation();
      const svg = e.currentTarget.closest("svg");
      const rect = svg.getBoundingClientRect();

      const move = (me) => {
        const nx = (me.clientX - rect.left) / zoom;
        const ny = (me.clientY - rect.top) / zoom;
        updateEnd(nx, ny);
      };
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    },
    [updateEnd, zoom]
  );

  const x2 = shape.x2 ?? shape.x + 150;
  const y2 = shape.y2 ?? shape.y;

  if (isArrow) {
    const angle = Math.atan2(y2 - shape.y, x2 - shape.x);
    const p1x = x2 - ARROW_SIZE * Math.cos(angle - Math.PI / 6);
    const p1y = y2 - ARROW_SIZE * Math.sin(angle - Math.PI / 6);
    const p2x = x2 - ARROW_SIZE * Math.cos(angle + Math.PI / 6);
    const p2y = y2 - ARROW_SIZE * Math.sin(angle + Math.PI / 6);

    return (
      <g>
        <line
          x1={shape.x}
          y1={shape.y}
          x2={x2}
          y2={y2}
          stroke={shape.fill}
          strokeWidth={sel ? 3 : 2}
          onPointerDown={drag}
          style={{ cursor: "move" }}
        />
        <polygon
          points={`${x2},${y2} ${p1x},${p1y} ${p2x},${p2y}`}
          fill={shape.fill}
          onPointerDown={drag}
          style={{ cursor: "move" }}
        />
        {sel && (
          <>
            <circle
              cx={shape.x}
              cy={shape.y}
              r="5"
              fill="#06b6d4"
              stroke="white"
              strokeWidth="2"
            />
            <circle
              cx={x2}
              cy={y2}
              r="5"
              fill="#06b6d4"
              stroke="white"
              strokeWidth="2"
              onPointerDown={dragEnd}
              style={{ cursor: "grab" }}
            />
          </>
        )}
      </g>
    );
  }

  return (
    <g>
      <line
        x1={shape.x}
        y1={shape.y}
        x2={x2}
        y2={y2}
        stroke={shape.fill}
        strokeWidth={sel ? 3 : 2}
        onPointerDown={drag}
        style={{ cursor: "move" }}
      />
      {sel && (
        <>
          <circle
            cx={shape.x}
            cy={shape.y}
            r="5"
            fill="#06b6d4"
            stroke="white"
            strokeWidth="2"
          />
          <circle
            cx={x2}
            cy={y2}
            r="5"
            fill="#06b6d4"
            stroke="white"
            strokeWidth="2"
            onPointerDown={dragEnd}
            style={{ cursor: "grab" }}
          />
        </>
      )}
    </g>
  );
};

// TextBox
const TextBox = ({ id, shape, sel, onStart, zoom }) => {
  const drag = useDrag(id, shape, onStart, zoom);
  const updateText = useMutation(
    ({ storage }, txt) => {
      const s = storage.get("shapes").get(id);
      if (s) s.set("text", txt);
    },
    [id]
  );

  return (
    <g onPointerDown={drag}>
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        stroke={sel ? "#06b6d4" : "rgba(255,255,255,0.2)"}
        strokeWidth={sel ? 3 : 1}
        rx="4"
        style={{ cursor: "move" }}
      />
      <foreignObject
        x={shape.x + 4}
        y={shape.y + 4}
        width={shape.width - 8}
        height={shape.height - 8}
      >
        <div style={{ width: "100%", height: "100%" }}>
          {sel ? (
            <textarea
              autoFocus
              value={shape.text || ""}
              onChange={(e) => updateText(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                height: "100%",
                padding: "4px",
                backgroundColor: shape.fill,
                color: shape.textColor || "#fff",
                border: "none",
                fontSize: "14px",
                resize: "none",
                outline: "none",
              }}
            />
          ) : (
            <div
              style={{
                padding: "4px",
                color: shape.textColor || "#fff",
                fontSize: "14px",
                wordWrap: "break-word",
                overflow: "hidden",
              }}
            >
              {shape.text || "Click to edit"}
            </div>
          )}
        </div>
      </foreignObject>
    </g>
  );
};

const ShapeMap = {
  rectangle: Rectangle,
  circle: Circle,
  diamond: Diamond,
  ellipse: Ellipse,
  arrow: (props) => <ArrowLine {...props} isArrow />,
  line: (props) => <ArrowLine {...props} isArrow={false} />,
  textBox: TextBox,
};

// Icon Component
const Icon = ({ icon }) => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    {icon === "rect" && (
      <rect x="3" y="5" width="18" height="14" strokeWidth={2} />
    )}
    {icon === "circle" && <circle cx="12" cy="12" r="9" strokeWidth={2} />}
    {icon === "diamond" && (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 2l8 10l-8 10l-8-10l8-10z"
      />
    )}
    {icon === "ellipse" && (
      <ellipse cx="12" cy="12" rx="9" ry="6" strokeWidth={2} />
    )}
    {icon === "arrow" && (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l9 9m0 0l9-9m-9 9V3"
      />
    )}
    {icon === "line" && <line x1="3" y1="12" x2="21" y2="12" strokeWidth={2} />}
    {icon === "text" && (
      <text
        x="12"
        y="15"
        textAnchor="middle"
        fontSize="16"
        strokeWidth={0}
        fill="currentColor"
        fontWeight="bold"
      >
        T
      </text>
    )}
  </svg>
);

// Main Canvas
function Canvas() {
  const [presence, updatePresence] = useMyPresence();
  const others = useOthers();
  const [sel, setSel] = useState(null);
  const [tool, setTool] = useState("select");
  const [zoom, setZoom] = useState(1);
  const [color, setColor] = useState(COLORS[0]);
  const [showHelp, setShowHelp] = useState(false);
  const shapes = useStorage((root) => root.shapes);
  const svgRef = useRef(null);

  const insert = useMutation(({ storage }, type, x, y, c) => {
    const cfg = SHAPE_CONFIGS[type](x, y, type === "textBox" ? null : c);
    const id = Date.now().toString();
    storage.get("shapes").set(id, new LiveObject(cfg));
    return id;
  }, []);

  const deleteShape = useMutation(({ storage }, id) => {
    storage.get("shapes").delete(id);
  }, []);

  const clear = useMutation(({ storage }) => {
    const s = storage.get("shapes");
    Array.from(s.keys()).forEach((id) => s.delete(id));
  }, []);

  const duplicate = useMutation(({ storage }, id) => {
    const s = storage.get("shapes").get(id);
    if (!s) return null;
    const newId = Date.now().toString();
    const cfg = { ...s.toObject(), x: s.get("x") + 20, y: s.get("y") + 20 };
    storage.get("shapes").set(newId, new LiveObject(cfg));
    return newId;
  }, []);

  const handleMove = useCallback(
    (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      updatePresence({ cursor: { x, y } });
    },
    [updatePresence, zoom]
  );

  const handleClick = useCallback(
    (e) => {
      if (tool === "select") return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      const id = insert(tool, x, y, color);
      setSel(id);
      setTool("select");
    },
    [tool, insert, zoom, color]
  );

  const handleKey = useCallback(
    (e) => {
      if (e.key === "Delete" && sel) {
        deleteShape(sel);
        setSel(null);
      }
      if (e.key === "Escape") {
        setSel(null);
        setTool("select");
      }
      if (e.ctrlKey && e.key === "d" && sel) {
        e.preventDefault();
        const newId = duplicate(sel);
        if (newId) setSel(newId);
      }
      const toolKey = {
        r: "rectangle",
        c: "circle",
        d: "diamond",
        e: "ellipse",
        a: "arrow",
        l: "line",
        t: "textBox",
      }[e.key.toLowerCase()];
      if (toolKey) setTool(toolKey);
      if (e.key === "v" || e.key === "V") setTool("select");
    },
    [sel, deleteShape, duplicate]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const handleWheel = useCallback((e) => {
    // require Ctrl (Windows) or Meta (Mac) for zoom (or pinch gestures that set ctrl/meta)
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();

    const svg = svgRef.current;
    const rect = svg?.getBoundingClientRect();

    // keep zoom focus at pointer by adjusting transform-origin to pointer pixel coords
    if (svg && rect) {
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      svg.style.transformOrigin = `${px}px ${py}px`;
    }

    // normalize delta across devices (pixels / lines / pages)
    const DOM_DELTA_PIXEL = 0;
    const DOM_DELTA_LINE = 1;
    const DOM_DELTA_PAGE = 2;
    let normDelta = e.deltaY;
    if (e.deltaMode === DOM_DELTA_LINE) normDelta = e.deltaY * 16;
    if (e.deltaMode === DOM_DELTA_PAGE)
      normDelta = e.deltaY * window.innerHeight;

    // multiplicative scale step (smooth, device independent)
    const SCALE_SENSITIVITY = 0.0015;
    const scaleFactor = Math.exp(-normDelta * SCALE_SENSITIVITY);

    setZoom((z) => {
      const next = Math.min(Math.max(ZOOM_MIN, z * scaleFactor), ZOOM_MAX);
      return next;
    });
  }, []);

  const exportImg = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true);
    clone.setAttribute("width", svg.clientWidth);
    clone.setAttribute("height", svg.clientHeight);
    const data = new XMLSerializer().serializeToString(clone);
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(data)}`;
    const canvas = document.createElement("canvas");
    canvas.width = svg.clientWidth;
    canvas.height = svg.clientHeight;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `whiteboard-${Date.now()}.png`;
      a.click();
    };
    img.src = url;
  }, []);

  const shapeArr = useMemo(() => {
    if (!shapes) return [];
    // If shapes exposes keys() and get() (LiveMap)
    if (typeof shapes.keys === "function" && typeof shapes.get === "function") {
      return Array.from(shapes.keys()).map((id) => [id, shapes.get(id)]);
    }
    // If shapes exposes entries() (Map-like)
    if (typeof shapes.entries === "function") {
      return Array.from(shapes.entries());
    }
    // Fallback for plain objects
    return Object.entries(shapes);
  }, [shapes]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Toolbar */}
      <div className="bg-slate-800/95 backdrop-blur border-b border-slate-700 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setTool("select")}
              className={`p-2 rounded transition ${
                tool === "select"
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
              title="Select (V)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
            </button>
            <div className="w-px h-6 bg-slate-600" />
            {TOOLS.map(({ id, icon, title }) => (
              <button
                key={id}
                onClick={() => setTool(id)}
                className={`p-2 rounded transition ${
                  tool === id
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
                title={title}
              >
                <Icon icon={icon} />
              </button>
            ))}
            <div className="w-px h-6 bg-slate-600" />
            <div className="flex gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded border-2 ${
                    color === c ? "border-white" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  title="Color"
                />
              ))}
            </div>
            <div className="w-px h-6 bg-slate-600" />
            <button
              onClick={() => {
                if (confirm("Clear all shapes?")) {
                  clear();
                  setSel(null);
                }
              }}
              className="p-2 rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
              title="Clear All"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <button
              onClick={exportImg}
              className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 flex items-center gap-1 text-sm font-medium"
              title="Export"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
              title="Help"
            >
              Instructions
            </button>
            <div className="flex -space-x-2">
              <div
                className="w-8 h-8 rounded-full border-2 border-slate-800 flex items-center justify-center text-white text-xs font-semibold"
                style={{ backgroundColor: "#06b6d4" }}
              >
                You
              </div>
              {others.map(({ connectionId }) => (
                <div
                  key={connectionId}
                  className="w-8 h-8 rounded-full border-2 border-slate-800"
                  style={{ backgroundColor: getUserColor(connectionId) }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{ cursor: tool === "select" ? "default" : "crosshair" }}
        onWheel={handleWheel}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          onPointerMove={handleMove}
          onPointerLeave={() => {
            updatePresence({ cursor: null });
            // reset transform origin back to top-left when pointer leaves (optional)
            if (svgRef.current) svgRef.current.style.transformOrigin = "0 0";
          }}
          onClick={handleClick}
          onWheel={handleWheel}
          style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}
        >
          <defs>
            <pattern
              id="grid"
              width={GRID_SIZE}
              height={GRID_SIZE}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
                fill="none"
                stroke="rgba(148,163,184,0.1)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {shapeArr.map(([id, shape]) => {
            const Comp = ShapeMap[shape.type];
            return Comp ? (
              <Comp
                key={id}
                id={id}
                shape={shape}
                sel={id === sel}
                onStart={() => setSel(id)}
                zoom={zoom}
              />
            ) : null;
          })}
          {others.map(({ connectionId, presence }) =>
            presence?.cursor ? (
              <Cursor
                key={connectionId}
                {...presence.cursor}
                color={getUserColor(connectionId)}
                name={`User ${connectionId}`}
              />
            ) : null
          )}
        </svg>

        {/* Help Panel */}
        {showHelp && (
          <div className="absolute top-4 left-4 bg-slate-800/95 backdrop-blur rounded-lg p-4 text-sm text-slate-300 border border-slate-700 max-w-sm">
            <div className="font-semibold text-cyan-400 mb-2">
              Keyboard Shortcuts:
            </div>
            <ul className="space-y-1 text-xs">
              <li>
                • <kbd className="bg-slate-700 px-1 rounded">V</kbd> Select tool
              </li>
              <li>
                • <kbd className="bg-slate-700 px-1 rounded">R/C/D/E/A/L/T</kbd>{" "}
                Shape tools
              </li>
              <li>
                • <kbd className="bg-slate-700 px-1 rounded">Delete</kbd> Remove
                selected
              </li>
              <li>
                • <kbd className="bg-slate-700 px-1 rounded">Ctrl+D</kbd>{" "}
                Duplicate
              </li>
              <li>
                • <kbd className="bg-slate-700 px-1 rounded">Esc</kbd> Deselect
              </li>
              <li>
                • <kbd className="bg-slate-700 px-1 rounded">Ctrl+Scroll</kbd>{" "}
                Zoom
              </li>
            </ul>
          </div>
        )}

        {/* Stats */}
        <div className="absolute bottom-4 right-4 bg-slate-800/95 backdrop-blur rounded-lg p-3 text-sm text-slate-300 border border-slate-700">
          <div className="text-xs space-y-1">
            <div>
              Shapes:{" "}
              <span className="text-cyan-400 font-semibold">
                {shapeArr.length}
              </span>
            </div>
            <div>
              Users:{" "}
              <span className="text-cyan-400 font-semibold">
                {others.length + 1}
              </span>
            </div>
            <div>
              Zoom:{" "}
              <span className="text-cyan-400 font-semibold">
                {Math.round(zoom * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Page
export default function WhiteboardPage() {
  const { workspaceSlug } = useParams();

  return (
    <RoomProvider
      id={`whiteboard:${workspaceSlug || "default"}`}
      initialPresence={{ cursor: null }}
      // shapes must be a LiveMap so we can call .keys(), .get(), .set()
      initialStorage={{ shapes: new LiveMap() }}
    >
      <ClientSideSuspense
        fallback={
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-300 text-lg">Loading whiteboard...</p>
            </div>
          </div>
        }
      >
        <Canvas />
      </ClientSideSuspense>
    </RoomProvider>
  );
}
