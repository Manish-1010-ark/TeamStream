import React, { useCallback } from "react";
import { useMutation } from "@liveblocks/react";

// SHARED DRAG HANDLER LOGIC
function useDragShape(id, shape, updateShape, onShapePointerDown) {
  return useCallback(
    (e) => {
      e.stopPropagation();
      onShapePointerDown();

      const startX = e.clientX - shape.x;
      const startY = e.clientY - shape.y;

      const handlePointerMove = (moveEvent) => {
        const newX = moveEvent.clientX - startX;
        const newY = moveEvent.clientY - startY;
        updateShape(newX, newY);
      };

      const handlePointerUp = () => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
      };

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [shape.x, shape.y, updateShape, onShapePointerDown]
  );
}

// FIX 1: The hook now accepts the `shape` object to get correct dimensions
function useResizeShape(id, shape, updateDimensions) {
  return useCallback(
    (e) => {
      if (e.button !== 2) return; // Right-click only
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startY = e.clientY;
      // Read dimensions from the shape object, not the DOM element
      const startWidth = shape.width;
      const startHeight = shape.height;

      const handlePointerMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        updateDimensions(
          Math.max(50, startWidth + deltaX),
          Math.max(50, startHeight + deltaY)
        );
      };

      const handlePointerUp = () => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
      };

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [id, shape, updateDimensions]
  );
}

// RECTANGLE
export function Rectangle({ id, shape, isSelected, onShapePointerDown }) {
  const updateShape = useMutation(
    ({ storage }, newX, newY) => {
      const shapes = storage.get("shapes");
      const shapeToUpdate = shapes.get(id);
      if (shapeToUpdate) {
        shapeToUpdate.set("x", newX);
        shapeToUpdate.set("y", newY);
      }
    },
    [id]
  );

  const updateDimensions = useMutation(
    ({ storage }, width, height) => {
      const shapes = storage.get("shapes");
      const shapeToUpdate = shapes.get(id);
      if (shapeToUpdate) {
        shapeToUpdate.set("width", width);
        shapeToUpdate.set("height", height);
      }
    },
    [id]
  );

  const handlePointerDown = useDragShape(
    id,
    shape,
    updateShape,
    onShapePointerDown
  );

  const handleContextMenu = useResizeShape(id, updateDimensions);

  return (
    <rect
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      fill={shape.fill}
      stroke={isSelected ? "#06b6d4" : "transparent"}
      strokeWidth={isSelected ? 3 : 2}
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
      style={{ cursor: "move" }}
      rx="2"
    />
  );
}

// CIRCLE
export function Circle({ id, shape, isSelected, onShapePointerDown }) {
  const updateShape = useMutation(
    ({ storage }, newX, newY) => {
      const shapes = storage.get("shapes");
      const shapeToUpdate = shapes.get(id);
      if (shapeToUpdate) {
        shapeToUpdate.set("x", newX);
        shapeToUpdate.set("y", newY);
      }
    },
    [id]
  );

  const handlePointerDown = useDragShape(
    id,
    shape,
    updateShape,
    onShapePointerDown
  );

  return (
    <circle
      cx={shape.x}
      cy={shape.y}
      r={shape.radius}
      fill={shape.fill}
      stroke={isSelected ? "#06b6d4" : "transparent"}
      strokeWidth={isSelected ? 3 : 2}
      onPointerDown={handlePointerDown}
      style={{ cursor: "move" }}
    />
  );
}

// DIAMOND
export function Diamond({ id, shape, isSelected, onShapePointerDown }) {
  const updateShape = useMutation(
    ({ storage }, newX, newY) => {
      const shapes = storage.get("shapes");
      const shapeToUpdate = shapes.get(id);
      if (shapeToUpdate) {
        shapeToUpdate.set("x", newX);
        shapeToUpdate.set("y", newY);
      }
    },
    [id]
  );

  const handlePointerDown = useDragShape(
    id,
    shape,
    updateShape,
    onShapePointerDown
  );

  const w = shape.width || 80;
  const h = shape.height || 80;
  const points = `${shape.x},${shape.y - h / 2} ${shape.x + w / 2},${shape.y} ${
    shape.x
  },${shape.y + h / 2} ${shape.x - w / 2},${shape.y}`;

  return (
    <polygon
      points={points}
      fill={shape.fill}
      stroke={isSelected ? "#06b6d4" : "transparent"}
      strokeWidth={isSelected ? 3 : 2}
      onPointerDown={handlePointerDown}
      style={{ cursor: "move" }}
    />
  );
}

// ELLIPSE
export function Ellipse({ id, shape, isSelected, onShapePointerDown }) {
  const updateShape = useMutation(
    ({ storage }, newX, newY) => {
      const shapes = storage.get("shapes");
      const shapeToUpdate = shapes.get(id);
      if (shapeToUpdate) {
        shapeToUpdate.set("x", newX);
        shapeToUpdate.set("y", newY);
      }
    },
    [id]
  );

  const handlePointerDown = useDragShape(
    id,
    shape,
    updateShape,
    onShapePointerDown
  );

  return (
    <ellipse
      cx={shape.x}
      cy={shape.y}
      rx={shape.rx || 80}
      ry={shape.ry || 50}
      fill={shape.fill}
      stroke={isSelected ? "#06b6d4" : "transparent"}
      strokeWidth={isSelected ? 3 : 2}
      onPointerDown={handlePointerDown}
      style={{ cursor: "move" }}
    />
  );
}

// LINE (connector)
export function Line({ id, shape, isSelected, onShapePointerDown }) {
  const updateShape = useMutation(
    ({ storage }, newX, newY) => {
      const shapes = storage.get("shapes");
      const shapeToUpdate = shapes.get(id);
      if (shapeToUpdate) {
        shapeToUpdate.set("x", newX);
        shapeToUpdate.set("y", newY);
      }
    },
    [id]
  );

  const updateEnd = useMutation(
    ({ storage }, x2, y2) => {
      const shapes = storage.get("shapes");
      const shapeToUpdate = shapes.get(id);
      if (shapeToUpdate) {
        shapeToUpdate.set("x2", x2);
        shapeToUpdate.set("y2", y2);
      }
    },
    [id]
  );

  const handlePointerDown = useDragShape(
    id,
    shape,
    updateShape,
    onShapePointerDown
  );

  const handleEndDrag = useCallback(
    (e) => {
      e.stopPropagation();
      onShapePointerDown();

      const handlePointerMove = (moveEvent) => {
        const newX = moveEvent.clientX;
        const newY = moveEvent.clientY;
        updateEnd(newX, newY);
      };

      const handlePointerUp = () => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
      };

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [updateEnd, onShapePointerDown]
  );

  const x2 = shape.x2 ?? shape.x + 150;
  const y2 = shape.y2 ?? shape.y;

  return (
    <g onPointerDown={handlePointerDown} style={{ cursor: "move" }}>
      <line
        x1={shape.x}
        y1={shape.y}
        x2={x2}
        y2={y2}
        stroke={shape.fill}
        strokeWidth={isSelected ? 3 : 2}
      />
      <circle
        cx={x2}
        cy={y2}
        r="5"
        fill={isSelected ? "#06b6d4" : shape.fill}
        onPointerDown={handleEndDrag}
        style={{ cursor: "grab" }}
      />
    </g>
  );
}

// ARROW
export function Arrow({ id, shape, isSelected, onShapePointerDown }) {
  const updateShape = useMutation(
    ({ storage }, newX, newY) => {
      const shapes = storage.get("shapes");
      const shapeToUpdate = shapes.get(id);
      if (shapeToUpdate) {
        shapeToUpdate.set("x", newX);
        shapeToUpdate.set("y", newY);
      }
    },
    [id]
  );

  const updateEnd = useMutation(
    ({ storage }, x2, y2) => {
      const shapes = storage.get("shapes");
      const shapeToUpdate = shapes.get(id);
      if (shapeToUpdate) {
        shapeToUpdate.set("x2", x2);
        shapeToUpdate.set("y2", y2);
      }
    },
    [id]
  );

  const handlePointerDown = useDragShape(
    id,
    shape,
    updateShape,
    onShapePointerDown
  );

  const handleEndDrag = useCallback(
    (e) => {
      e.stopPropagation();
      onShapePointerDown();

      const handlePointerMove = (moveEvent) => {
        const newX = moveEvent.clientX;
        const newY = moveEvent.clientY;
        updateEnd(newX, newY);
      };

      const handlePointerUp = () => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
      };

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [updateEnd, onShapePointerDown]
  );

  const x2 = shape.x2 ?? shape.x + 150;
  const y2 = shape.y2 ?? shape.y;
  const angle = Math.atan2(y2 - shape.y, x2 - shape.x);
  const arrowSize = 15;
  const p1x = x2 - arrowSize * Math.cos(angle - Math.PI / 6);
  const p1y = y2 - arrowSize * Math.sin(angle - Math.PI / 6);
  const p2x = x2 - arrowSize * Math.cos(angle + Math.PI / 6);
  const p2y = y2 - arrowSize * Math.sin(angle + Math.PI / 6);

  return (
    <g onPointerDown={handlePointerDown} style={{ cursor: "move" }}>
      <line
        x1={shape.x}
        y1={shape.y}
        x2={x2}
        y2={y2}
        stroke={shape.fill}
        strokeWidth={isSelected ? 3 : 2}
      />
      <polygon
        points={`${x2},${y2} ${p1x},${p1y} ${p2x},${p2y}`}
        fill={shape.fill}
      />
      <circle
        cx={x2}
        cy={y2}
        r="5"
        fill={isSelected ? "#06b6d4" : shape.fill}
        onPointerDown={handleEndDrag}
        style={{ cursor: "grab" }}
      />
    </g>
  );
}

// TEXT BOX (with editing)
export function TextBox({ id, shape, isSelected, onShapePointerDown }) {
  const updateShape = useMutation(
    ({ storage }, newX, newY) => {
      const shapes = storage.get("shapes");
      const shapeToUpdate = shapes.get(id);
      if (shapeToUpdate) {
        shapeToUpdate.set("x", newX);
        shapeToUpdate.set("y", newY);
      }
    },
    [id]
  );

  // ADD THIS NEW MUTATION
  const updateDimensions = useMutation(
    ({ storage }, width, height) => {
      const shapeToUpdate = storage.get("shapes").get(id);
      if (shapeToUpdate) {
        shapeToUpdate.set("width", width);
        shapeToUpdate.set("height", height);
      }
    },
    [id]
  );

  const updateText = useMutation(
    ({ storage }, text) => {
      const shapes = storage.get("shapes");
      const shapeToUpdate = shapes.get(id);
      if (shapeToUpdate) {
        shapeToUpdate.set("text", text);
      }
    },
    [id]
  );

  const handlePointerDown = useDragShape(
    id,
    shape,
    updateShape,
    onShapePointerDown
  );

  const handleTextChange = (e) => {
    updateText(e.target.value);
  };

  // This enables right-click-to-resize on the whole shape
  const handleContextMenu = useResizeShape(id, shape, updateDimensions);

  // This new handler is specifically for the circular handle
  const handleResize = useCallback(
    (e) => {
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const { width, height } = shape;

      const handlePointerMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        updateDimensions(
          Math.max(50, width + deltaX),
          Math.max(30, height + deltaY)
        );
      };

      const handlePointerUp = () => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
      };

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [shape, updateDimensions]
  );

  return (
    <g
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
      style={{ cursor: "move" }}
    >
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        stroke={isSelected ? "#06b6d4" : "rgba(255,255,255,0.2)"}
        strokeWidth={isSelected ? 3 : 1}
        rx="4"
      />
      <foreignObject
        x={shape.x + 4}
        y={shape.y + 4}
        width={Math.max(0, shape.width - 8)}
        height={Math.max(0, shape.height - 8)}
        style={{ pointerEvents: isSelected ? "auto" : "none" }}
      >
        <div style={{ width: "100%", height: "100%" }}>
          {isSelected ? (
            <textarea
              value={shape.text || ""}
              onChange={handleTextChange}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()} // Also stop pointer down
              style={{
                width: "100%",
                height: "100%",
                padding: "4px",
                backgroundColor: shape.fill,
                color: shape.textColor || "#ffffff",
                border: "none",
                fontFamily: "inherit",
                fontSize: "12px",
                resize: "none",
                outline: "none",
                pointerEvents: "auto",
              }}
            />
          ) : (
            <div
              style={{
                padding: "4px",
                color: shape.textColor || "#ffffff",
                fontSize: "12px",
                wordWrap: "break-word",
                overflow: "hidden",
              }}
            >
              {shape.text || "Click to edit"}
            </div>
          )}
        </div>
      </foreignObject>

      {/* resize handle must be an SVG element at the same level as rect/foreignObject */}
      {isSelected && (
        <circle
          cx={shape.x + shape.width}
          cy={shape.y + shape.height}
          r="6"
          fill="#06b6d4"
          stroke="white"
          strokeWidth="2"
          style={{ cursor: "nwse-resize" }}
          onPointerDown={handleResize} // Connect the handle to its resize function
        />
      )}
    </g>
  );
}

// EXPORTS
// Remove ShapeComponentMap export from this file.
