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
  useHistory,
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
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 5;
const ZOOM_SENSITIVITY = 0.0005;

const SHAPE_CONFIGS = {
  rectangle: (x, y, c) => ({
    type: "rectangle",
    x,
    y,
    width: 150,
    height: 100,
    fill: c,
    stroke: "#000000", // 👈 Add stroke color
    strokeWidth: 5, // 👈 Add stroke width
    strokeStyle: "solid", // 👈 Add stroke style ("solid" | "dashed" | "dotted")
    opacity: 1, // 👈 Add opacity
  }),
  circle: (x, y, c) => ({
    type: "circle",
    x,
    y,
    radius: 60,
    fill: c,
    stroke: "#000000", // 👈 Add stroke color
    strokeWidth: 2, // 👈 Add stroke width
    strokeStyle: "solid", // 👈 Add stroke style ("solid" | "dashed" | "dotted")
    opacity: 1, // 👈 Add opacity
  }),
  diamond: (x, y, c) => ({
    type: "diamond",
    x,
    y,
    width: 100,
    height: 70,
    fill: c,
    stroke: "#000000", // 👈 Add stroke color
    strokeWidth: 2, // 👈 Add stroke width
    strokeStyle: "solid", // 👈 Add stroke style ("solid" | "dashed" | "dotted")
    opacity: 1, // 👈 Add opacity
  }),
  ellipse: (x, y, c) => ({
    type: "ellipse",
    x,
    y,
    rx: 80,
    ry: 50,
    fill: c,
    stroke: "#000000",
    strokeWidth: 2, // 👈 Add stroke width
    strokeStyle: "solid", // 👈 Add stroke style ("solid" | "dashed" | "dotted")
    opacity: 1,
  }),
  arrow: (x, y, c) => ({
    type: "arrow",
    x,
    y,
    x2: x + 150,
    y2: y,
    stroke: c,
    strokeWidth: 2, // 👈 Add stroke width
    strokeStyle: "solid", // 👈 Add stroke style ("solid" | "dashed" | "dotted")
    opacity: 1, // 👈 Add opacity
  }),
  line: (x, y, c) => ({
    type: "line",
    x,
    y,
    x2: x + 150,
    y2: y,
    stroke: c,
    strokeWidth: 2, // 👈 Add stroke width
    strokeStyle: "solid", // 👈 Add stroke style ("solid" | "dashed" | "dotted")
    opacity: 1, // 👈 Add opacity
  }),
  textBox: (x, y) => ({
    type: "textBox",
    x,
    y,
    width: 200,
    height: 80,
    fill: "transparent", // Make background transparent
    stroke: "#ffffff",
    strokeWidth: 1,
    text: "",
    textColor: "#ffffff",
    opacity: 1,
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

// Coordinate transformation utilities
const screenToCanvas = (screenX, screenY, camera) => ({
  x: (screenX - camera.x) / camera.zoom,
  y: (screenY - camera.y) / camera.zoom,
});

// Helper to get bounding box of any shape
function getShapeBounds(shape) {
  switch (shape.type) {
    case "rectangle":
      return {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      };
    case "circle":
      return {
        x: shape.x - shape.radius,
        y: shape.y - shape.radius,
        width: shape.radius * 2,
        height: shape.radius * 2,
      };
    case "diamond": {
      const w = shape.width || 80;
      const h = shape.height || 80;
      return { x: shape.x - w / 2, y: shape.y - h / 2, width: w, height: h };
    }
    case "ellipse":
      return {
        x: shape.x - shape.rx,
        y: shape.y - shape.ry,
        width: shape.rx * 2,
        height: shape.ry * 2,
      };
    case "arrow":
    case "line":
      return {
        x: Math.min(shape.x, shape.x2 || shape.x),
        y: Math.min(shape.y, shape.y2 || shape.y),
        width: Math.abs(shape.x - (shape.x2 || shape.x)),
        height: Math.abs(shape.y - (shape.y2 || shape.y)),
      };
    case "textBox":
      return {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      };
    default:
      return { x: shape.x, y: shape.y, width: 0, height: 0 };
  }
}

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

// Custom Hook for Drag (canvas coordinates)
const useDrag = (id, shape, onStart) => {
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
    (e, camera) => {
      e.stopPropagation();
      onStart?.();
      const startCanvasX = shape.x;
      const startCanvasY = shape.y;
      const startScreenX = e.clientX;
      const startScreenY = e.clientY;

      const move = (me) => {
        const dx = (me.clientX - startScreenX) / camera.zoom;
        const dy = (me.clientY - startScreenY) / camera.zoom;
        updatePos(startCanvasX + dx, startCanvasY + dy);
      };
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    },
    [shape.x, shape.y, updatePos, onStart]
  );
};

// Helper function to get stroke dash array based on style
const getStrokeDasharray = (strokeStyle) => {
  switch (strokeStyle) {
    case "dashed":
      return "10, 10";
    case "dotted":
      return "3, 5";
    default:
      return "none";
  }
};

// Rectangle
const Rectangle = ({ id, shape, isSelected, onSelect, camera }) => {
  const drag = useDrag(id, shape, () =>
    onSelect(id, new MouseEvent("pointerdown"))
  );
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
      const startX = e.clientX;
      const startY = e.clientY;
      const sw = shape.width;
      const sh = shape.height;

      const move = (me) => {
        const dx = (me.clientX - startX) / camera.zoom;
        const dy = (me.clientY - startY) / camera.zoom;
        resize(Math.max(MIN_SIZE, sw + dx), Math.max(MIN_SIZE, sh + dy));
      };
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    },
    [shape.width, shape.height, resize, camera.zoom]
  );

  const handlePointerDown = (e) => {
    onSelect(id, e);
    if (e.target === e.currentTarget) {
      drag(e, camera);
    }
  };

  return (
    <g opacity={shape.opacity ?? 1}>
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        stroke={shape.stroke ?? "#000000"}
        strokeWidth={shape.strokeWidth ?? 2}
        strokeDasharray={getStrokeDasharray(shape.strokeStyle)}
        onPointerDown={handlePointerDown}
        style={{ cursor: "move" }}
        rx="2"
      />
      {isSelected && (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill="transparent"
          stroke="#06b6d4"
          strokeWidth={3 / camera.zoom}
          pointerEvents="none"
          rx="2"
        />
      )}
      {isSelected && (
        <circle
          cx={shape.x + shape.width}
          cy={shape.y + shape.height}
          r={6 / camera.zoom}
          fill="#06b6d4"
          stroke="white"
          strokeWidth={2 / camera.zoom}
          onPointerDown={handleResize}
          style={{ cursor: "nwse-resize" }}
        />
      )}
    </g>
  );
};

// Circle
const Circle = ({ id, shape, isSelected, onSelect, camera }) => {
  const drag = useDrag(id, shape, () =>
    onSelect(id, new MouseEvent("pointerdown"))
  );
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
        const dx = (me.clientX - startX) / camera.zoom;
        resize(Math.max(20, sr + dx));
      };
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    },
    [shape.radius, resize, camera.zoom]
  );

  const handlePointerDown = (e) => {
    onSelect(id, e);
    if (e.target === e.currentTarget) {
      drag(e, camera);
    }
  };

  return (
    <g opacity={shape.opacity ?? 1}>
      <circle
        cx={shape.x}
        cy={shape.y}
        r={shape.radius}
        fill={shape.fill}
        stroke={shape.stroke ?? "#000000"}
        strokeWidth={shape.strokeWidth ?? 2}
        strokeDasharray={getStrokeDasharray(shape.strokeStyle)}
        onPointerDown={handlePointerDown}
        style={{ cursor: "move" }}
      />
      {isSelected && (
        <circle
          cx={shape.x}
          cy={shape.y}
          r={shape.radius}
          fill="transparent"
          stroke="#06b6d4"
          strokeWidth={3 / camera.zoom}
          pointerEvents="none"
        />
      )}
      {isSelected && (
        <circle
          cx={shape.x + shape.radius}
          cy={shape.y}
          r={6 / camera.zoom}
          fill="#06b6d4"
          stroke="white"
          strokeWidth={2 / camera.zoom}
          onPointerDown={handleResize}
          style={{ cursor: "ew-resize" }}
        />
      )}
    </g>
  );
};

// Diamond
const Diamond = ({ id, shape, isSelected, onSelect, camera }) => {
  const drag = useDrag(id, shape, () =>
    onSelect(id, new MouseEvent("pointerdown"))
  );
  const w = shape.width || 80;
  const h = shape.height || 80;
  const pts = `${shape.x},${shape.y - h / 2} ${shape.x + w / 2},${shape.y} ${
    shape.x
  },${shape.y + h / 2} ${shape.x - w / 2},${shape.y}`;

  const handlePointerDown = (e) => {
    onSelect(id, e);
    drag(e, camera);
  };

  return (
    <g opacity={shape.opacity ?? 1}>
      <polygon
        points={pts}
        fill={shape.fill}
        stroke={shape.stroke ?? "#000000"}
        strokeWidth={shape.strokeWidth ?? 2}
        strokeDasharray={getStrokeDasharray(shape.strokeStyle)}
        onPointerDown={handlePointerDown}
        style={{ cursor: "move" }}
      />
      {isSelected && (
        <polygon
          points={pts}
          fill="transparent"
          stroke="#06b6d4"
          strokeWidth={3 / camera.zoom}
          pointerEvents="none"
        />
      )}
    </g>
  );
};

// Ellipse
const Ellipse = ({ id, shape, isSelected, onSelect, camera }) => {
  const drag = useDrag(id, shape, () =>
    onSelect(id, new MouseEvent("pointerdown"))
  );

  const handlePointerDown = (e) => {
    onSelect(id, e);
    drag(e, camera);
  };

  return (
    <g opacity={shape.opacity ?? 1}>
      <ellipse
        cx={shape.x}
        cy={shape.y}
        rx={shape.rx || 80}
        ry={shape.ry || 50}
        fill={shape.fill}
        stroke={shape.stroke ?? "#000000"}
        strokeWidth={shape.strokeWidth ?? 2}
        strokeDasharray={getStrokeDasharray(shape.strokeStyle)}
        onPointerDown={handlePointerDown}
        style={{ cursor: "move" }}
      />
      {isSelected && (
        <ellipse
          cx={shape.x}
          cy={shape.y}
          rx={shape.rx || 80}
          ry={shape.ry || 50}
          fill="transparent"
          stroke="#06b6d4"
          strokeWidth={3 / camera.zoom}
          pointerEvents="none"
        />
      )}
    </g>
  );
};

// ArrowLine
const ArrowLine = ({ id, shape, isSelected, onSelect, camera, isArrow }) => {
  const updatePos = useMutation(
    ({ storage }, x, y) => {
      const s = storage.get("shapes").get(id);
      if (s) {
        const dx = x - s.get("x");
        const dy = y - s.get("y");
        s.set("x", x);
        s.set("y", y);
        s.set("x2", s.get("x2") + dx);
        s.set("y2", s.get("y2") + dy);
      }
    },
    [id]
  );

  const updateEnd = useMutation(
    ({ storage }, x2, y2) => {
      storage.get("shapes").get(id)?.set("y2", y2).set("x2", x2);
    },
    [id]
  );

  const drag = useCallback(
    (e) => {
      e.stopPropagation();
      onSelect(id, e);
      const startCanvasX = shape.x;
      const startCanvasY = shape.y;
      const startScreenX = e.clientX;
      const startScreenY = e.clientY;

      const move = (me) => {
        const dx = (me.clientX - startScreenX) / camera.zoom;
        const dy = (me.clientY - startScreenY) / camera.zoom;
        updatePos(startCanvasX + dx, startCanvasY + dy);
      };
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    },
    [shape.x, shape.y, updatePos, onSelect, camera.zoom, id]
  );

  const dragEnd = useCallback(
    (e) => {
      e.stopPropagation();
      const svg = e.currentTarget.closest("svg");
      const rect = svg.getBoundingClientRect();

      const move = (me) => {
        const screenX = me.clientX - rect.left;
        const screenY = me.clientY - rect.top;
        const canvas = screenToCanvas(screenX, screenY, camera);
        updateEnd(canvas.x, canvas.y);
      };
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    },
    [updateEnd, camera]
  );

  const x2 = shape.x2 ?? shape.x + 150;
  const y2 = shape.y2 ?? shape.y;
  const strokeColor = shape.stroke ?? shape.fill;

  const arrowHead = useMemo(() => {
    if (!isArrow) return null;
    const angle = Math.atan2(y2 - shape.y, x2 - shape.x);
    const p1x = x2 - ARROW_SIZE * Math.cos(angle - Math.PI / 6);
    const p1y = y2 - ARROW_SIZE * Math.sin(angle - Math.PI / 6);
    const p2x = x2 - ARROW_SIZE * Math.cos(angle + Math.PI / 6);
    const p2y = y2 - ARROW_SIZE * Math.sin(angle + Math.PI / 6);
    return `${x2},${y2} ${p1x},${p1y} ${p2x},${p2y}`;
  }, [shape.x, shape.y, x2, y2, isArrow]);

  return (
    <g opacity={shape.opacity ?? 1}>
      <line
        x1={shape.x}
        y1={shape.y}
        x2={x2}
        y2={y2}
        stroke={strokeColor}
        strokeWidth={shape.strokeWidth ?? 2}
        strokeDasharray={getStrokeDasharray(shape.strokeStyle)}
        onPointerDown={drag}
        style={{ cursor: "move" }}
      />
      {isArrow && (
        <polygon
          points={arrowHead}
          fill={strokeColor}
          onPointerDown={drag}
          style={{ cursor: "move" }}
        />
      )}
      {isSelected && (
        <>
          <line
            x1={shape.x}
            y1={shape.y}
            x2={x2}
            y2={y2}
            stroke="#06b6d4"
            strokeWidth={5 / camera.zoom}
            strokeDasharray="3, 6"
            pointerEvents="none"
          />
          <circle
            cx={shape.x}
            cy={shape.y}
            r={6 / camera.zoom}
            fill="#06b6d4"
            stroke="white"
            strokeWidth={2 / camera.zoom}
            style={{ cursor: "move" }}
            onPointerDown={drag}
          />
          <circle
            cx={x2}
            cy={y2}
            r={6 / camera.zoom}
            fill="#06b6d4"
            stroke="white"
            strokeWidth={2 / camera.zoom}
            onPointerDown={dragEnd}
            style={{ cursor: "grab" }}
          />
        </>
      )}
    </g>
  );
};

// TextBox
const TextBox = ({ id, shape, isSelected, onSelect, camera }) => {
  const drag = useDrag(id, shape, () =>
    onSelect(id, new MouseEvent("pointerdown"))
  );
  const updateText = useMutation(
    ({ storage }, txt) => {
      storage.get("shapes").get(id)?.set("text", txt);
    },
    [id]
  );

  const handlePointerDown = (e) => {
    onSelect(id, e);
    if (!e.target.closest("textarea")) {
      drag(e, camera);
    }
  };

  return (
    <g onPointerDown={handlePointerDown} opacity={shape.opacity ?? 1}>
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill={shape.fill ?? "transparent"}
        stroke={shape.stroke ?? "#ffffff"}
        strokeWidth={shape.strokeWidth ?? 1}
        strokeDasharray={getStrokeDasharray(shape.strokeStyle)}
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
          {isSelected ? (
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
                backgroundColor: "transparent",
                color: shape.textColor || "#fff",
                border: "none",
                fontSize: `${14}px`, // Font size no longer scales with zoom
                lineHeight: 1.2,
                resize: "none",
                outline: "none",
              }}
            />
          ) : (
            <div
              style={{
                padding: "4px",
                color: shape.textColor || "#fff",
                fontSize: `${14}px`, // Font size no longer scales with zoom
                lineHeight: 1.2,
                wordWrap: "break-word",
                overflow: "hidden",
                whiteSpace: "pre-wrap",
              }}
            >
              {shape.text || "Click to edit"}
            </div>
          )}
        </div>
      </foreignObject>
      {isSelected && (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill="transparent"
          stroke="#06b6d4"
          strokeWidth={3 / camera.zoom}
          pointerEvents="none"
          rx="4"
        />
      )}
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

// Add this new component to your file
const StylingPanel = ({ selectedIds, shapes, updateShapeStyle }) => {
  if (selectedIds.size === 0) return null;

  // For simplicity, we'll just grab the style of the first selected shape.
  // A more advanced version could handle mixed styles.
  const firstShapeId = Array.from(selectedIds)[0];
  const firstShape = shapes.get(firstShapeId);

  if (!firstShape) return null;

  const handleStyleChange = (property, value) => {
    updateShapeStyle({ [property]: value });
  };

  return (
    <div className="absolute top-20 left-4 bg-slate-800 p-3 rounded-lg shadow-lg text-white text-xs space-y-3">
      <div className="flex items-center gap-2">
        <label className="w-20">Stroke Color</label>
        <input
          type="color"
          value={firstShape.stroke || "#000000"}
          onChange={(e) => handleStyleChange("stroke", e.target.value)}
          className="w-8 h-8 p-0 border-none bg-transparent"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="w-20">Stroke Width</label>
        <input
          type="range"
          min="0"
          max="20"
          value={firstShape.strokeWidth ?? 2}
          onChange={(e) =>
            handleStyleChange("strokeWidth", parseInt(e.target.value, 10))
          }
          className="flex-1"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="w-20">Stroke Style</label>
        <select
          value={firstShape.strokeStyle || "solid"}
          onChange={(e) => handleStyleChange("strokeStyle", e.target.value)}
          className="bg-slate-700 p-1 rounded w-full"
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="w-20">Opacity</label>
        <input
          type="range"
          min="0"
          max="100"
          value={(firstShape.opacity ?? 1) * 100}
          onChange={(e) =>
            handleStyleChange("opacity", parseInt(e.target.value, 10) / 100)
          }
          className="flex-1"
        />
      </div>
    </div>
  );
};

// Main Canvas
function Canvas() {
  const [, updatePresence] = useMyPresence();
  const others = useOthers();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [tool, setTool] = useState("select");
  const [color, setColor] = useState(COLORS[0]);
  const [showHelp, setShowHelp] = useState(false);
  const [selectionNet, setSelectionNet] = useState(null);
  const shapes = useStorage((root) => root.shapes);
  const camera = useStorage((root) => root.camera);
  const svgRef = useRef(null);
  const cameraRef = useRef(camera); // 👈 ADD THIS LINE
  const containerRef = useRef(null);
  const isPanningRef = useRef(false);
  const selectionNetRef = useRef(null);

  const { undo, redo, canUndo, canRedo } = useHistory();

  // Sync ref with the latest camera state from storage
  useEffect(() => {
    // 👈 ADD THIS ENTIRE useEffect BLOCK
    cameraRef.current = camera;
  }, [camera]);

  useEffect(() => {
    // In a real app, you'd fetch the user's name from your auth context.
    updatePresence({
      info: { name: "User " + Math.floor(Math.random() * 100) },
    });
  }, [updatePresence]);

  // Update ref when state changes
  useEffect(() => {
    selectionNetRef.current = selectionNet;
  }, [selectionNet]);

  const updateCamera = useMutation(({ storage }, updates) => {
    const cam = storage.get("camera");
    Object.entries(updates).forEach(([key, value]) => {
      cam.set(key, value);
    });
  }, []);

  // In the Canvas component
  const updateShapeStyle = useMutation(
    ({ storage }, updates) => {
      selectedIds.forEach((id) => {
        const shape = storage.get("shapes").get(id);
        if (shape) {
          for (const [key, value] of Object.entries(updates)) {
            shape.set(key, value);
          }
        }
      });
    },
    [selectedIds]
  );

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
    const shapes = storage.get("shapes");
    const idsToDelete = [];
    for (const [key] of shapes.entries()) {
      idsToDelete.push(key);
    }
    idsToDelete.forEach((id) => shapes.delete(id));
  }, []);

  const duplicate = useMutation(({ storage }, id) => {
    const s = storage.get("shapes").get(id);
    if (!s) return null;
    const newId = Date.now().toString();
    const cfg = { ...s.toObject(), x: s.get("x") + 20, y: s.get("y") + 20 };
    storage.get("shapes").set(newId, new LiveObject(cfg));
    return newId;
  }, []);

  const shapeArr = useMemo(() => {
    if (!shapes) return [];
    if (typeof shapes.keys === "function" && typeof shapes.get === "function") {
      return Array.from(shapes.keys()).map((id) => [id, shapes.get(id)]);
    }
    if (typeof shapes.entries === "function") {
      return Array.from(shapes.entries());
    }
    return Object.entries(shapes);
  }, [shapes]);

  const handleMove = useCallback(
    (e) => {
      if (!camera || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasPos = screenToCanvas(screenX, screenY, camera);
      updatePresence({ cursor: canvasPos });
    },
    [updatePresence, camera]
  );

  const handlePanStart = useCallback(
    (e) => {
      if (e.button !== 1 && !(e.button === 0 && e.spaceKey)) return;
      e.preventDefault();
      isPanningRef.current = true;
      const startX = e.clientX;
      const startY = e.clientY;
      const startCamX = camera.x;
      const startCamY = camera.y;

      const move = (me) => {
        const dx = me.clientX - startX;
        const dy = me.clientY - startY;
        updateCamera({ x: startCamX + dx, y: startCamY + dy });
      };
      const up = () => {
        isPanningRef.current = false;
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    },
    [camera, updateCamera]
  );

  const onShapePointerDown = useCallback((id, e) => {
    e.stopPropagation();

    if (e.shiftKey) {
      setSelectedIds((prev) => {
        const newSelection = new Set(prev);
        if (newSelection.has(id)) {
          newSelection.delete(id);
        } else {
          newSelection.add(id);
        }
        return newSelection;
      });
    } else {
      setSelectedIds(new Set([id]));
    }
  }, []);

  // SIMPLER FIX: Handle all clicks and check if they're on shapes
  const handleCanvasClick = useCallback(
    (e) => {
      // If we're in select mode and the click wasn't on a shape, deselect
      if (tool === "select") {
        // Check if click was on any shape element
        const clickedOnShape = e.target.closest(
          "rect, circle, ellipse, polygon, line, text, foreignObject"
        );

        if (!clickedOnShape) {
          setSelectedIds(new Set());
        }
      }

      // Only create new shapes if we're not in select mode
      if (tool !== "select" && camera && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const canvasPos = screenToCanvas(screenX, screenY, camera);
        const id = insert(tool, canvasPos.x, canvasPos.y, color);
        setSelectedIds(new Set([id]));
        setTool("select");
      }
    },
    [tool, insert, color, camera]
  );

  

  // In the Canvas component
  const resetCamera = useCallback(() => {
    updateCamera({ x: 0, y: 0, zoom: 1 });
  }, [updateCamera]);

  const handleSelectionNetStart = useCallback(
    (e) => {
      if (e.button !== 0 || tool !== "select") return;
      if (!camera || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const point = screenToCanvas(screenX, screenY, camera);

      setSelectionNet({ x: point.x, y: point.y, width: 0, height: 0 });

      const move = (me) => {
        const currentScreenX = me.clientX - rect.left;
        const currentScreenY = me.clientY - rect.top;
        const currentPoint = screenToCanvas(
          currentScreenX,
          currentScreenY,
          camera
        );

        setSelectionNet({
          x: Math.min(point.x, currentPoint.x),
          y: Math.min(point.y, currentPoint.y),
          width: Math.abs(point.x - currentPoint.x),
          height: Math.abs(point.y - currentPoint.y),
        });
      };

      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);

        const net = selectionNetRef.current;
        if (net && (net.width > 5 || net.height > 5)) {
          const newSelectedIds = new Set();
          for (const [id, shape] of shapeArr) {
            const bounds = getShapeBounds(shape);
            if (
              bounds.x < net.x + net.width &&
              bounds.x + bounds.width > net.x &&
              bounds.y < net.y + net.height &&
              bounds.y + bounds.height > net.y
            ) {
              newSelectedIds.add(id);
            }
          }
          setSelectedIds(newSelectedIds);
        }
        setSelectionNet(null);
      };

      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    },
    [tool, camera, shapeArr]
  );

  // Replace the entire useEffect for wheel handling with this:
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !camera) return;

    const onWheel = (e) => {
      // Only handle zoom when Ctrl key is pressed or for trackpad pinch gestures
      if (!e.ctrlKey && Math.abs(e.deltaY) < 100) return;

      e.preventDefault();

      const rect = el.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // Calculate the point under cursor in canvas coordinates BEFORE zoom
      const canvasBeforeZoom = screenToCanvas(screenX, screenY, camera);

      // Calculate new zoom level
      const delta = -e.deltaY;
      const zoomFactor = Math.exp(delta * ZOOM_SENSITIVITY);
      const newZoom = Math.min(
        Math.max(camera.zoom * zoomFactor, ZOOM_MIN),
        ZOOM_MAX
      );

      // Calculate the same point under cursor in canvas coordinates AFTER zoom
      const canvasAfterZoom = screenToCanvas(screenX, screenY, {
        ...camera,
        zoom: newZoom,
      });

      // Calculate how much we need to adjust the camera to keep the point under cursor fixed
      const dx = (canvasAfterZoom.x - canvasBeforeZoom.x) * newZoom;
      const dy = (canvasAfterZoom.y - canvasBeforeZoom.y) * newZoom;

      updateCamera({
        zoom: newZoom,
        x: camera.x + dx,
        y: camera.y + dy,
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [camera, updateCamera]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === "TEXTAREA") return;

      switch (e.key) {
        case "Backspace":
        case "Delete":
          selectedIds.forEach(deleteShape);
          setSelectedIds(new Set());
          break;
        case "z":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            undo();
          }
          break;
        case "y":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            redo();
          }
          break;
        case "d":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            const newIds = new Set();
            selectedIds.forEach((id) => {
              const newId = duplicate(id);
              if (newId) newIds.add(newId);
            });
            setSelectedIds(newIds);
          } else {
            setTool("diamond");
          }
          break;
        case "r":
          setTool("rectangle");
          break;
        case "c":
          setTool("circle");
          break;
        case "e":
          setTool("ellipse");
          break;
        case "a":
          setTool("arrow");
          break;
        case "l":
          setTool("line");
          break;
        case "t":
          setTool("textBox");
          break;
        case "s":
          setTool("select");
          break;
        case "Escape":
          setSelectedIds(new Set());
          setTool("select");
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIds, deleteShape, undo, redo, duplicate]);

  if (!camera) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
        <p className="text-slate-400">Loading whiteboard...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-slate-950 overflow-hidden"
      onPointerMove={handleMove}
      onPointerDown={(e) => {
        handlePanStart(e);
        handleSelectionNetStart(e);
      }}
      onClick={handleCanvasClick}
      style={{
        cursor:
          tool === "select"
            ? isPanningRef.current
              ? "grabbing"
              : "default"
            : "crosshair",
      }}
    >
      <svg ref={svgRef} className="w-full h-full">
        <defs>
          <pattern
            id="grid"
            width={GRID_SIZE}
            height={GRID_SIZE}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${camera.x % GRID_SIZE}, ${
              camera.y % GRID_SIZE
            }) scale(${camera.zoom})`}
          >
            <path
              d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
              fill="none"
              stroke="rgba(203, 213, 225, 0.1)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <g
          transform={`translate(${camera.x}, ${camera.y}) scale(${camera.zoom})`}
        >
          {shapeArr.map(([id, shape]) => {
            const Component = ShapeMap[shape.type];
            if (!Component) return null;
            return (
              <Component
                key={id}
                id={id}
                shape={shape}
                isSelected={selectedIds.has(id)}
                onSelect={onShapePointerDown}
                camera={camera}
              />
            );
          })}
          {selectionNet && (
            <rect
              x={selectionNet.x}
              y={selectionNet.y}
              width={selectionNet.width}
              height={selectionNet.height}
              fill="rgba(6, 182, 212, 0.2)"
              stroke="rgba(6, 182, 212, 0.8)"
              strokeWidth={1 / camera.zoom}
            />
          )}
          {others.map(({ connectionId, presence }) =>
            presence.cursor ? (
              <Cursor
                key={connectionId}
                x={presence.cursor.x}
                y={presence.cursor.y}
                color={getUserColor(connectionId)}
                name={presence.info?.name || "Anonymous"}
              />
            ) : null
          )}
        </g>
      </svg>

      {/* UI Elements */}
      <StylingPanel // 👈 ADD THIS
        selectedIds={selectedIds}
        shapes={shapes}
        updateShapeStyle={updateShapeStyle}
      />

      {/* UI Elements */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-800 p-2 rounded-lg shadow-lg select-none">
        <button
          onClick={() => setTool("select")}
          className={`p-2 rounded-md ${
            tool === "select" ? "bg-cyan-500 text-white" : "hover:bg-slate-700"
          }`}
          title="Select (S)"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M13.64,21.97C13.14,22.21 12.54,22 12.31,21.5L10.13,16.76L7.62,18.78C7.45,18.92 7.24,19 7,19A1,1 0 0,1 6,18V3A1,1 0 0,1 7,2C7.24,2 7.45,2.08 7.62,2.22L16.39,8.78C16.86,9.16 16.95,9.82 16.57,10.29L13.96,13.58L18.69,15.75C19.19,16 19.41,16.59 19.18,17.09L13.64,21.97Z"
            />
          </svg>
        </button>
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            className={`p-2 rounded-md ${
              tool === t.id ? "bg-cyan-500 text-white" : "hover:bg-slate-700"
            }`}
            title={t.title}
          >
            <Icon icon={t.icon} />
          </button>
        ))}
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-800 p-2 rounded-lg shadow-lg">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-6 h-6 rounded-full ${
              color === c
                ? "ring-2 ring-offset-2 ring-offset-slate-800 ring-white"
                : ""
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-slate-800 p-2 rounded-lg shadow-lg">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 rounded-md hover:bg-slate-700 disabled:opacity-50"
          title="Undo (Ctrl+Z)"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H11L7.38,12.38C8.77,11.22 10.54,10.5 12.5,10.5C16.04,10.5 19.05,12.81 20.1,16L22.47,15.22C21.08,11.03 17.15,8 12.5,8Z"
            />
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 rounded-md hover:bg-slate-700 disabled:opacity-50"
          title="Redo (Ctrl+Y)"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M18.4,10.6C16.55,9 14.15,8 11.5,8C6.85,8 2.92,11.03 1.53,15.22L3.9,16C4.95,12.81 7.96,10.5 11.5,10.5C13.46,10.5 15.23,11.22 16.62,12.38L13,16H22V7L18.4,10.6Z"
            />
          </svg>
        </button>
        <button
          onClick={clear}
          className="p-2 rounded-md hover:bg-red-500"
          title="Clear All"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"
            />
          </svg>
        </button>
        {/* 👇 ADD THIS BUTTON 👇 */}
        <button
          onClick={resetCamera}
          className="p-2 rounded-md hover:bg-slate-700"
          title="Reset View"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12 6.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5c.88 0 1.7-.26 2.39-.7L20 20l-1.42-1.42-5.21-5.21c.44-.69.7-1.51.7-2.39C14.07 8.74 12.06 6.5 10 6.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5S10.62 8.5 12 8.5s2.5 1.12 2.5 2.5S13.38 13.5 12 13.5zM4 4h4v2H4v4H2V4h2zm16 0h-4v2h4v4h2V4h-2zM4 20h4v-2H4v-4H2v6h2zM20 20h-4v-2h4v-4h2v6h-2z"
            />
          </svg>
        </button>
      </div>

      <div className="absolute bottom-4 right-4">
        <button
          onClick={() => setShowHelp((s) => !s)}
          className="p-2 rounded-full bg-slate-800 hover:bg-cyan-500"
          title="Help"
        >
          ?
        </button>
        {showHelp && (
          <div className="absolute bottom-12 right-0 w-64 bg-slate-800 p-4 rounded-lg shadow-lg text-sm">
            <h3 className="font-bold mb-2">Shortcuts</h3>
            <ul className="space-y-1">
              <li>
                <span className="font-mono bg-slate-700 px-1 rounded">
                  Delete/Backspace
                </span>
                : Delete selected
              </li>
              <li>
                <span className="font-mono bg-slate-700 px-1 rounded">
                  Ctrl/Cmd + Z
                </span>
                : Undo
              </li>
              <li>
                <span className="font-mono bg-slate-700 px-1 rounded">
                  Ctrl/Cmd + Y
                </span>
                : Redo
              </li>
              <li>
                <span className="font-mono bg-slate-700 px-1 rounded">
                  Ctrl/Cmd + D
                </span>
                : Duplicate
              </li>
              <li>
                <span className="font-mono bg-slate-700 px-1 rounded">
                  R, C, D, E, A, L, T
                </span>
                : Select tool
              </li>
              <li>
                <span className="font-mono bg-slate-700 px-1 rounded">S</span>:
                Select tool
              </li>
              <li>
                <span className="font-mono bg-slate-700 px-1 rounded">
                  Mouse Wheel
                </span>
                : Zoom
              </li>
              <li>
                <span className="font-mono bg-slate-700 px-1 rounded">
                  Middle Click
                </span>
                : Pan
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function WhiteboardPage() {
  const { workspaceSlug } = useParams();

  return (
    <RoomProvider
      id={workspaceSlug}
      initialPresence={{ cursor: null, info: {} }}
      initialStorage={{
        shapes: new LiveMap(),
        camera: new LiveObject({ x: 0, y: 0, zoom: 1 }),
      }}
    >
      <ClientSideSuspense
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-slate-950">
            <p className="text-slate-400">Loading Whiteboard...</p>
          </div>
        }
      >
        {() => <Canvas />}
      </ClientSideSuspense>
    </RoomProvider>
  );
}

export default WhiteboardPage;
