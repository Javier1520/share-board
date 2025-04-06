"use client";

import { useState } from "react";

interface ToolbarProps {
  onColorChange?: (color: string) => void;
  onWidthChange?: (width: number) => void;
  onClear?: () => void;
}

export function Toolbar({
  onColorChange,
  onWidthChange,
  onClear,
}: ToolbarProps) {
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedWidth, setSelectedWidth] = useState(2);

  const colors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
  ];

  const widths = [1, 2, 4, 8];

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    onColorChange?.(color);
  };

  const handleWidthChange = (width: number) => {
    setSelectedWidth(width);
    onWidthChange?.(width);
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-4 bg-card p-2 rounded-lg shadow-lg">
      <div className="flex items-center space-x-2">
        {colors.map((color) => (
          <button
            key={color}
            className={`w-6 h-6 rounded-full border-2 ${
              selectedColor === color ? "border-primary" : "border-transparent"
            }`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorChange(color)}
          />
        ))}
      </div>
      <div className="flex items-center space-x-2">
        {widths.map((width) => (
          <button
            key={width}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              selectedWidth === width
                ? "bg-primary text-white"
                : "bg-background text-foreground"
            }`}
            onClick={() => handleWidthChange(width)}
          >
            <div
              className="bg-current rounded-full"
              style={{ width: width, height: width }}
            />
          </button>
        ))}
      </div>
      <button
        className="px-4 py-2 text-sm font-medium text-white bg-destructive hover:bg-destructive/90 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive"
        onClick={onClear}
      >
        Clear
      </button>
    </div>
  );
}
