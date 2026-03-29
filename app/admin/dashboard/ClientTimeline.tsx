"use client";

// 93-day timeline visualization
// Cycle 1 (21j): or-sacre #B8821E
// Break 1 (10j): or-pale #E8D5A8
// Cycle 2 (21j): ambre-vif #D4A042
// Break 2 (10j): or-pale #E8D5A8
// Cycle 3 (21j): brun-mid #6B4423
// Break 3 (10j): or-pale #E8D5A8

const PHASES = [
  { name: "C1", days: 21, color: "#B8821E" },
  { name: "B1", days: 10, color: "#E8D5A8" },
  { name: "C2", days: 21, color: "#D4A042" },
  { name: "B2", days: 10, color: "#E8D5A8" },
  { name: "C3", days: 21, color: "#6B4423" },
  { name: "B3", days: 10, color: "#E8D5A8" },
];

const TOTAL = 93;

export default function ClientTimeline({ dayNumber }: { dayNumber: number }) {
  return (
    <div className="w-full">
      <div className="flex h-3 rounded-full overflow-hidden bg-creme-sacree">
        {PHASES.map((phase, i) => {
          const width = (phase.days / TOTAL) * 100;
          return (
            <div
              key={i}
              className="relative h-full"
              style={{ width: `${width}%`, backgroundColor: phase.color, opacity: 0.4 }}
              title={`${phase.name} — ${phase.days}j`}
            />
          );
        })}
      </div>
      {/* Current position marker */}
      <div className="relative h-0" style={{ marginTop: "-14px" }}>
        <div
          className="absolute w-2 h-4 rounded-full bg-red-500 border border-white shadow-sm"
          style={{
            left: `${Math.min((dayNumber / TOTAL) * 100, 100)}%`,
            transform: "translateX(-50%)",
          }}
          title={`Day ${dayNumber}`}
        />
      </div>
      {/* Phase labels */}
      <div className="flex mt-2">
        {PHASES.map((phase, i) => (
          <div
            key={i}
            className="text-center"
            style={{ width: `${(phase.days / TOTAL) * 100}%` }}
          >
            <span className="text-[8px] font-ui text-brun-mid/50">{phase.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
