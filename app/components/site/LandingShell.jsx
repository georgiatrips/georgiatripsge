import Navbar from "../Navbar";
import Footer from "../Footer";
import "../../landing.css";

// Site chrome for the SEO landing pages. Without it those pages were dead
// ends: no menu, no footer, no path to the tours or the booking form. The
// landing hero is light, so the bar renders solid from the first paint.
export default function LandingShell({ active = "tours", jsonLd, children }) {
  return (
    <>
      <Navbar active={active} overlay={false} />
      <main className="landing-container">
        {jsonLd ? (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        ) : null}
        {children}
      </main>
      <Footer />
    </>
  );
}
