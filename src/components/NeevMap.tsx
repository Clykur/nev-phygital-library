import React, { useState, useEffect } from 'react';
import { Compass, Info, Check, RefreshCw, Layers, Shield, Search, Sparkles } from 'lucide-react';


export const NeevMap: React.FC<any> = ({
  locatedShelfId,
  onClearLocatedShelf,
  books,
  addXp,
  zones
}) => {
  const [selectedZone, setSelectedZone] = useState<any | null>(null);
  const [hoveredShelfId, setHoveredShelfId] = useState<string | null>(null);

  useEffect(() => {
    const target = zones.find((z) => z.id === `shelf-${locatedShelfId}`) || zones[0];
    setSelectedZone(target || null);
  }, [locatedShelfId, zones]);

  // Books present on the active or hovered shelf
  const getBooksForAisle = (aisle?: string) => {
    if (!aisle) return [];
    return books.filter((b) => b.shelfLocation.aisle === aisle);
  };

  const handleZoneClick = (zone: any) => {
    setSelectedZone(zone);
    addXp(15); // Map exploration benefits XP
  };

  // Coordinates mapping path from Reception (54, 78) to Shelves
  // x: percentage, y: percentage representing corners of a clean retro tech grid route
  const getPathForShelf = (shelfId: string | null) => {
    if (!shelfId) return null;
    
    // Default starting node: Reception (54, 78)
    const routes: { [key: string]: { x: number; y: number }[] } = {
      'A': [{ x: 54, y: 78 }, { x: 50, y: 70 }, { x: 32, y: 70 }, { x: 32, y: 19 }], // Science
      'B': [{ x: 54, y: 78 }, { x: 50, y: 70 }, { x: 32, y: 70 }, { x: 32, y: 34 }], // Technology
      'C': [{ x: 54, y: 78 }, { x: 50, y: 70 }, { x: 32, y: 70 }, { x: 32, y: 49 }], // Fiction
      'D': [{ x: 54, y: 78 }, { x: 50, y: 70 }, { x: 67, y: 70 }, { x: 67, y: 19 }], // Philosophy
      'E': [{ x: 54, y: 78 }, { x: 50, y: 70 }, { x: 67, y: 70 }, { x: 67, y: 34 }], // Biography
    };

    return routes[shelfId] || null;
  };

  const activePath = getPathForShelf(locatedShelfId);
  const activeShelfBooks = selectedZone?.aisle ? getBooksForAisle(selectedZone.aisle) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-[20px] duration-500">
      
      {/* 2D Interactive SVG Floor Map Panel */}
      <div className="lg:col-span-2 bg-muted/50/30 border border-border/60 rounded-2xl p-6 flex flex-col justify-between">
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground tracking-tight">Interactive Wayfinder Deck</h2>
            </div>
            {locatedShelfId && (
              <button
                onClick={onClearLocatedShelf}
                className="text-[10px] font-mono px-2 py-0.5 bg-muted border border-border text-primary hover:text-foreground rounded transition animate-pulse"
              >
                ✓ Clear Active Highlight Path
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground/60">Hover or click shelves to view active load cells and physical book holdings.</p>
        </div>

        {/* Visual Map Canvas Grid */}
        <div className="relative w-full aspect-[4/3] bg-[#0c0c0e] border border-border rounded-xl overflow-hidden flex items-center justify-center p-2 group shadow-2xl">
          {/* Grid Blueprint Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.05]" 
            style={{
              backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px), radial-gradient(circle, #3b82f6 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px'
            }}
          ></div>

          {/* Map Vectors Viewport */}
          <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 select-none">
            
            {/* Outline of physical library space walls */}
            <rect x="5" y="5" width="90" height="85" fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" rx="4" />
            
            {/* Decorative layout text markings */}
            <text x="50" y="8" className="text-[3px] font-mono fill-zinc-700 uppercase font-semibold text-center" textAnchor="middle">
              NEEV ARCHIVE ARCHITECTURAL MATRIX (2D DOCK)
            </text>

            <text x="12" y="88" className="text-[2px] font-mono fill-zinc-800">COORDINATE_GRID: v3.2_ACTIVE</text>

            {/* Path Drawing representation */}
            {activePath && (
              <>
                {/* Underglow thickness */}
                <path
                  d={`M ${activePath.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                  fill="none"
                  stroke="rgba(30, 58, 95, 0.2)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Core Neon laser wayfinder path link */}
                <path
                  d={`M ${activePath.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="4 3"
                  className="animate-[dash_8s_linear_infinite]"
                />

                {/* Pulsing Target pointer at destination shelf */}
                <circle
                  cx={activePath[activePath.length - 1].x}
                  cy={activePath[activePath.length - 1].y}
                  r="2.5"
                  fill="#3b82f6"
                  className="animate-ping"
                />
                <circle
                  cx={activePath[activePath.length - 1].x}
                  cy={activePath[activePath.length - 1].y}
                  r="1.2"
                  fill="#3b82f6"
                />
              </>
            )}

            {/* Static Nodes map elements */}
            {zones.map((zone) => {
              const isSelected = selectedZone?.id === zone.id;
              const isHovered = hoveredShelfId === zone.id || zone.id === `shelf-${locatedShelfId}`;
              
              const isShelf = zone.type === 'shelf';
              
              // Color settings based on types and selection state
              let fillColor = 'rgba(24, 24, 27, 0.4)';
              let strokeColor = isHovered ? '#3b82f6' : '#27272a';
              let strokeWidth = isSelected ? '0.8' : isHovered ? '0.6' : '0.4';

              if (zone.type === 'gate') {
                fillColor = 'rgba(79, 70, 229, 0.1)';
                strokeColor = isSelected ? '#6366f1' : '#4f46e5';
              } else if (zone.type === 'kiosk') {
                fillColor = 'rgba(16, 185, 129, 0.08)';
                strokeColor = isSelected ? '#10b981' : '#059669';
              }

              if (isSelected) {
                fillColor = isShelf ? 'rgba(30, 58, 95, 0.15)' : fillColor;
                strokeColor = isShelf ? '#3b82f6' : strokeColor;
              }

              return (
                <g 
                  key={zone.id} 
                  cursor="pointer"
                  onClick={() => handleZoneClick(zone)}
                  onMouseEnter={() => isShelf && setHoveredShelfId(zone.id)}
                  onMouseLeave={() => isShelf && setHoveredShelfId(null)}
                >
                  {/* Outer glowing border anchor for shelves */}
                  {isShelf && isHovered && (
                    <rect
                      x={zone.x - 1}
                      y={zone.y - 1}
                      width={zone.width + 2}
                      height={zone.height + 2}
                      fill="none"
                      stroke="rgba(30, 58, 95, 0.15)"
                      strokeWidth="0.5"
                      rx="1"
                    />
                  )}

                  {/* Rectangle box of element */}
                  <rect
                    x={zone.x}
                    y={zone.y}
                    width={zone.width}
                    height={zone.height}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    rx="1.5"
                    className="transition-all duration-350"
                  />

                  {/* Text labels inside rect */}
                  <text
                    x={zone.x + zone.width / 2}
                    y={zone.y + zone.height / 2 + 1}
                    textAnchor="middle"
                    className="text-[2px] font-mono fill-zinc-300 pointer-events-none tracking-tight leading-none"
                  >
                    {zone.name.split(' ')[0]}
                  </text>

                  {/* Small LED state indicator dot */}
                  <circle
                    cx={zone.x + 2}
                    cy={zone.y + 2}
                    r="0.4"
                    fill={zone.status === 'busy' ? '#eab308' : zone.status === 'alert' ? '#ef4444' : '#22c55e'}
                  />
                </g>
              );
            })}

            {/* Static Labels (Lounge / Reading Pods / Entry) */}
            <text x="14" y="65" className="text-[2px] font-mono fill-zinc-700">STUDY PODS [RFID SHIELDED]</text>
            <rect x="8" y="58" width="12" height="12" fill="none" stroke="#18181b" strokeWidth="0.3" rx="1" />
            
            <text x="88" y="65" className="text-[2px] font-mono fill-zinc-700" textAnchor="end">CO-WORKING LAB</text>
            <rect x="78" y="58" width="14" height="12" fill="none" stroke="#18181b" strokeWidth="0.3" rx="1" />
            
            <text x="50" y="93" className="text-[1.8px] font-mono fill-zinc-650" textAnchor="middle">MAIN PASSIVE CORRIDOR SECURE GATEWAY (IN/OUT)</text>
          </svg>
        </div>
      </div>

      {/* Selected Node Shelf / Zone Holdings Details panel */}
      <div className="lg:col-span-1 flex flex-col justify-between">
        {selectedZone ? (
          <div className="bg-muted/50/30 border border-border/60 rounded-2xl p-6 h-full flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              
              {/* Node meta properties */}
              <div>
                <span className="text-[10px] uppercase font-mono bg-primary/10 border border-blue-900/40 text-primary px-2 py-0.5 rounded-md">
                  Active Coordinates: {selectedZone.x}X , {selectedZone.y}Y
                </span>
                
                <h3 className="text-base font-bold text-foreground mt-2.5 tracking-tight border-b border-border/60/80 pb-2 flex items-center justify-between">
                  <span>{selectedZone.name}</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    selectedZone.status === 'busy' ? 'bg-accent' : selectedZone.status === 'alert' ? 'bg-destructive' : 'bg-success'
                  }`} title={`Status: ${selectedZone.status}`} />
                </h3>
              </div>

              {/* Functional description */}
              <p className="text-xs text-muted-foreground leading-normal font-light bg-black/40 p-3 rounded-xl border border-border">
                {selectedZone.details}
              </p>

              {/* Dynamic Shelf Books list */}
              {selectedZone.type === 'shelf' ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-3.5 h-3.5 text-primary hover:rotate-18 hover:text-foreground transition" />
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Sensors Rack Holdings ({activeShelfBooks.length})</h4>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {activeShelfBooks.map((book) => (
                      <div 
                        key={book.id}
                        className="p-3 bg-muted/50/50 hover:bg-muted/50/80 rounded-xl border border-border flex items-center justify-between group transition duration-200"
                      >
                        <div className="min-w-0 pr-2">
                          <h5 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{book.title}</h5>
                          <p className="text-[10px] text-muted-foreground/60 truncate">By {book.author}</p>
                        </div>
                        
                        <div className="text-right shrink-0">
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                            book.physicalCopiesAvailable > 0
                              ? 'text-secondary bg-emerald-950/20 border-emerald-900/40'
                              : 'text-destructive bg-red-950/20 border-red-900/40'
                          }`}>
                            Row {book.shelfLocation.row}
                          </span>
                        </div>
                      </div>
                    ))}

                    {activeShelfBooks.length === 0 && (
                      <p className="text-xs text-zinc-650 italic text-center py-4 bg-muted/50/50 rounded-xl">This shelf doesn't hold any book currently.</p>
                    )}
                  </div>
                </div>
              ) : (
                /* Hardware diagnostic details for gates/kiosks */
                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono font-semibold">Gateway Diagnostic Feed</h4>
                  </div>
                  
                  <div className="bg-background p-3 rounded-xl border border-border space-y-2 font-mono text-[10px] text-muted-foreground">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hardware UUID:</span>
                      <span>neev-{selectedZone.id}-77AX</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">NFE Frequency:</span>
                      <span>865.6 MHz - 867.6 MHz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gateways Protocol:</span>
                      <span>EPC Class 1 Gen 2 / ISO 18000-6C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">NFC Deck Range:</span>
                      <span>0.0m - 4.5m active grid</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Simulated Shelf Wayfinding route highlight banner */}
            {locatedShelfId && zones.find(z => z.aisle === locatedShelfId)?.id === selectedZone.id && (
              <div className="bg-gradient-to-r from-blue-950 to-indigo-950 p-4 border border-blue-800/60 rounded-xl space-y-2 text-muted-foreground flex items-center space-x-2 relative overflow-hidden animate-pulse">
                <Sparkles className="w-5 h-5 text-primary shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-foreground uppercase tracking-tight font-mono">Target Route Active</p>
                  <p className="text-muted-foreground text-[10px] mt-0.5">Physical pathway is illuminated inside {selectedZone.name.split(' ')[0]}. Follow shelf markers.</p>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="bg-muted/50/10 border border-border/60 rounded-2xl p-6 text-center text-muted-foreground/60 h-full flex flex-col justify-center">
            <Compass className="w-10 h-10 text-zinc-750 mx-auto mb-3" />
            <p className="text-xs">Select any zone on the floor map to load live diagnostic sensors feed and metrics.</p>
          </div>
        )}
      </div>

    </div>
  );
};
