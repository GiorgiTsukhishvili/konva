import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Text, Group, Transformer } from "react-konva";
import Konva from "konva";
import dynamic from "next/dynamic";

// Table interface to define our table objects
interface Table {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  seats: number;
  number: string;
  isSelected: boolean;
}

const CanvasMy = () => {
  const divRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });

  const [tables, setTables] = useState<Table[]>(
    localStorage.getItem("tables")
      ? JSON.parse(localStorage.getItem("tables")!)
      : []
  );
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [seatsForNewTable, setSeatsForNewTable] = useState<number>(4);
  const [tableNumber, setTableNumber] = useState<string>("");

  // Update dimensions on mount and window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (divRef.current?.offsetHeight && divRef.current?.offsetWidth) {
        setDimensions({
          width: divRef.current.offsetWidth,
          height: divRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Update transformer when selectedTableId changes
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;

    const stage = stageRef.current;
    const transformer = transformerRef.current;

    if (selectedTableId === null) {
      transformer.nodes([]);
      return;
    }

    // Find the selected node by id
    const selectedNode = stage.findOne("#" + selectedTableId);
    if (selectedNode) {
      transformer.nodes([selectedNode]);
    } else {
      transformer.nodes([]);
    }
  }, [selectedTableId]);

  // Generate a unique ID for new tables
  const generateId = (): string => {
    return `table-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Check if two tables overlap
  const tablesOverlap = (
    table1: Table,
    table2: Table,
    buffer: number = 1
  ): boolean => {
    return !(
      table1.x + table1.width + buffer < table2.x ||
      table1.x > table2.x + table2.width + buffer ||
      table1.y + table1.height + buffer < table2.y ||
      table1.y > table2.y + table2.height + buffer
    );
  };

  // Find a position for a new table that doesn't overlap with existing tables
  const findNonOverlappingPosition = (
    newTable: Table,
    maxAttempts: number = 50
  ): Table => {
    if (tables.length === 0) return newTable; // No tables to overlap with

    let attempts = 0;
    let position = { ...newTable };
    let overlapping = false;

    do {
      // Generate a random position
      position = {
        ...position,
        x: Math.random() * (dimensions.width - position.width - 50) + 50,
        y: Math.random() * (dimensions.height - position.height - 50) + 50,
      };

      // Check if it overlaps with any existing table
      overlapping = tables.some((table) => tablesOverlap(position, table));
      attempts++;
    } while (overlapping && attempts < maxAttempts);

    return position;
  };

  // Add a new table
  const addTable = (): void => {
    if (!tableNumber.trim()) {
      alert("Please enter a table number");
      return;
    }

    // Check if table number already exists
    const tableNumberExists = tables.some(
      (table) => table.number === tableNumber
    );
    if (tableNumberExists) {
      alert("A table with this number already exists");
      return;
    }

    // Table size based on number of seats
    let tableWidth: number, tableHeight: number;

    if (seatsForNewTable <= 2) {
      tableWidth = 60;
      tableHeight = 60;
    } else if (seatsForNewTable <= 4) {
      tableWidth = 80;
      tableHeight = 80;
    } else if (seatsForNewTable <= 6) {
      tableWidth = 120;
      tableHeight = 80;
    } else if (seatsForNewTable <= 8) {
      tableWidth = 160;
      tableHeight = 80;
    } else {
      tableWidth = 200;
      tableHeight = 80;
    }

    const newTable: Table = {
      id: generateId(),
      x: 0,
      y: 0,
      width: tableWidth,
      height: tableHeight,
      rotation: 0,
      seats: seatsForNewTable,
      number: tableNumber,
      isSelected: false,
    };

    // Find a position that doesn't overlap with existing tables
    const positionedTable = findNonOverlappingPosition(newTable);

    setTables([...tables, positionedTable]);
    setTableNumber(""); // Reset table number after adding
  };

  // Handle table selection
  const handleTableSelect = (tableId: string): void => {
    setSelectedTableId(tableId === selectedTableId ? null : tableId);
  };

  // Handle deselect when clicking on empty canvas
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>): void => {
    if (e.target === e.currentTarget) {
      setSelectedTableId(null);
    }
  };

  // Handle table rotation
  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>): void => {
    const node = e.currentTarget as Konva.Node;
    const id = node.id();

    // Find the table in our state
    const updatedTables = tables.map((table) => {
      if (table.id === id) {
        return {
          ...table,
          rotation: node.rotation(),
          // Maintain position to ensure transformer doesn't move the table
          x: node.x(),
          y: node.y(),
        };
      }
      return table;
    });

    setTables(updatedTables);
  };

  // Handle table drag
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>): void => {
    const node = e.target as Konva.Node;
    const id = node.id();

    // Get the current properties of the dragged table
    const draggedTable = tables.find((table) => table.id === id);
    if (!draggedTable) return;

    // Create a temporary table object with the new position
    const newPosition = {
      ...draggedTable,
      x: node.x(),
      y: node.y(),
    };

    // Check if this new position would overlap with any other table
    const wouldOverlap = tables.some(
      (table) => table.id !== id && tablesOverlap(newPosition, table)
    );

    if (wouldOverlap) {
      // Revert to original position if there would be an overlap
      node.position({
        x: draggedTable.x,
        y: draggedTable.y,
      });
      return;
    }

    // Update the position if no overlap
    const updatedTables = tables.map((table) => {
      if (table.id === id) {
        return newPosition;
      }
      return table;
    });

    setTables(updatedTables);
  };

  // Delete selected table
  const deleteSelectedTable = (): void => {
    if (!selectedTableId) return;

    const updatedTables = tables.filter(
      (table) => table.id !== selectedTableId
    );
    setTables(updatedTables);
    setSelectedTableId(null);
  };

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current!;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition()!;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let direction = e.evt.deltaY > 0 ? 1 : -1;

    if (e.evt.ctrlKey) {
      direction = -direction;
    }

    const scaleBy = 1.1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center p-4 gap-4 bg-gray-100">
        <div className="flex items-center gap-2">
          <label htmlFor="seats">People per table:</label>
          <select
            id="seats"
            value={seatsForNewTable}
            onChange={(e) => setSeatsForNewTable(Number(e.target.value))}
            className="p-2 border border-gray-300 rounded"
          >
            {[2, 4, 6, 8, 10, 12].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="tableNumber">Number of table:</label>
          <input
            id="tableNumber"
            type="number"
            value={tableNumber}
            onChange={(e) => {
              setTableNumber(e.target.value);
            }}
            className="p-2 border border-gray-300 rounded"
          />
        </div>
        <button
          onClick={addTable}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Table
        </button>
        <button
          onClick={deleteSelectedTable}
          disabled={selectedTableId === null}
          className={`px-4 py-2 rounded ${
            selectedTableId
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Delete Table
        </button>
        <button
          onClick={() => localStorage.setItem("tables", JSON.stringify(tables))}
          className={`px-4 py-2 rounded bg-green-500 text-white cursor-pointer`}
        >
          Save
        </button>
      </div>

      <div
        className="w-3/4 h-[400px] border-2 border-gray-200 m-10"
        ref={divRef}
      >
        {dimensions.width > 0 && dimensions.height > 0 && (
          <Stage
            width={dimensions.width}
            height={dimensions.height}
            onClick={handleStageClick}
            ref={stageRef}
            onWheel={handleWheel}
            draggable
            scale={{
              x: window.innerWidth * 0.001 > 1 ? 1 : window.innerWidth * 0.001,
              y: window.innerWidth * 0.001 > 1 ? 1 : window.innerWidth * 0.001,
            }}
          >
            <Layer>
              {tables.map((table) => (
                <Group
                  key={table.id}
                  id={table.id}
                  x={table.x}
                  y={table.y}
                  rotation={table.rotation}
                  draggable
                  onClick={() => handleTableSelect(table.id)}
                  onTap={() => handleTableSelect(table.id)}
                  onDragEnd={handleDragEnd}
                  onTransformEnd={handleTransformEnd}
                >
                  <Rect
                    width={table.width}
                    height={table.height}
                    strokeWidth={table.id === selectedTableId ? 2 : 1}
                    stroke="black"
                    cornerRadius={5}
                  />
                  <Text
                    text={`Table: ${table.number} Seats: ${table.seats}`}
                    fontSize={14}
                    fill="black"
                    width={table.width}
                    height={table.height}
                    align="center"
                    verticalAlign="middle"
                  />
                </Group>
              ))}

              <Transformer
                ref={transformerRef}
                resizeEnabled={false}
                rotateEnabled={true}
                borderEnabled={true}
                keepRatio={false}
                enabledAnchors={[]}
                rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
              />
            </Layer>
          </Stage>
        )}
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(CanvasMy), { ssr: false });
