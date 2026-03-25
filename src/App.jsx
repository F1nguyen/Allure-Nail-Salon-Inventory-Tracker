import React, { useEffect, useMemo, useState } from 'react';
import ItemForm, { initialFormState } from './components/ItemForm';
import InventoryTable from './components/InventoryTable';
import { supabase } from './supabaseClient';

function sanitizeItem(raw) {
  return {
    id: raw?.id ?? null,
    name: typeof raw?.name === 'string' ? raw.name : '',
    category:
      typeof raw?.category === 'string' && raw.category.trim()
        ? raw.category
        : 'Other',
    quantity: Number.isFinite(Number(raw?.quantity))
      ? Math.max(0, Number(raw.quantity))
      : 0,
    minStock: Number.isFinite(Number(raw?.minStock ?? raw?.min_stock))
      ? Math.max(0, Number(raw?.minStock ?? raw?.min_stock))
      : 0,
    unit:
      typeof raw?.unit === 'string' && raw.unit.trim()
        ? raw.unit
        : 'pcs',
    location: typeof raw?.location === 'string' ? raw.location : '',
    notes: typeof raw?.notes === 'string' ? raw.notes : ''
  };
}

function getStatus(item) {
  if (item.quantity === 0) {
    return { statusLabel: 'Out of stock', statusClass: 'out' };
  }

  if (item.quantity <= item.minStock) {
    return { statusLabel: 'Low stock', statusClass: 'low' };
  }

  return { statusLabel: 'In stock', statusClass: 'good' };
}

function App() {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading items:', error);
      setLoading(false);
      return;
    }

    setItems((data ?? []).map(sanitizeItem));
    setLoading(false);
  }

  const decoratedItems = useMemo(() => {
    return items.map((item) => {
      const safeItem = sanitizeItem(item);
      return {
        ...safeItem,
        ...getStatus(safeItem)
      };
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return decoratedItems.filter((item) => {
      const haystack = [item.name, item.location, item.category]
        .map((value) => value.toLowerCase())
        .join(' ');

      const matchesSearch = search === '' || haystack.includes(search);
      const matchesCategory =
        categoryFilter === 'All' || item.category === categoryFilter;
      const matchesLowStock =
        !showLowOnly || item.quantity <= item.minStock;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [decoratedItems, searchTerm, categoryFilter, showLowOnly]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const lowStockCount = items.filter((item) => {
      const safeItem = sanitizeItem(item);
      return safeItem.quantity <= safeItem.minStock;
    }).length;
    const outOfStockCount = items.filter((item) => {
      const safeItem = sanitizeItem(item);
      return safeItem.quantity === 0;
    }).length;

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
      [name]: name === 'quantity' || name === 'minStock'
        ? Number(value)
        : value
    }));
  }

  function resetForm() {
    setFormData(initialFormState);
    setEditingId(null);
  }

  async function handleSubmit(event) {
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

    const payload = {
      name: cleanedItem.name,
      category: cleanedItem.category,
      quantity: cleanedItem.quantity,
      min_stock: cleanedItem.minStock,
      unit: cleanedItem.unit,
      location: cleanedItem.location,
      notes: cleanedItem.notes
    };

    if (editingId) {
      const { data, error } = await supabase
        .from('inventory_items')
        .update(payload)
        .eq('id', editingId)
        .select()
        .single();

      if (error) {
        console.error('Error updating item:', error);
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.id === editingId ? sanitizeItem(data) : item
        )
      );
    } else {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('Error adding item:', error);
        return;
      }

      setItems((current) => [sanitizeItem(data), ...current]);
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

  async function handleDelete(id) {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting item:', error);
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));

    if (editingId === id) {
      resetForm();
    }
  }

  async function handleQuickAdjust(id, amount) {
    const itemToUpdate = items.find((item) => item.id === id);
    if (!itemToUpdate) {
      return;
    }

    const safeItem = sanitizeItem(itemToUpdate);
    const newQuantity = Math.max(0, safeItem.quantity + amount);

    const { data, error } = await supabase
      .from('inventory_items')
      .update({ quantity: newQuantity })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating quantity:', error);
      return;
    }

    setItems((current) =>
      current.map((item) => (item.id === id ? sanitizeItem(data) : item))
    );
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-top">
          <img
            src="/logo.JPEG"
            alt="Allure Nail Salon logo"
            className="brand-logo"
          />
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
        filterSummary={
          loading
            ? 'Loading items...'
            : `Showing ${filteredItems.length} of ${items.length} items`
        }
      />
    </main>
  );
}

export default App;