"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Rect,
  Text,
  Circle,
  Group,
  Transformer,
} from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import Konva from "konva";

// Define table types and shapes
type TableShape = "round" | "rectangle" | "square";
type TableSize = "small" | "medium" | "large";

interface TableData {
  id: string;
  xPercent: number;
  yPercent: number;
  seats: number;
  shape: TableShape;
  size: TableSize;
  rotation: number;
  name?: string;
}

interface FloorData {
  id: string;
  name: string;
  tables: TableData[];
}

interface TableProps {
  id: string;
  x: number;
  y: number;
  seats: number;
  shape: TableShape;
  size: TableSize;
  isSelected: boolean;
  rotation: number;
  name?: string;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onRotate: (id: string, rotation: number) => void;
  stageWidth: number;
  stageHeight: number;
}

interface FloorPlanProps {
  initialWidth?: number;
  initialHeight?: number;
}

// Table dimensions based on size
const tableDimensions = {
  round: {
    small: { radius: 25, seats: 2 },
    medium: { radius: 35, seats: 4 },
    large: { radius: 45, seats: 6 },
  },
  rectangle: {
    small: { width: 60, height: 40, seats: 2 },
    medium: { width: 80, height: 50, seats: 4 },
    large: { width: 120, height: 60, seats: 6 },
  },
  square: {
    small: { width: 40, height: 40, seats: 2 },
    medium: { width: 60, height: 60, seats: 4 },
    large: { width: 80, height: 80, seats: 6 },
  },
};

// Table component
const Table: React.FC<TableProps> = ({
  id,
  x,
  y,
  seats,
  shape,
  size,
  isSelected,
  rotation,
  name,
  onSelect,
  onDragEnd,
  onRotate,
  stageWidth,
  stageHeight,
}) => {
  // Scale the seat circles based on stage size
  const scaleFactor = Math.min(stageWidth, stageHeight) / 800;
  const seatRadius = 6 * Math.max(0.5, scaleFactor);
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      // Attach transformer to the selected table
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Handle transformer transform event
  const handleTransform = () => {
    if (groupRef.current) {
      const rotation = groupRef.current.rotation();
      onRotate(id, rotation);
    }
  };

  // Render different table shapes
  const renderTable = () => {
    switch (shape) {
      case "round":
        const { radius } = tableDimensions.round[size];
        const scaledRadius = radius * Math.max(0.5, scaleFactor);
        return (
          <>
            <Circle
              radius={scaledRadius}
              fill="#d4d4d8"
              stroke={isSelected ? "#2563eb" : "#71717a"}
              strokeWidth={isSelected ? 2 : 1}
            />
            <Text
              text={name || seats.toString()}
              fontSize={12 * Math.max(0.7, scaleFactor)}
              fill="#000"
              align="center"
              verticalAlign="middle"
              width={scaledRadius * 2}
              height={scaledRadius * 2}
              offsetX={scaledRadius}
              offsetY={scaledRadius}
            />
            {/* Seat positions for round tables */}
            {Array.from({ length: seats }).map((_, i) => {
              const angle = (i * 2 * Math.PI) / seats;
              const seatDistance = scaledRadius + 10 * scaleFactor;
              return (
                <Circle
                  key={i}
                  x={seatDistance * Math.cos(angle)}
                  y={seatDistance * Math.sin(angle)}
                  radius={seatRadius}
                  fill="#94a3b8"
                />
              );
            })}
          </>
        );

      case "rectangle":
        const rectDim = tableDimensions.rectangle[size];
        const scaledWidth = rectDim.width * Math.max(0.5, scaleFactor);
        const scaledHeight = rectDim.height * Math.max(0.5, scaleFactor);
        return (
          <>
            <Rect
              width={scaledWidth}
              height={scaledHeight}
              offsetX={scaledWidth / 2}
              offsetY={scaledHeight / 2}
              fill="#d4d4d8"
              stroke={isSelected ? "#2563eb" : "#71717a"}
              strokeWidth={isSelected ? 2 : 1}
              cornerRadius={3}
            />
            <Text
              text={name || seats.toString()}
              fontSize={12 * Math.max(0.7, scaleFactor)}
              fill="#000"
              align="center"
              verticalAlign="middle"
              width={scaledWidth}
              height={scaledHeight}
              offsetX={scaledWidth / 2}
              offsetY={scaledHeight / 2}
            />
            {/* Seat positions for rectangle tables */}
            {Array.from({ length: seats }).map((_, i) => {
              // Position seats around the table
              let seatX = 0;
              let seatY = 0;

              const longSideSeats = Math.ceil(seats / 2);
              const shortSideSeats = Math.floor(seats / 2);

              if (i < longSideSeats) {
                // Seats along the long edges
                seatX =
                  (scaledWidth / (longSideSeats + 1)) * (i + 1) -
                  scaledWidth / 2;
                seatY =
                  i % 2 === 0
                    ? -scaledHeight / 2 - 10 * scaleFactor
                    : scaledHeight / 2 + 10 * scaleFactor;
              } else {
                // Seats at the short edges
                const shortIndex = i - longSideSeats;
                seatX =
                  shortIndex % 2 === 0
                    ? -scaledWidth / 2 - 10 * scaleFactor
                    : scaledWidth / 2 + 10 * scaleFactor;
                seatY =
                  (scaledHeight / (shortSideSeats + 1)) *
                    ((shortIndex % 2) + 1) -
                  scaledHeight / 2;
              }

              return (
                <Circle
                  key={i}
                  x={seatX}
                  y={seatY}
                  radius={seatRadius}
                  fill="#94a3b8"
                />
              );
            })}
          </>
        );

      case "square":
        const squareDim = tableDimensions.square[size];
        const scaledSize = squareDim.width * Math.max(0.5, scaleFactor);
        return (
          <>
            <Rect
              width={scaledSize}
              height={scaledSize}
              offsetX={scaledSize / 2}
              offsetY={scaledSize / 2}
              fill="#d4d4d8"
              stroke={isSelected ? "#2563eb" : "#71717a"}
              strokeWidth={isSelected ? 2 : 1}
              cornerRadius={3}
            />
            <Text
              text={name || seats.toString()}
              fontSize={12 * Math.max(0.7, scaleFactor)}
              fill="#000"
              align="center"
              verticalAlign="middle"
              width={scaledSize}
              height={scaledSize}
              offsetX={scaledSize / 2}
              offsetY={scaledSize / 2}
            />
            {/* Seat positions for square tables */}
            {Array.from({ length: seats }).map((_, i) => {
              // Position seats around the table
              const seatsPerSide = Math.ceil(seats / 4);
              const side = Math.floor(i / seatsPerSide);
              const sidePosition = (i % seatsPerSide) + 1;
              const seatSpacing = scaledSize / (seatsPerSide + 1);

              let seatX = 0;
              let seatY = 0;

              switch (side) {
                case 0: // Top
                  seatX = sidePosition * seatSpacing - scaledSize / 2;
                  seatY = -scaledSize / 2 - 10 * scaleFactor;
                  break;
                case 1: // Right
                  seatX = scaledSize / 2 + 10 * scaleFactor;
                  seatY = sidePosition * seatSpacing - scaledSize / 2;
                  break;
                case 2: // Bottom
                  seatX = sidePosition * seatSpacing - scaledSize / 2;
                  seatY = scaledSize / 2 + 10 * scaleFactor;
                  break;
                case 3: // Left
                  seatX = -scaledSize / 2 - 10 * scaleFactor;
                  seatY = sidePosition * seatSpacing - scaledSize / 2;
                  break;
              }

              return (
                <Circle
                  key={i}
                  x={seatX}
                  y={seatY}
                  radius={seatRadius}
                  fill="#94a3b8"
                />
              );
            })}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Group
        ref={groupRef}
        x={x}
        y={y}
        draggable
        rotation={rotation}
        onClick={() => onSelect(id)}
        onTap={() => onSelect(id)}
        onDragEnd={(e: KonvaEventObject<DragEvent>) => {
          onDragEnd(id, e.target.x(), e.target.y());
        }}
        onTransformEnd={handleTransform}
      >
        {renderTable()}
      </Group>
      {isSelected && (
        <Transformer
          ref={transformerRef}
          resizeEnabled={false}
          rotateEnabled={true}
          borderEnabled={true}
          keepRatio={false}
          enabledAnchors={[]}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
        />
      )}
    </>
  );
};

// Helper to convert to/from percentage positions
const toPercent = (position: number, dimension: number) =>
  (position / dimension) * 100;
const fromPercent = (percent: number, dimension: number) =>
  (percent * dimension) / 100;

// Main floor plan component
const RestaurantFloorPlan: React.FC<FloorPlanProps> = ({
  initialWidth = 800,
  initialHeight = 600,
}) => {
  // State for stage dimensions
  const [stageWidth, setStageWidth] = useState(initialWidth);
  const [stageHeight, setStageHeight] = useState(initialHeight);
  const [aspectRatio] = useState(initialWidth / initialHeight);

  // Initialize with one floor
  const initialFloors: FloorData[] = [
    {
      id: "floor-1",
      name: "Floor 1",
      tables: [
        {
          id: "1",
          xPercent: 12.5,
          yPercent: 16.6,
          seats: 2,
          shape: "round",
          size: "small",
          rotation: 0,
          name: "T1",
        },
        {
          id: "2",
          xPercent: 31.25,
          yPercent: 25,
          seats: 4,
          shape: "rectangle",
          size: "medium",
          rotation: 0,
          name: "T2",
        },
        {
          id: "3",
          xPercent: 50,
          yPercent: 33.3,
          seats: 6,
          shape: "square",
          size: "large",
          rotation: 0,
          name: "T3",
        },
      ],
    },
  ];

  // State for floors and current floor
  const [floors, setFloors] = useState<FloorData[]>(initialFloors);
  const [currentFloorId, setCurrentFloorId] = useState<string>("floor-1");
  const [newFloorName, setNewFloorName] = useState<string>("");

  // State for table configuration
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [newTableType, setNewTableType] = useState<TableShape>("round");
  const [newTableSize, setNewTableSize] = useState<TableSize>("medium");
  const [newTableSeats, setNewTableSeats] = useState<number>(4);
  const [newTableName, setNewTableName] = useState<string>("");

  // State for save/load
  const [layoutName, setLayoutName] = useState<string>("");

  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get current floor data
  const currentFloor =
    floors.find((floor) => floor.id === currentFloorId) || floors[0];
  const tables = currentFloor?.tables || [];

  // Load saved layout from localStorage on mount
  useEffect(() => {
    const savedLayout = localStorage.getItem("restaurantLayout");
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        if (parsed && parsed.floors) {
          setFloors(parsed.floors);
          if (parsed.floors.length > 0) {
            setCurrentFloorId(parsed.floors[0].id);
          }
          setLayoutName(parsed.name || "");
        }
      } catch (e) {
        console.error("Error loading saved layout", e);
      }
    }
  }, []);

  // Make the stage responsive
  useEffect(() => {
    const checkSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;

        // Set the stage width to the container width, and maintain the aspect ratio for height
        setStageWidth(containerWidth);
        setStageHeight(containerWidth / aspectRatio);
      }
    };

    // Initial check
    checkSize();

    // Add resize event listener
    window.addEventListener("resize", checkSize);

    // Clean up
    return () => window.removeEventListener("resize", checkSize);
  }, [aspectRatio]);

  // Handle floor management
  const handleAddFloor = () => {
    if (!newFloorName.trim()) {
      alert("Please enter a floor name");
      return;
    }

    const newFloorId = `floor-${Date.now()}`;
    const newFloor: FloorData = {
      id: newFloorId,
      name: newFloorName,
      tables: [],
    };

    setFloors([...floors, newFloor]);
    setCurrentFloorId(newFloorId);
    setNewFloorName("");
  };

  const handleSwitchFloor = (floorId: string) => {
    setSelectedTable(null);
    setCurrentFloorId(floorId);
  };

  const handleDeleteFloor = (floorId: string) => {
    if (floors.length <= 1) {
      alert("You cannot delete the only floor");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this floor and all its tables?"
    );
    if (!confirmDelete) return;

    const updatedFloors = floors.filter((floor) => floor.id !== floorId);
    setFloors(updatedFloors);

    // Switch to another floor if the current one is deleted
    if (floorId === currentFloorId) {
      setCurrentFloorId(updatedFloors[0].id);
    }
  };

  // Handle table selection
  const handleTableSelect = (id: string) => {
    setSelectedTable(id === selectedTable ? null : id);
    if (id !== selectedTable) {
      const table = tables.find((t) => t.id === id);
      if (table) {
        setNewTableName(table.name || "");
      }
    }
  };

  // Handle table drag end - convert absolute positions to percentages
  const handleTableDragEnd = (id: string, x: number, y: number) => {
    const updatedFloors = floors.map((floor) => {
      if (floor.id !== currentFloorId) return floor;

      return {
        ...floor,
        tables: floor.tables.map((table) =>
          table.id === id
            ? {
                ...table,
                xPercent: toPercent(x, stageWidth),
                yPercent: toPercent(y, stageHeight),
              }
            : table
        ),
      };
    });

    setFloors(updatedFloors);
  };

  // Handle table rotation
  const handleTableRotate = (id: string, rotation: number) => {
    const updatedFloors = floors.map((floor) => {
      if (floor.id !== currentFloorId) return floor;

      return {
        ...floor,
        tables: floor.tables.map((table) =>
          table.id === id
            ? {
                ...table,
                rotation: rotation,
              }
            : table
        ),
      };
    });

    setFloors(updatedFloors);
  };

  // Add a new table
  const handleAddTable = () => {
    const tableName = newTableName || `T${tables.length + 1}`;
    const newTable = {
      id: Date.now().toString(),
      xPercent: 50, // center of canvas
      yPercent: 50, // center of canvas
      seats: newTableSeats,
      shape: newTableType,
      size: newTableSize,
      rotation: 0,
      name: tableName,
    };

    const updatedFloors = floors.map((floor) => {
      if (floor.id !== currentFloorId) return floor;

      return {
        ...floor,
        tables: [...floor.tables, newTable],
      };
    });

    setFloors(updatedFloors);
    setSelectedTable(newTable.id);
    setNewTableName("");
  };

  // Remove selected table
  const handleRemoveTable = () => {
    if (selectedTable) {
      const updatedFloors = floors.map((floor) => {
        if (floor.id !== currentFloorId) return floor;

        return {
          ...floor,
          tables: floor.tables.filter((table) => table.id !== selectedTable),
        };
      });

      setFloors(updatedFloors);
      setSelectedTable(null);
    }
  };

  // Update table properties
  const handleUpdateTableSeats = (seats: number) => {
    if (selectedTable) {
      const updatedFloors = floors.map((floor) => {
        if (floor.id !== currentFloorId) return floor;

        return {
          ...floor,
          tables: floor.tables.map((table) =>
            table.id === selectedTable ? { ...table, seats } : table
          ),
        };
      });

      setFloors(updatedFloors);
    }
  };

  // Update table name
  const handleUpdateTableName = (name: string) => {
    if (selectedTable) {
      const updatedFloors = floors.map((floor) => {
        if (floor.id !== currentFloorId) return floor;

        return {
          ...floor,
          tables: floor.tables.map((table) =>
            table.id === selectedTable ? { ...table, name } : table
          ),
        };
      });

      setFloors(updatedFloors);
    }
  };

  // Save current layout
  const handleSaveLayout = () => {
    if (!layoutName.trim()) {
      alert("Please enter a layout name");
      return;
    }

    // Save the current floors configuration
    const layoutData = {
      name: layoutName,
      floors: floors,
      dimensions: { width: stageWidth, height: stageHeight, aspectRatio },
    };

    // Update localStorage
    localStorage.setItem("restaurantLayout", JSON.stringify(layoutData));
    alert(`Layout "${layoutName}" saved successfully!`);
  };

  // Load saved layout
  const handleLoadLayout = () => {
    const savedLayout = localStorage.getItem("restaurantLayout");
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        if (parsed && parsed.floors) {
          setFloors(parsed.floors);
          if (parsed.floors.length > 0) {
            setCurrentFloorId(parsed.floors[0].id);
          }
          setLayoutName(parsed.name || "");
          setSelectedTable(null);
          alert(`Layout "${parsed.name || "Unnamed"}" loaded successfully!`);
        } else {
          alert("Error: Invalid layout data");
        }
      } catch (e) {
        console.error("Error loading saved layout", e);
        alert("Error loading layout");
      }
    } else {
      alert("No saved layout found");
    }
  };

  return (
    <div className="flex flex-col w-full max-w-6xl p-2 mx-auto bg-white rounded-lg shadow-md md:p-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800 md:text-2xl">
          Restaurant Floor Plan Editor
        </h1>
        <p className="text-sm text-gray-600 md:text-base">
          Manage multiple floors and tables. Drag tables to position them,
          rotate tables by selecting and using the rotation handle.
        </p>
      </div>

      {/* Floor management */}
      <div className="flex flex-wrap gap-2 p-2 mb-4 bg-indigo-50 border border-indigo-200 rounded-lg md:gap-4 md:p-4">
        <div className="flex flex-col w-full">
          <h3 className="mb-2 text-base font-semibold text-indigo-800 md:text-lg">
            Floor Management
          </h3>

          {/* Floor tabs */}
          <div className="flex flex-wrap mb-3 overflow-x-auto">
            {floors.map((floor) => (
              <div
                key={floor.id}
                className={`flex items-center mr-2 mb-2 px-3 py-1 rounded-md border ${
                  floor.id === currentFloorId
                    ? "bg-indigo-500 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                <button
                  className="text-sm md:text-base"
                  onClick={() => handleSwitchFloor(floor.id)}
                >
                  {floor.name} ({floor.tables.length} tables)
                </button>
                <button
                  className="ml-2 text-xs opacity-70 hover:opacity-100"
                  onClick={() => handleDeleteFloor(floor.id)}
                  title="Delete floor"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Add new floor */}
          <div className="flex items-end">
            <div className="flex-1 mr-2">
              <label className="mb-1 text-xs font-medium text-gray-700 md:text-sm">
                New Floor Name
              </label>
              <input
                type="text"
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                placeholder="e.g. Ground Floor, Mezzanine, etc."
                className="w-full px-2 py-1 text-sm border rounded-md md:px-3 md:py-2 md:text-base"
              />
            </div>
            <button
              onClick={handleAddFloor}
              className="px-3 py-1 text-sm text-white bg-indigo-600 rounded-md md:px-4 md:py-2 md:text-base hover:bg-indigo-700"
            >
              Add Floor
            </button>
          </div>
        </div>
      </div>

      {/* Table controls toolbar */}
      <div className="flex flex-wrap gap-2 p-2 mb-4 bg-gray-100 rounded-lg md:gap-4 md:p-4">
        <div className="flex flex-col w-1/2 sm:w-auto">
          <label className="mb-1 text-xs font-medium text-gray-700 md:text-sm">
            Table Shape
          </label>
          <select
            value={newTableType}
            onChange={(e) => setNewTableType(e.target.value as TableShape)}
            className="px-2 py-1 text-sm border rounded-md md:px-3 md:py-2 md:text-base"
          >
            <option value="round">Round</option>
            <option value="rectangle">Rectangle</option>
            <option value="square">Square</option>
          </select>
        </div>

        <div className="flex flex-col w-1/2 sm:w-auto">
          <label className="mb-1 text-xs font-medium text-gray-700 md:text-sm">
            Table Size
          </label>
          <select
            value={newTableSize}
            onChange={(e) => setNewTableSize(e.target.value as TableSize)}
            className="px-2 py-1 text-sm border rounded-md md:px-3 md:py-2 md:text-base"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        <div className="flex flex-col w-1/2 mt-2 sm:mt-0 sm:w-auto">
          <label className="mb-1 text-xs font-medium text-gray-700 md:text-sm">
            Seats
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={newTableSeats}
            onChange={(e) => setNewTableSeats(parseInt(e.target.value))}
            className="px-2 py-1 text-sm border rounded-md md:px-3 md:py-2 md:text-base"
          />
        </div>

        <div className="flex flex-col w-1/2 mt-2 sm:mt-0 sm:w-auto">
          <label className="mb-1 text-xs font-medium text-gray-700 md:text-sm">
            Table Name
          </label>
          <input
            type="text"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            placeholder="Table name"
            className="px-2 py-1 text-sm border rounded-md md:px-3 md:py-2 md:text-base"
          />
        </div>

        <div className="flex items-end w-full mt-2 sm:w-auto">
          <button
            onClick={handleAddTable}
            className="w-full px-3 py-1 text-sm text-white bg-blue-600 rounded-md md:px-4 md:py-2 md:text-base hover:bg-blue-700"
          >
            Add Table to {currentFloor?.name}
          </button>
        </div>
      </div>

      {/* Selected table controls */}
      {selectedTable && (
        <div className="flex flex-wrap gap-2 p-2 mb-4 border border-blue-300 rounded-lg md:gap-4 md:p-4 bg-blue-50">
          <h3 className="w-full text-base font-semibold text-blue-800 md:text-lg">
            Table{" "}
            {tables.find((t) => t.id === selectedTable)?.name ||
              `#${selectedTable}`}
          </h3>

          <div className="flex flex-col w-1/2 sm:w-auto">
            <label className="mb-1 text-xs font-medium text-gray-700 md:text-sm">
              Table Name
            </label>
            <input
              type="text"
              value={tables.find((t) => t.id === selectedTable)?.name || ""}
              onChange={(e) => handleUpdateTableName(e.target.value)}
              className="px-2 py-1 text-sm border rounded-md md:px-3 md:py-2 md:text-base"
            />
          </div>

          <div className="flex flex-col w-1/2 sm:w-auto">
            <label className="mb-1 text-xs font-medium text-gray-700 md:text-sm">
              Seats
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={tables.find((t) => t.id === selectedTable)?.seats || 0}
              onChange={(e) => handleUpdateTableSeats(parseInt(e.target.value))}
              className="px-2 py-1 text-sm border rounded-md md:px-3 md:py-2 md:text-base"
            />
          </div>

          <div className="flex items-center mt-2 ml-auto sm:mt-0">
            <button
              onClick={handleRemoveTable}
              className="px-2 py-1 text-xs text-white bg-red-600 rounded-md md:px-3 md:py-2 md:text-sm hover:bg-red-700"
            >
              Remove Table
            </button>
          </div>
        </div>
      )}

      {/* Canvas floor plan - Responsive container */}
      <div
        ref={containerRef}
        className="w-full border border-gray-300 rounded-lg"
        style={{ background: "#F9FAFB" }}
      >
        <div className="p-2 bg-gray-100 border-b border-gray-300">
          <h4 className="text-base font-medium text-gray-700">
            {currentFloor?.name} - {tables.length} tables
          </h4>
        </div>
        <Stage
          width={stageWidth}
          height={stageHeight}
          ref={stageRef}
          onMouseDown={(e) => {
            // Deselect when clicking on the empty area
            if (e.target === e.currentTarget) {
              setSelectedTable(null);
            }
          }}
          onTap={(e) => {
            // Ensure touch events deselect tables when tapping empty areas
            if (e.target === e.currentTarget) {
              setSelectedTable(null);
            }
          }}
        >
          <Layer>
            {/* Draw walls or fixed elements here */}
            <Rect
              x={0}
              y={0}
              width={stageWidth}
              height={stageHeight}
              fill="#F9FAFB"
            />

            {/* Draw grid lines - reduced density for mobile */}
            {Array.from({
              length: Math.floor(stageWidth / Math.max(50, stageWidth / 16)),
            }).map((_, i) => (
              <Rect
                key={`grid-v-${i}`}
                x={i * Math.max(50, stageWidth / 16)}
                y={0}
                width={1}
                height={stageHeight}
                fill="#E5E7EB"
              />
            ))}

            {Array.from({
              length: Math.floor(stageHeight / Math.max(50, stageHeight / 12)),
            }).map((_, i) => (
              <Rect
                key={`grid-h-${i}`}
                x={0}
                y={i * Math.max(50, stageHeight / 12)}
                width={stageWidth}
                height={1}
                fill="#E5E7EB"
              />
            ))}

            {/* Draw entrance */}
            <Rect
              x={stageWidth / 2 - stageWidth * 0.05}
              y={10}
              width={stageWidth * 0.1}
              height={20}
              fill="#FECACA"
              stroke="#EF4444"
              strokeWidth={1}
            />
            <Text
              x={stageWidth / 2 - stageWidth * 0.05}
              y={10}
              width={stageWidth * 0.1}
              height={20}
              text="Entrance"
              fontSize={Math.max(10, 12 * (stageWidth / 800))}
              fill="#B91C1C"
              align="center"
              verticalAlign="middle"
            />

            {/* Draw tables with positions calculated from percentages */}
            {tables.map((table) => (
              <Table
                key={table.id}
                id={table.id}
                x={fromPercent(table.xPercent, stageWidth)}
                y={fromPercent(table.yPercent, stageHeight)}
                seats={table.seats}
                shape={table.shape}
                size={table.size}
                rotation={table.rotation}
                name={table.name}
                isSelected={selectedTable === table.id}
                onSelect={handleTableSelect}
                onDragEnd={handleTableDragEnd}
                onRotate={handleTableRotate}
                stageWidth={stageWidth}
                stageHeight={stageHeight}
              />
            ))}
          </Layer>
        </Stage>
      </div>

      {/* Save/Load Section */}
      <div className="flex flex-wrap gap-2 p-2 mt-4 bg-gray-100 rounded-lg md:gap-4 md:p-4">
        <div className="flex flex-col w-full">
          <h3 className="mb-2 text-base font-semibold text-gray-800 md:text-lg">
            Save/Load Layout
          </h3>
          <div className="flex flex-wrap gap-2 md:gap-4">
            {/* Save layout */}
            <div className="flex flex-col w-full sm:w-auto">
              <label className="mb-1 text-xs font-medium text-gray-700 md:text-sm">
                Layout Name
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  placeholder="My Restaurant Layout"
                  className="px-2 py-1 text-sm border rounded-l-md md:px-3 md:py-2 md:text-base"
                />
                <button
                  onClick={handleSaveLayout}
                  className="px-2 py-1 text-sm text-white bg-green-600 rounded-r-md md:px-4 md:py-2 md:text-base hover:bg-green-700"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Load layout */}
            <div className="flex items-end mt-2 sm:mt-0">
              <button
                onClick={handleLoadLayout}
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md md:px-4 md:py-2 md:text-base hover:bg-blue-700"
              >
                Load Saved Layout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Default export with responsive container
export default function FloorPlanContainer() {
  return <RestaurantFloorPlan />;
}
