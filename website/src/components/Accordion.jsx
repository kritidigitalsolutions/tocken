import { useState } from "react";

const PersonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="#E53935" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const items = [
  {
    title: "Direct Owner-To-Buyer Connection",
    body: "Skip the middlemen! TOCKEN connects property buyers directly with owners — making deals faster, simpler, and more transparent.",
  },
  {
    title: "All-In-One Real Estate Platform",
    body: "Manage listings, connect with buyers, and track your properties — all from one powerful platform built for modern real estate.",
  },
  {
    title: "Affordable Listing Plans",
    body: "Get your property listed at unbeatable prices. TOCKEN offers flexible plans designed for individual owners alike.",
  },
];

export default function Accordion() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div style={{ display:"flex", flexDirection:"column",
      gap:"14px", maxWidth:"560px", width:"100%" }}>

      {items.map((item, index) => {
        const isActive = activeIndex === index;
        return (
          <div key={index} onClick={() => setActiveIndex(index)}
            style={{
              borderRadius: "18px",
              border: "1px solid #E8E8EE",
              overflow: "hidden",
              cursor: "pointer",
              background: "#FFFFFF",
              boxShadow: isActive
                ? "0 4px 20px rgba(0,0,0,0.07)"
                : "0 1px 4px rgba(0,0,0,0.04)",
            }}>

            {/* HEADER ROW */}
            <div style={{
              display:"flex", alignItems:"center",
              gap:"14px", padding:"20px 24px",
              background: isActive ? "#FFFFFF" : "#F2F2F5",
              transition: "background 0.25s ease",
            }}>

              {/* Icon Circle */}
              <div style={{
                width:"36px", height:"36px",
                borderRadius:"50%", background:"#FFE8E8",
                display:"flex", alignItems:"center",
                justifyContent:"center", flexShrink:0,
              }}>
                <PersonIcon />
              </div>

              {/* Title */}
              <span style={{
                fontSize:"15px",
                fontWeight: isActive ? 700 : 600,
                color: isActive ? "#1E3A5F" : "#1A1A1A",
                fontFamily:"'Inter', sans-serif",
                transition:"color 0.25s ease",
              }}>
                {item.title}
              </span>
            </div>

            {/* Body */}
            <div style={{
              maxHeight: isActive ? "200px" : "0px",
              opacity: isActive ? 1 : 0,
              overflow:"hidden",
              background: "#FFFFFF",
              transition:"max-height 0.35s ease, opacity 0.3s ease",
            }}>
              <p style={{
                margin:0,
                padding:"4px 24px 22px 74px",
                fontSize:"14px",
                color:"#888888",
                lineHeight:"1.75",
                fontFamily:"'Inter', sans-serif",
              }}>
                {item.body}
              </p>
            </div>

          </div>
        );
      })}
    </div>
  );
}
