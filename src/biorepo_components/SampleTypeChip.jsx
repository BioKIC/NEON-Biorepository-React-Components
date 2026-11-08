import React from "react";
import Chip from "@mui/material/Chip";

// Keep catalog identifiers and profile keywords on the same chip styling.
export default function SampleTypeChip({
  label,
  variant = "filled",
  className,
}) {
  return (
    <Chip
      className={className}
      label={label}
      size="small"
      variant={variant}
      sx={{
        maxWidth: "100%",
        height: "auto",
        minHeight: 24,
        bgcolor: "#e4e7e7",
        color: "#737d81",
        border: variant === "outlined" ? "1px solid #92999b" : "none",
        fontFamily: '"Inter", Helvetica, Arial, sans-serif',
        fontSize: "0.6875rem",
        fontWeight: 500,
        "& .MuiChip-label": {
          fontSize: "inherit",
          fontWeight: "inherit",
          lineHeight: 1.5,
          padding: "2px 8px",
          whiteSpace: "normal",
          overflowWrap: "anywhere",
        },
      }}
    />
  );
}
