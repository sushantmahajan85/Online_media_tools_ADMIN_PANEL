const TopCards = ({ value, label, icon, color = "blue", trend }) => {
  const colors = {
    blue:   { bg: "#eff6ff", icon: "#2563eb", num: "#1e40af", border: "#dbeafe" },
    green:  { bg: "#dcfce7", icon: "#16a34a", num: "#14532d", border: "#bbf7d0" },
    red:    { bg: "#fff1f2", icon: "#e11d48", num: "#9f1239", border: "#fecdd3" },
    amber:  { bg: "#fffbeb", icon: "#d97706", num: "#92400e", border: "#fde68a" },
    purple: { bg: "#f5f3ff", icon: "#7c3aed", num: "#4c1d95", border: "#ddd6fe" },
    gray:   { bg: "#f9fafb", icon: "#6b7280", num: "#374151", border: "#e5e7eb" },
  };
  const c = colors[color] || colors.blue;

  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${c.border}`,
      borderRadius: 12,
      padding: "18px 20px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: c.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        color: c.icon,
        flexShrink: 0,
      }}>
        <i className={icon} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: c.num, lineHeight: 1 }}>
          {isNaN(value) ? "—" : value}
        </div>
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4, fontWeight: 500 }}>
          {label}
        </div>
        {trend && (
          <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>{trend}</div>
        )}
      </div>
    </div>
  );
};

export default TopCards;
