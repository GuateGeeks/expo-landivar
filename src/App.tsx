import "./App.css";

const baseUrl = import.meta.env.BASE_URL;

interface DemoCard {
  title: string;
  href: string;
  description: string;
  marker: string;
  tech: string;
}

const arExperiments: DemoCard[] = [
  {
    title: "AR.js — Marker Tracking",
    href: `${baseUrl}arjs.html`,
    description:
      "Uses AR.js with A-Frame to detect a Hiro marker and display a rotating 3D box. Marker-based tracking is lightweight and works well on low-end devices.",
    marker: "Hiro marker (printed or on-screen)",
    tech: "A-Frame 1.6.0 + AR.js 3.4.7",
  },
  {
    title: "MindAR — Image Tracking",
    href: `${baseUrl}mindar.html`,
    description:
      "Uses MindAR with A-Frame to detect a card image and overlay a 3D model. Image tracking uses computer vision to recognize natural images without special markers.",
    marker: "MindAR card image",
    tech: "A-Frame 1.6.0 + MindAR 1.2.5",
  },
];

const mlExperiments: DemoCard[] = [
  {
    title: "MediaPipe Vision",
    href: `${baseUrl}mediapipe.html`,
    description:
      "8 real-time AI vision tasks: face detection, face mesh, hand tracking, gesture recognition, pose detection, object detection, image classification, and segmentation — all running in the browser via WebAssembly.",
    marker: "Live camera feed",
    tech: "MediaPipe Tasks-Vision 0.10.32 + WASM",
  },
];

const liveTools: DemoCard[] = [
  {
    title: "Control Center",
    href: `${baseUrl}control-center.html`,
    description:
      "View all connected publishers in real-time. Each publisher runs MediaPipe locally and broadcasts their canvas (video + AI overlay) via WebRTC to this centralized viewer.",
    marker: "WebRTC streams from publishers",
    tech: "WebRTC P2P + WebSocket Signaling",
  },
];

function DemoSection({ title, demos }: { title: string; demos: DemoCard[] }) {
  return (
    <section>
      <h2 className="section-title">{title}</h2>
      <div className="card-grid">
        {demos.map((demo) => (
          <a key={demo.href} href={demo.href} className="experiment-card">
            <h3>{demo.title}</h3>
            <p>{demo.description}</p>
            <dl>
              <dt>Input</dt>
              <dd>{demo.marker}</dd>
              <dt>Stack</dt>
              <dd>{demo.tech}</dd>
            </dl>
          </a>
        ))}
      </div>
    </section>
  );
}

function App() {
  return (
    <div className="app-shell">
      <header className="hero">
        <p className="hero-kicker">GuateGeeks Expo</p>
        <h1 className="hero-title">Interactive Demo Lab</h1>
        <p className="hero-subtitle">
          Interactive augmented reality and AI vision demos. Each opens a
          camera-based experience. Requires HTTPS or localhost.
        </p>
      </header>

      <DemoSection title="🤖 Machine Learning" demos={mlExperiments} />
      <DemoSection title="🎛️ Live Tools" demos={liveTools} />
      <DemoSection title="📱 Augmented Reality" demos={arExperiments} />
    </div>
  );
}

export default App;
