import React from 'react';

function InventoryTable({
  items,
  onEdit,
  onDelete,
  onQuickAdjust,
  filterSummary
}) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Inventory</p>
          <h2>Current stock</h2>
        </div>
        <p className="muted">{filterSummary}</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>No items match your filters yet.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Min</th>
                <th>Status</th>
                <th>Location</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={`status-row ${item.statusClass}`}>
                  <td>
                    <strong>{item.name}</strong>
                    <div className="subtext">{item.unit}</div>
                  </td>
                  <td>{item.category}</td>
                  <td>{item.quantity}</td>
                  <td>{item.minStock}</td>
                  <td>
                    <span className={`status-pill ${item.statusClass}`}>
                      {item.statusLabel}
                    </span>
                  </td>
                  <td>{item.location}</td>
                  <td>{item.notes || '—'}</td>
                  <td>
                    <div className="action-stack">
                      <div className="quick-adjust-group">
                        <button type="button" onClick={() => onQuickAdjust(item.id, -1)}>
                          -1
                        </button>
                        <button type="button" onClick={() => onQuickAdjust(item.id, 1)}>
                          +1
                        </button>
                      </div>
                      <button type="button" onClick={() => onEdit(item.id)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => onDelete(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default InventoryTable;
