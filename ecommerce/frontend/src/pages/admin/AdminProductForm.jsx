import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Minus, Save } from 'lucide-react';
import { AdminLayout } from './AdminDashboard';
import { adminAPI, productAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Laptops', 'Smartphones', 'Headphones', 'Televisions', 'Cameras', 'Tablets', 'Smartwatches', 'Gaming', 'Computer Peripherals', 'Storage', 'Home Appliances', 'Clothing', 'Shoes', 'Books', 'Furniture', 'Fitness'];

const EMPTY = {
  name: '', description: '', shortDescription: '', price: '', originalPrice: '',
  category: '', subcategory: '', brand: '', stock: '', sku: '',
  isFeatured: false, isActive: true,
  images: [{ url: '', alt: '' }],
  specifications: [{ key: '', value: '' }],
  tags: '',
};

export default function AdminProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ['product-edit', id],
    queryFn: () => productAPI.getOne(id),
    enabled: isEdit,
  });

  useEffect(() => {
    if (data?.data?.product) {
      const p = data.data.product;
      setForm({
        ...p,
        tags: p.tags?.join(', ') || '',
        images: p.images?.length > 0 ? p.images : [{ url: '', alt: '' }],
        specifications: p.specifications?.length > 0 ? p.specifications : [{ key: '', value: '' }],
      });
    }
  }, [data]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const updateImage = (i, k, v) => {
    const images = [...form.images];
    images[i] = { ...images[i], [k]: v };
    update('images', images);
  };
  const addImage = () => update('images', [...form.images, { url: '', alt: '' }]);
  const removeImage = (i) => update('images', form.images.filter((_, idx) => idx !== i));

  const updateSpec = (i, k, v) => {
    const specs = [...form.specifications];
    specs[i] = { ...specs[i], [k]: v };
    update('specifications', specs);
  };
  const addSpec = () => update('specifications', [...form.specifications, { key: '', value: '' }]);
  const removeSpec = (i) => update('specifications', form.specifications.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category || !form.brand || !form.stock) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        stock: Number(form.stock),
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        images: form.images.filter((img) => img.url),
        specifications: form.specifications.filter((s) => s.key && s.value),
      };
      if (isEdit) {
        await adminAPI.updateProduct(id, payload);
        toast.success('Product updated!');
      } else {
        await adminAPI.createProduct(payload);
        toast.success('Product created!');
      }
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, required, children }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <AdminLayout title={isEdit ? 'Edit Product' : 'Add Product'}>
      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Field label="Product Name" required>
                <input value={form.name} onChange={(e) => update('name', e.target.value)} className="input" placeholder="e.g. Apple MacBook Air M2" />
              </Field>
            </div>
            <Field label="Brand" required>
              <input value={form.brand} onChange={(e) => update('brand', e.target.value)} className="input" placeholder="Apple" />
            </Field>
            <Field label="SKU">
              <input value={form.sku} onChange={(e) => update('sku', e.target.value)} className="input" placeholder="APPLE-MBA-M2-256" />
            </Field>
            <Field label="Category" required>
              <select value={form.category} onChange={(e) => update('category', e.target.value)} className="input">
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Subcategory">
              <input value={form.subcategory} onChange={(e) => update('subcategory', e.target.value)} className="input" placeholder="e.g. Ultrabooks" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Short Description">
                <input value={form.shortDescription} onChange={(e) => update('shortDescription', e.target.value)} className="input" placeholder="Brief 1-line product summary" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Full Description" required>
                <textarea value={form.description} onChange={(e) => update('description', e.target.value)} className="input resize-none" rows={4} placeholder="Detailed product description..." />
              </Field>
            </div>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Pricing & Inventory</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Selling Price (₹)" required>
              <input type="number" value={form.price} onChange={(e) => update('price', e.target.value)} className="input" min="0" placeholder="49999" />
            </Field>
            <Field label="MRP / Original Price (₹)">
              <input type="number" value={form.originalPrice} onChange={(e) => update('originalPrice', e.target.value)} className="input" min="0" placeholder="59999" />
            </Field>
            <Field label="Stock Quantity" required>
              <input type="number" value={form.stock} onChange={(e) => update('stock', e.target.value)} className="input" min="0" placeholder="100" />
            </Field>
          </div>
          <div className="flex gap-6 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => update('isFeatured', e.target.checked)} className="rounded text-amazon-orange" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Featured Product</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => update('isActive', e.target.checked)} className="rounded text-amazon-orange" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active / Visible</span>
            </label>
          </div>
        </div>

        {/* Images */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Product Images</h2>
            <button type="button" onClick={addImage} className="btn-outline text-sm py-1.5 flex items-center gap-1">
              <Plus size={14} /> Add Image
            </button>
          </div>
          <div className="space-y-3">
            {form.images.map((img, i) => (
              <div key={i} className="flex gap-3 items-start">
                {img.url && (
                  <img src={img.url} alt="preview" className="w-14 h-14 object-contain rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1 flex-shrink-0" onError={(e) => e.target.style.display = 'none'} />
                )}
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input value={img.url} onChange={(e) => updateImage(i, 'url', e.target.value)} className="input text-sm" placeholder="Image URL (https://...)" />
                  <input value={img.alt} onChange={(e) => updateImage(i, 'alt', e.target.value)} className="input text-sm" placeholder="Alt text" />
                </div>
                {form.images.length > 1 && (
                  <button type="button" onClick={() => removeImage(i)} className="p-2 text-red-400 hover:text-red-600"><Minus size={14} /></button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Specifications */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Specifications</h2>
            <button type="button" onClick={addSpec} className="btn-outline text-sm py-1.5 flex items-center gap-1">
              <Plus size={14} /> Add Spec
            </button>
          </div>
          <div className="space-y-2">
            {form.specifications.map((spec, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={spec.key} onChange={(e) => updateSpec(i, 'key', e.target.value)} className="input text-sm w-40" placeholder="e.g. RAM" />
                <input value={spec.value} onChange={(e) => updateSpec(i, 'value', e.target.value)} className="input text-sm flex-1" placeholder="e.g. 8GB DDR5" />
                {form.specifications.length > 1 && (
                  <button type="button" onClick={() => removeSpec(i)} className="p-2 text-red-400"><Minus size={14} /></button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="card p-6">
          <Field label="Tags (comma separated)">
            <input value={form.tags} onChange={(e) => update('tags', e.target.value)} className="input" placeholder="apple, laptop, ultrabook, m2, macos" />
          </Field>
          <p className="text-xs text-gray-400 mt-1">Tags help with search and AI recommendations</p>
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-6 py-3">
            <Save size={16} /> {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-outline px-6 py-3">
            Cancel
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
