type StartScreenProps = {
  onStart: () => void;
};

const START_BACKGROUND_URL = "/assets/start/start-background.png";

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <main className="start-screen">
      <div
        className="start-screen-background"
        aria-hidden="true"
        style={{
          backgroundImage: `url("${START_BACKGROUND_URL}")`,
        }}
      />

      <section className="start-screen-panel" aria-label="Game start">
        <button
          className="start-screen-button"
          type="button"
          onClick={onStart}
        >
          Start
        </button>
      </section>
    </main>
  );
}
