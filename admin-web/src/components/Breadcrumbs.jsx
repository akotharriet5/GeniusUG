import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items }) {
  return (
    <div className="crumbs">
      {items.map((it, i) => (
        <span key={i}>
          {it.to ? <Link to={it.to}>{it.label}</Link> : <strong>{it.label}</strong>}
          {i < items.length - 1 && ' › '}
        </span>
      ))}
    </div>
  );
}
