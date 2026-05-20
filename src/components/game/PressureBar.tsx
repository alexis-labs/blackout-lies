type PressureBarProps = {
  pressureLevel: number;
};

const PRESSURE_STEPS = 5;

const pressureLabels = [
  "Cold",
  "Warm",
  "Hot",
  "Cracking",
  "Spilling",
];

function getPressureStep(pressureLevel: number) {
  return Math.min(PRESSURE_STEPS, Math.floor(pressureLevel / 20) + 1);
}

export function PressureBar({ pressureLevel }: PressureBarProps) {
  const activeStep = getPressureStep(pressureLevel);
  const pressureLabel = pressureLabels[Math.max(0, activeStep - 1)] ?? "Cold";

  return (
    <aside
      className={`pressure-bar pressure-level-${activeStep}`}
      aria-label={`Pressure level ${activeStep} of ${PRESSURE_STEPS}: ${pressureLabel}`}
    >
      <span className="pressure-bar-label">PRESSURE</span>
      <div className="pressure-pips" aria-hidden="true">
        {Array.from({ length: PRESSURE_STEPS }, (_, index) => {
          const pipLevel = index + 1;

          return (
            <span
              key={pipLevel}
              className={pipLevel <= activeStep ? "active" : ""}
            />
          );
        })}
      </div>
      <span className="pressure-bar-status">{pressureLabel}</span>
    </aside>
  );
}
