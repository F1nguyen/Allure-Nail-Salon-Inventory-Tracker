import React from 'react';

const EMPTY_FORM = {
  name: '',
  category: 'Polish',
  quantity: 1,
  minStock: 1,
  location: '',
  unit: 'pcs',
  notes: ''
};

function ItemForm({
  formData,
  onChange,
  onSubmit,
  onCancelEdit,
  isEditing
}) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Inventory Form</p>
          <h2>{isEditing ? 'Edit inventory item' : 'Add new inventory item'}</h2>
        </div>
        {isEditing && (
          <button className="ghost-button" type="button" onClick={onCancelEdit}>
            Cancel edit
          </button>
        )}
      </div>

      <form className="item-form" onSubmit={onSubmit}>
        <label>
          Item name
          <input
            name="name"
            type="text"
            placeholder="Ex. Acetone"
            value={formData.name}
            onChange={onChange}
            required
          />
        </label>

        <label>
          Category
          <select name="category" value={formData.category} onChange={onChange}>
            <option>Polish</option>
            <option>Gel</option>
            <option>Acrylic</option>
            <option>Tool</option>
            <option>Disposable</option>
            <option>Cleaning</option>
            <option>Retail</option>
            <option>Other</option>
          </select>
        </label>

        <label>
          Quantity
          <input
            name="quantity"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={onChange}
            required
          />
        </label>

        <label>
          Minimum stock
          <input
            name="minStock"
            type="number"
            min="0"
            value={formData.minStock}
            onChange={onChange}
            required
          />
        </label>

        <label>
          Unit
          <input
            name="unit"
            type="text"
            placeholder="pcs / bottles / packs"
            value={formData.unit}
            onChange={onChange}
            required
          />
        </label>

        <label>
          Storage location
          <input
            name="location"
            type="text"
            placeholder="Ex. Back shelf A"
            value={formData.location}
            onChange={onChange}
            required
          />
        </label>

        <label className="full-width">
          Notes
          <textarea
            name="notes"
            rows="3"
            placeholder="Optional supplier, color number, or extra details"
            value={formData.notes}
            onChange={onChange}
          />
        </label>

        <div className="form-actions full-width">
          <button className="primary-button" type="submit">
            {isEditing ? 'Save changes' : 'Add item'}
          </button>
          {!isEditing && (
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                Object.entries(EMPTY_FORM).forEach(([name, value]) => {
                  onChange({ target: { name, value } });
                });
              }}
            >
              Reset form
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export const initialFormState = EMPTY_FORM;
export default ItemForm;
