import React, { useEffect, useMemo, useState } from 'react';
import ItemForm, { initialFormState } from './components/ItemForm';
import InventoryTable from './components/InventoryTable';

const STORAGE_KEY = 'nail-spa-inventory-items';

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sanitizeItem(raw) {
  return {
    id: raw?.id ?? makeId(),
    name: typeof raw?.name === 'string' ? raw.name : '',
    category: typeof raw?.category === 'string' && raw.category.trim() ? raw.category : 'Other',
    quantity: Number.isFinite(Number(raw?.quantity)) ? Math.max(0, Number(raw.quantity)) : 0,
    minStock: Number.isFinite(Number(raw?.minStock)) ? Math.max(0, Number(raw.minStock)) : 0,
    unit: typeof raw?.unit === 'string' && raw.unit.trim() ? raw.unit : 'pcs',
    location: typeof raw?.location === 'string' ? raw.location : '',
    notes: typeof raw?.notes === 'string' ? raw.notes : ''
  };
}
// example starter data to populate a new inventory - won't be used if valid data already exists in localStorage
const starterItems = [
  {
    id: makeId(),
    name: 'Acetone',
    category: 'Cleaning',
    quantity: 3,
    minStock: 2,
    unit: 'bottles',
    location: 'Back shelf A',
    notes: 'Large refill bottle'
  },
  {
    id: makeId(),
    name: 'Nail Files',
    category: 'Disposable',
    quantity: 14,
    minStock: 20,
    unit: 'pcs',
    location: 'Drawer 2',
    notes: '100/180 grit'
  },
  {
    id: makeId(),
    name: 'Builder Gel Clear',
    category: 'Gel',
    quantity: 6,
    minStock: 3,
    unit: 'pots',
    location: 'Gel cart top tray',
    notes: ''
  }
].map(sanitizeItem);

function getStatus(item) {
  if (item.quantity === 0) {
    return { statusLabel: 'Out of stock', statusClass: 'out' };
  }

  if (item.quantity <= item.minStock) {
    return { statusLabel: 'Low stock', statusClass: 'low' };
  }

  return { statusLabel: 'In stock', statusClass: 'good' };
}

function loadItems() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return starterItems;
    }

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      return starterItems;
    }

    const cleaned = parsed.map(sanitizeItem).filter((item) => item.name.trim());
    return cleaned.length > 0 ? cleaned : starterItems;
  } catch {
    return starterItems;
  }
}

function App() {
  const [items, setItems] = useState(loadItems);
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showLowOnly, setShowLowOnly] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const decoratedItems = useMemo(() => {
    return items.map((item) => ({
      ...sanitizeItem(item),
      ...getStatus(sanitizeItem(item))
    }));
  }, [items]);

  const filteredItems = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return decoratedItems.filter((item) => {
      const haystack = [item.name, item.location, item.category]
        .map((value) => value.toLowerCase())
        .join(' ');

      const matchesSearch = search === '' || haystack.includes(search);
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      const matchesLowStock = !showLowOnly || item.quantity <= item.minStock;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [decoratedItems, searchTerm, categoryFilter, showLowOnly]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const lowStockCount = items.filter((item) => sanitizeItem(item).quantity <= sanitizeItem(item).minStock).length;
    const outOfStockCount = items.filter((item) => sanitizeItem(item).quantity === 0).length;

    return { totalItems, lowStockCount, outOfStockCount };
  }, [items]);

  const categories = useMemo(() => {
    const unique = new Set(items.map((item) => sanitizeItem(item).category));
    return ['All', ...unique];
  }, [items]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: name === 'quantity' || name === 'minStock' ? Number(value) : value
    }));
  }

  function resetForm() {
    setFormData(initialFormState);
    setEditingId(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const cleanedItem = sanitizeItem({
      ...formData,
      name: formData.name.trim(),
      location: formData.location.trim(),
      unit: formData.unit.trim(),
      notes: formData.notes.trim()
    });

    if (!cleanedItem.name) {
      return;
    }

    if (editingId) {
      setItems((current) =>
        current.map((item) =>
          item.id === editingId ? { ...item, ...cleanedItem, id: editingId } : item
        )
      );
    } else {
      setItems((current) => [
        {
          id: makeId(),
          ...cleanedItem
        },
        ...current
      ]);
    }

    resetForm();
  }

  function handleEdit(id) {
    const itemToEdit = items.find((item) => item.id === id);
    if (!itemToEdit) {
      return;
    }

    setFormData(sanitizeItem(itemToEdit));
    setEditingId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(id) {
    setItems((current) => current.filter((item) => item.id !== id));

    if (editingId === id) {
      resetForm();
    }
  }

  function handleQuickAdjust(id, amount) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const safeItem = sanitizeItem(item);
        return { ...safeItem, quantity: Math.max(0, safeItem.quantity + amount) };
      })
    );
  }

  return (
    <main className="app-shell">
  <section className="hero">
    <div className="hero-top">
      <img src="/logo.JPEG" alt="Allure Nail Salon logo" className="brand-logo" />
      <div>
        <h1>Allure Nail Salon Inventory Tracker</h1>
        <p className="hero-text">
          Track products, flag low stock, and keep storage locations organized in one place.
        </p>
      </div>
    </div>
  </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Total items</span>
          <strong>{stats.totalItems}</strong>
        </article>
        <article className="stat-card">
          <span>Low stock</span>
          <strong>{stats.lowStockCount}</strong>
        </article>
        <article className="stat-card">
          <span>Out of stock</span>
          <strong>{stats.outOfStockCount}</strong>
        </article>
      </section>

      <ItemForm
        formData={formData}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        onCancelEdit={resetForm}
        isEditing={Boolean(editingId)}
      />

      <section className="card filter-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Filters</p>
            <h2>Find what you need fast</h2>
          </div>
        </div>

        <div className="filters">
          <label>
            Search
            <input
              type="text"
              placeholder="Search by item, category, or location"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <label>
            Category
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showLowOnly}
              onChange={(event) => setShowLowOnly(event.target.checked)}
            />
            Show only low / out of stock items
          </label>
        </div>
      </section>

      <InventoryTable
        items={filteredItems}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onQuickAdjust={handleQuickAdjust}
        filterSummary={`Showing ${filteredItems.length} of ${items.length} items`}
      />
    </main>
  );
}

export default App;
