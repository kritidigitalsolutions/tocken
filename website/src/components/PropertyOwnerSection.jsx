import ownerImg from "../assets/images/chooseus.png";
import Accordion from "./Accordion";
import "./PropertyOwnerSection.css";

export default function PropertyOwnerSection() {
  return (
    <section className="pos-section">
      <div className="pos-container">
        {/* ◀️ LEFT COLUMN */}
        <div className="pos-left">
          {/* ROW 1 — Text block */}
          <div>
            <span className="pos-pill">WHY US?</span>
            <h2 className="pos-heading">
              It's Portal Of
              <br />
              Property Owners
            </h2>
          </div>

          {/* ROW 2 — Composed image */}
          <div className="pos-image-block">
            <img
              src={ownerImg}
              alt="Property Owner"
              className="pos-composed-img"
            />
          </div>
        </div>

        {/* ▶️ RIGHT COLUMN — Accordion */}
        <div className="pos-right">
          <Accordion />
        </div>
      </div>
    </section>
  );
}
