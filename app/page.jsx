"use client";

import { useRef, useEffect, useState, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/* ─────────────────────────────────────────────
   FONTS
───────────────────────────────────────────── */
const FontLoader = () => {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Mono:wght@300;400;500&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);
  return null;
};

/* ─────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────── */
const GlobalStyles = () => {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body {
        background: #05070E;
        color: #F1E9D8;
        font-family: 'DM Mono', monospace;
        overflow-x: hidden;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      ::selection { background: #CBB995; color: #05070E; }
      ::-webkit-scrollbar { width: 2px; }
      ::-webkit-scrollbar-track { background: #05070E; }
      ::-webkit-scrollbar-thumb { background: #182231; border-radius: 1px; }

      .playfair {
        font-family: 'Playfair Display', Georgia, serif;
        text-rendering: optimizeLegibility;
        font-kerning: normal;
        font-feature-settings: "kern";
      }

      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(24px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes arrowBounce {
        0%, 100% { transform: translateY(0); }
        50%       { transform: translateY(6px); }
      }
      @keyframes barGrow {
        from { transform: scaleX(0); }
        to   { transform: scaleX(1); }
      }

      .hero-line { animation: fadeInUp 0.9s cubic-bezier(.16,1,.3,1) both; }
      .hero-line:nth-child(1) { animation-delay: 0.1s; }
      .hero-line:nth-child(2) { animation-delay: 0.25s; }
      .hero-sub  { animation: fadeInUp 0.9s cubic-bezier(.16,1,.3,1) 0.45s both; }
      .hero-btns { animation: fadeInUp 0.9s cubic-bezier(.16,1,.3,1) 0.6s both; }
      .arrow-anim { animation: arrowBounce 2s ease-in-out infinite; }
      .t-fix { margin-right: 0.05em; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
};

/* ─────────────────────────────────────────────
   SCROLL STATE (no React re-renders)
───────────────────────────────────────────── */
const scrollState = { progress: 0 };

/* ─────────────────────────────────────────────
   3D MODEL
───────────────────────────────────────────── */
function Model() {
  const ref = useRef();
  const { scene } = useGLTF("/models/time-money.glb");

  const cloned = useMemo(() => {
    const c = scene.clone(true);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#ddd8cc"),
      roughness: 0.48,
      metalness: 0.08,
    });
    c.traverse((n) => {
      if (n.isMesh) {
        n.material = mat;
        n.castShadow = true;
      }
    });

    // center by bounding box
    const box = new THREE.Box3().setFromObject(c);
    const center = new THREE.Vector3();
    box.getCenter(center);
    c.position.sub(center);

    // scale to fit
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.2 / maxDim;
    c.scale.setScalar(scale);

    return c;
  }, [scene]);

  const currentRot = useRef({ x: -0.04, y: 3.15, z: 3.15 });
  const targetRot = useRef({ x: -0.04, y: 3.15, z: 3.15 });

  useFrame(() => {
    if (!ref.current) return;
    const p = scrollState.progress;
    const delay = 0.08; // ← modifica questo valore (0.0 = nessun delay, 0.15 = delay maggiore)
    const clampedP = Math.min(Math.max(p - delay, 0) / (0.82 - delay), 1);
    targetRot.current.y = 3.15 - clampedP * (Math.PI / 2);

    currentRot.current.x += (targetRot.current.x - currentRot.current.x) * 0.06;
    currentRot.current.y += (targetRot.current.y - currentRot.current.y) * 0.06;
    currentRot.current.z += (targetRot.current.z - currentRot.current.z) * 0.06;

    ref.current.rotation.x = currentRot.current.x;
    ref.current.rotation.y = currentRot.current.y;
    ref.current.rotation.z = currentRot.current.z;
  });

  return <primitive ref={ref} object={cloned} />;
}

/* ─────────────────────────────────────────────
   PROGRESS BAR UI (DOM overlay, no re-renders)
───────────────────────────────────────────── */
function ProgressOverlay({ containerRef }) {
  const barRef = useRef();
  const dollarRef = useRef();
  const timeRef = useRef();
  const hintRef = useRef();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      const rect = container.getBoundingClientRect();
      const total = container.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / total));
      scrollState.progress = p;

      if (barRef.current)    barRef.current.style.transform = `scaleX(${p})`;
      if (dollarRef.current) dollarRef.current.style.opacity = 1 - p * 2;
      if (timeRef.current)   timeRef.current.style.opacity  = p * 2;
      if (hintRef.current)   hintRef.current.style.opacity  = Math.max(0, 1 - p * 8);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [containerRef]);

  return (
    <div style={{
      position: "absolute",
      bottom: 40,
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
      zIndex: 10,
      pointerEvents: "none",
      userSelect: "none",
    }}>
      <div ref={hintRef} style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 9,
        letterSpacing: "0.3em",
        color: "#3F4D61",
        textTransform: "uppercase",
        transition: "opacity 0.3s",
      }}>
        Scroll to Reveal
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span ref={dollarRef} style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.2em",
          color: "#CBB995",
          transition: "opacity 0.1s",
        }}>$</span>

        <div style={{ width: 120, height: 1, background: "#182231", position: "relative", overflow: "hidden" }}>
          <div ref={barRef} style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, #3F4D61, #CBB995)",
            transformOrigin: "left",
            transform: "scaleX(0)",
          }} />
        </div>

        <span ref={timeRef} style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.2em",
          color: "#CBB995",
          opacity: 0,
          transition: "opacity 0.1s",
        }}>TIME</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCENE
───────────────────────────────────────────── */
function Scene() {
  return (
    <>
      <color attach="background" args={["#05070E"]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 3]} intensity={1.4} color="#ffe8cc" />
      <directionalLight position={[-5, 2, -2]} intensity={0.5} color="#c0d8ff" />
      <pointLight position={[0, -3, -4]} intensity={0.3} color="#8899bb" />
      <Suspense fallback={null}>
        <Model />
      </Suspense>
    </>
  );
}

/* ─────────────────────────────────────────────
   NAV
───────────────────────────────────────────── */
function Nav() {
  return (
    <nav style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 40px",
      height: 64,
      background: "rgba(5,7,14,0.75)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(24,34,49,0.9)",
    }}>
      <span className="playfair" style={{ fontSize: 18, fontWeight: 500, color: "#F1E9D8", letterSpacing: "0.02em" }}>
        WorkLife
      </span>
      <button
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.15em",
          color: "#05070E",
          background: "#CBB995",
          padding: "10px 22px",
        border: "none",
          textTransform: "uppercase",
          transition: "background 0.2s",
          cursor: "pointer",
        }}
        onMouseEnter={e => e.target.style.background = "#E5D8BE"}
      onMouseLeave={e => e.target.style.background = "#CBB995"}
        onClick={() => {
        // 1. Mostra il messaggio a schermo
        alert("Per usare WorkLife, clicca su 'Aggiungi' nella pagina del Chrome Web Store che si sta per aprire!");
    
        // 2. Apre il link del Chrome Web Store in una nuova scheda
        window.open(
          "https://chromewebstore.google.com/detail/worklife-price-%E2%80%94-prices-i/enlngmnmlgalaomedhiijdepfkcnljpa?hl=it&utm_source=ext_sidebar", 
          "_blank"
        );
        }}
        >
          INSTALL
        </button>
      </nav>
  );
}

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{
      position: "relative",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      paddingTop: 64,
    }}>
      {/* radial gradient */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(200,184,152,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      {/* grid */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `linear-gradient(rgba(24,34,49,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(24,34,49,0.16) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", textAlign: "center", maxWidth: "900px", margin: "0 auto", padding: "0 24px" }}>
        <h1 className="playfair hero-line" style={{
          fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
          fontWeight: 400,
          lineHeight: 1.15,
          letterSpacing: "-0.01em",
          color: "#F1E9D8",
          marginBottom: 0,
        }}>
          Money is abstract.
        </h1>
        <h1 className="playfair hero-line" style={{
          fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
          fontWeight: 400,
          fontStyle: "italic",
          lineHeight: 1.15,
          letterSpacing: "-0.01em",
          color: "#F1E9D8",
          marginBottom: 40,
          textShadow: "0 0 32px rgba(143,183,217,0.12)",
        }}>
          <span className="t-fix">T</span>ime is real.
        </h1>

        <p className="hero-sub" style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "clamp(0.85rem, 1.2vw, 1rem)",
          color: "#6A7A8C",
          lineHeight: 1.8,
          letterSpacing: "0.04em",
          maxWidth: 520,
          margin: "0 auto 44px",
        }}>
          Behind every price, there is human time.<br />
          WorkLife translates money into its real unit: time.
        </p>

        <div className="hero-btns" style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap", marginTop: "0", marginBottom: "0" }}>
          <a href="#install" style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#05070E",
            background: "#CBB995",
            padding: "14px 32px",
            textDecoration: "none",
            transition: "background 0.2s",
          }}
            onMouseEnter={e => e.target.style.background = "#E5D8BE"}
            onMouseLeave={e => e.target.style.background = "#CBB995"}
          >
            See the real price
          </a>
          <a href="#how" style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#6A7A8C",
            border: "1px solid #3F4D61",
            padding: "14px 32px",
            textDecoration: "none",
            transition: "color 0.2s, border-color 0.2s",
          }}
            onMouseEnter={e => { e.target.style.color = "#F1E9D8"; e.target.style.borderColor = "#6A7A8C"; }}
            onMouseLeave={e => { e.target.style.color = "#6A7A8C"; e.target.style.borderColor = "#3F4D61"; }}
          >
            See how it works
          </a>
        </div>
      </div>

      <div className="arrow-anim" style={{
        position: "absolute",
        bottom: 36,
        left: "50%",
        transform: "translateX(-50%)",
        color: "#3F4D61",
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10l6 6 6-6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   PINNED 3D SCENE
───────────────────────────────────────────── */
function PinnedScene() {
  const containerRef = useRef();

  return (
    <div ref={containerRef} style={{ position: "relative", height: "330vh" }}>
      <div style={{
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "hidden",
      }}>
        <Canvas
          camera={{ position: [0, 0.3, 5], fov: 40 }}
          dpr={[1, 2]}
          style={{ position: "absolute", inset: 0 }}
          gl={{ antialias: true, alpha: false }}
        >
          <Scene />
        </Canvas>
        <ProgressOverlay containerRef={containerRef} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   WHY SECTION
───────────────────────────────────────────── */
function WhySection() {
  const items = [
    { num: "01", title: "Money distorts reality", body: "Prices feel abstract because they don't connect to anything visceral. A $200 jacket is just a number — until you see it's 4 hours of your life." },
    { num: "02", title: "Time is universal", body: "Unlike money, time is the same for everyone. One hour is one hour. It is the only truly fair unit of value we all share." },
    { num: "03", title: "Prices hide their true cost", body: "Every purchase decision is really a decision about your finite time on Earth. WorkLife makes that cost visible, quietly, everywhere you shop." },
  ];

  return (
    <section id="why" style={{
      padding: "120px 40px",
      maxWidth: 1100,
      margin: "0 auto",
    }}>
      <div style={{ marginBottom: 80 }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.3em", color: "#4B596B", textTransform: "uppercase", marginBottom: 20 }}>
          Philosophy
        </p>
        <h2 className="playfair" style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 400, color: "#F1E9D8", lineHeight: 1.1 }}>
          Why I built this.
        </h2>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 0,
        borderTop: "1px solid #182231",
      }}>
        {items.map((item, i) => (
          <div key={i} style={{
            padding: "48px 40px 48px 0",
            borderRight: i < items.length - 1 ? "1px solid #182231" : "none",
            paddingRight: i < items.length - 1 ? 40 : 0,
            paddingLeft: i > 0 ? 40 : 0,
          }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#4B596B", letterSpacing: "0.2em", marginBottom: 24 }}>
              {item.num}
            </p>
            <h3 className="playfair" style={{ fontSize: 24, fontWeight: 400, color: "#F1E9D8", marginBottom: 20, lineHeight: 1.3 }}>
              {item.title}
            </h3>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, color: "#7A8898", lineHeight: 1.9, letterSpacing: "0.02em" }}>
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   HOW SECTION
───────────────────────────────────────────── */
function HowSection() {
  const steps = [
    { num: "I",   title: "Install",           body: "Add WorkLife to Chrome in one click. No account required." },
    { num: "II",  title: "Set your income",   body: "Enter your hourly rate or annual salary. We calculate the rest." },
    { num: "III", title: "Browse",            body: "Shop anywhere online. WorkLife quietly overlays time equivalents on every price." },
    { num: "IV",  title: "Decide",            body: "Is that purchase worth 3 hours of your life? Now you can answer that honestly." },
  ];

  return (
    <section id="how" style={{
      padding: "120px 40px",
      borderTop: "1px solid #182231",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 80 }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.3em", color: "#4B596B", textTransform: "uppercase", marginBottom: 20 }}>
            How it works
          </p>
          <h2 className="playfair" style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 400, color: "#F1E9D8", lineHeight: 1.1 }}>
            Four steps.<br />One shift in perspective.
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 48,
              padding: "40px 0",
              borderBottom: "1px solid #182231",
            }}>
              <span className="playfair" style={{
                fontSize: "clamp(28px, 4vw, 48px)",
                fontStyle: "italic",
                color: "#3F4D61",
                minWidth: 60,
                lineHeight: 1,
              }}>
                {step.num}
              </span>
              <div>
                <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", color: "#CBB995", marginBottom: 12 }}>
                  {step.title}
                </h3>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, color: "#7A8898", lineHeight: 1.9, maxWidth: 480 }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   INSTALL CTA
───────────────────────────────────────────── */
function InstallSection() {
  return (
    <section id="install" style={{
      position: "relative",
      minHeight: "100vh",
      padding: "40px",
      overflow: "hidden",
      textAlign: "center",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(200,184,152,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `linear-gradient(rgba(24,34,49,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(24,34,49,0.16) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
        <h2 className="playfair" style={{
          fontSize: "clamp(52px, 8vw, 96px)",
          fontWeight: 400,
          lineHeight: 1.05,
          color: "#F1E9D8",
          marginBottom: 40,
        }}>
          Your time<br /><em>has a price.</em>
        </h2>
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 15,
          color: "#7A8898",
          lineHeight: 1.9,
          letterSpacing: "0.04em",
          marginBottom: 56,
        }}>
          Join thousands who have already changed<br />
          how they think about spending.
        </p>
        <button
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 12,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: "#05070E",
        background: "#CBB995",
        padding: "18px 48px",
        textDecoration: "none",
        display: "inline-block",
        border: "none",
        transition: "background 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={e => e.target.style.background = "#E5D8BE"}
      onMouseLeave={e => e.target.style.background = "#CBB995"}
      onClick={() => {
        alert("Per usare WorkLife, clicca su 'Aggiungi' nella pagina del Chrome Web Store che si sta per aprire!");
        window.open(
          "https://chromewebstore.google.com/detail/worklife-price-%E2%80%94-prices-i/enlngmnmlgalaomedhiijdepfkcnljpa?hl=it&utm_source=ext_sidebar", 
          "_blank"
        );
      }}
    >
      ENTER WORKLIFE
    </button>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────── */
function Footer({ setModalContent }) {
  return (
    <footer style={{
      borderTop: "1px solid #182231",
      padding: "32px 40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 20,
    }}>
      <span className="playfair" style={{ fontSize: 16, fontWeight: 400, color: "#F1E9D8" }}>WorkLife</span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#3F4D61", letterSpacing: "0.1em" }}>
        © 2026 · Money is abstract. Time is real.
      </span>
      <div style={{ display: "flex", gap: 32 }}>
        {["Privacy", "Terms", "GitHub"].map((link) => (
          <a
            key={link}
            href={link === 'GitHub' ? 'https://github.com/Gabri126/worklife-site' : '#'}
            {...(link === 'GitHub' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: "#6A7A8C",
              textDecoration: "none",
              letterSpacing: "0.1em",
              transition: "color 0.2s",
            }}
            onClick={link === 'GitHub' ? undefined : (e) => {
              e.preventDefault();
              setModalContent(link.toLowerCase());
            }}
            onMouseEnter={e => e.target.style.color = "#CBB995"}
            onMouseLeave={e => e.target.style.color = "#6A7A8C"}
          >
            {link}
          </a>
        ))}
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
export default function WorkLifePage() {
  const [modalContent, setModalContent] = useState(null);

  const modalData = {
    privacy: {
      title: "Privacy Policy",
      body: "WorkLife respects your privacy. The extension does not collect, store, or transmit any personal data or browsing history. All salary-to-time conversions happen exclusively locally within your browser environment.",
    },
    terms: {
      title: "Terms of Service",
      body: "Terms of Service: The WorkLife extension is a free utility tool provided 'as is'. The developer assumes no responsibility or liability for any calculation discrepancies, errors, or misuse of the tool, which is built solely for personal financial awareness.",
    },
  };

  return (
    <>
      <FontLoader />
      <GlobalStyles />
      <Nav />
      <main>
        <Hero />
        <PinnedScene />
        <WhySection />
        <HowSection />
        <InstallSection />
      </main>

      {modalContent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(5, 7, 14, 0.82)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          padding: 24,
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 640,
            background: '#0B1120',
            border: '1px solid rgba(203, 185, 149, 0.16)',
            boxShadow: '0 32px 80px rgba(0, 0, 0, 0.35)',
            padding: '40px 40px 32px',
            borderRadius: 24,
          }}>
            <button
              type="button"
              onClick={() => setModalContent(null)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#05070E',
                background: '#CBB995',
                border: 'none',
                padding: '10px 16px',
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.target.style.background = '#E5D8BE'}
              onMouseLeave={e => e.target.style.background = '#CBB995'}
            >
              Close
            </button>
            <h2 style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: 'clamp(28px, 4vw, 36px)',
              fontWeight: 400,
              color: '#F1E9D8',
              marginBottom: 20,
            }}>
              {modalData[modalContent].title}
            </h2>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 15,
              color: '#BFC7D2',
              lineHeight: 1.9,
              letterSpacing: '0.02em',
              whiteSpace: 'pre-line',
            }}>
              {modalData[modalContent].body}
            </p>
          </div>
        </div>
      )}

      <Footer setModalContent={setModalContent} />
    </>
  );
}
