import './App.css'

const arExperiments = [
  {
    title: 'AR.js — Marker Tracking',
    href: '/arjs.html',
    description:
      'Uses AR.js with A-Frame to detect a Hiro marker and display a rotating 3D box. Marker-based tracking is lightweight and works well on low-end devices.',
    marker: 'Hiro marker (printed or on-screen)',
    tech: 'A-Frame 1.6.0 + AR.js 3.4.7',
  },
  {
    title: 'MindAR — Image Tracking',
    href: '/mindar.html',
    description:
      'Uses MindAR with A-Frame to detect a card image and overlay a 3D model. Image tracking uses computer vision to recognize natural images without special markers.',
    marker: 'MindAR card image',
    tech: 'A-Frame 1.6.0 + MindAR 1.2.5',
  },
] as const

function App() {
  return (
    <>
      <h1>AR Experiments</h1>
      <p className="read-the-docs">
        Select an augmented reality demo to launch. Each opens a standalone
        camera experience. Requires HTTPS or localhost.
      </p>

      <div className="card-grid">
        {arExperiments.map((experiment) => (
          <a
            key={experiment.href}
            href={experiment.href}
            className="experiment-card"
          >
            <h2>{experiment.title}</h2>
            <p>{experiment.description}</p>
            <dl>
              <dt>Target</dt>
              <dd>{experiment.marker}</dd>
              <dt>Stack</dt>
              <dd>{experiment.tech}</dd>
            </dl>
          </a>
        ))}
      </div>
    </>
  )
}

export default App
