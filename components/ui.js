"use client";

import { useEffect, useRef, useState } from "react";
import { X, Search } from "lucide-react";

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={"modal-box" + (wide ? " wide" : "")} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export function TextInput(props) {
  return <input {...props} className={"input " + (props.className || "")} />;
}
export function Select(props) {
  return <select {...props} className={"input " + (props.className || "")}>{props.children}</select>;
}

// Dropdown dengan pencarian: ketik untuk menyaring opsi, klik untuk memilih.
export function SearchSelect({ options, value, onChange, placeholder }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) setQuery(selected ? selected.label : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery(selected ? selected.label : "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Search size={14} color="#9ca3af" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
        <input
          className="input"
          style={{ paddingLeft: 30 }}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || "Ketik untuk mencari..."}
          autoComplete="off"
        />
      </div>
      {open && (
        <div className="search-select-dropdown">
          {filtered.length === 0 && <div className="search-select-empty">Tidak ditemukan.</div>}
          {filtered.map((o) => (
            <div
              key={o.value}
              className={"search-select-option" + (o.value === value ? " selected" : "")}
              onMouseDown={(e) => { e.preventDefault(); onChange(o.value); setQuery(o.label); setOpen(false); }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export function TextArea(props) {
  return <textarea rows={props.rows || 3} {...props} className={"input " + (props.className || "")} />;
}

export function PrimaryBtn({ children, className, ...rest }) {
  return <button className={"btn btn-primary " + (className || "")} {...rest}>{children}</button>;
}
export function GhostBtn({ children, className, ...rest }) {
  return <button className={"btn btn-ghost " + (className || "")} {...rest}>{children}</button>;
}
export function IconBtn({ children, danger, ...rest }) {
  return <button className={"btn-icon" + (danger ? " danger" : "")} {...rest}>{children}</button>;
}

export function Card({ children, style, className }) {
  return <div className={"card " + (className || "")} style={style}>{children}</div>;
}

export function Badge({ color, children }) {
  return <span className="badge" style={{ background: color + "22", color }}>{children}</span>;
}

export function Table({ columns, rows, empty }) {
  if (!rows || !rows.length) {
    return <div className="empty-state">{empty || "Belum ada data."}</div>;
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}