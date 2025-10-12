// frontend/src/components/whiteboard/Cursor.jsx
import React from "react";
import PropTypes from "prop-types";

export function Cursor({ x, y, color, name }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Cursor pointer */}
      <path
        d="M0 0 L0 16 L4 12 L7 18 L9 17 L6 11 L11 11 Z"
        fill={color}
        stroke="white"
        strokeWidth="1"
      />
      {/* User name label */}
      {name && (
        <g transform="translate(12, 0)">
          <rect
            x="0"
            y="0"
            width={name.length * 7 + 8}
            height="20"
            rx="4"
            fill={color}
            opacity="0.9"
          />
          <text
            x="4"
            y="14"
            fill="white"
            fontSize="12"
            fontWeight="500"
            style={{ userSelect: "none" }}
          >
            {name}
          </text>
        </g>
      )}
    </g>
  );
}

Cursor.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  name: PropTypes.string,
};

Cursor.defaultProps = {
  name: "",
};
