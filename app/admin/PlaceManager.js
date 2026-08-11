"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GEORGIA_REGIONS } from "../lib/placesMeta";
import { createPlace, deletePlace, listPlaces, updatePlace } from "../lib/placesFirestore";

import { asLocalizedText } from "../lib/toursFirestore";

async function upload(file) {
  const fd = new FormData(); fd.append("file", file);
  const response = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "ატვირთვა ვერ მოხერხდა");
  return data.url;
}
const empty = { title: "", desc: "", region: GEORGIA_REGIONS[0], gallery: [], isPopular: false };
export default function PlaceManager() {
  const [form, setForm] = useState(empty); const [places, setPlaces] = useState([]); const [editingId, setEditingId] = useState(null); const [saving, setSaving] = useState(false); const [message, setMessage] = useState("");
  const refresh = async () => setPlaces(await listPlaces());
  useEffect(() => { refresh().catch(() => setMessage("ადგილების ჩატვირთვა ვერ მოხერხდა")); }, []);
  const submit = async (event) => { event.preventDefault(); setSaving(true); setMessage(""); try { const payload = { ...form, title: typeof form.title === "string" ? form.title.trim() : form.title, desc: typeof form.desc === "string" ? form.desc.trim() : form.desc, img: form.gallery[0] || "/hero.png" }; if (editingId) await updatePlace(editingId, payload); else await createPlace(payload); setForm(empty); setEditingId(null); await refresh(); setMessage("ადგილი შენახულია"); } catch (error) { setMessage(error.message); } finally { setSaving(false); } };
  const uploadImages = async (event) => { const files = [...(event.target.files || [])]; if (!files.length) return; setSaving(true); try { const urls = await Promise.all(files.map(upload)); setForm((current) => ({ ...current, gallery: [...current.gallery, ...urls] })); } catch (error) { setMessage(error.message); } finally { setSaving(false); event.target.value = ""; } };
  const edit = (place) => { setEditingId(place.id); setForm({ title: asLocalizedText(place.title), desc: asLocalizedText(place.desc), region: asLocalizedText(place.region) || GEORGIA_REGIONS[0], gallery: place.gallery || [], isPopular: place.isPopular }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const remove = async (id) => { if (!confirm("წაიშალოს ადგილი?")) return; await deletePlace(id); await refresh(); };
  return <div className="admin-layout"><form className="admin-form" onSubmit={submit}><header className="admin-form-header"><h2>{editingId ? "ადგილის რედაქტირება" : "ტურისტული ადგილის დამატება"}</h2><p>ეს ადგილები ტურებისგან დამოუკიდებელია.</p></header>{message && <div className="admin-alert success">{message}</div>}<fieldset className="admin-fieldset"><legend>ინფორმაცია</legend><div className="admin-field"><label>ადგილის სახელი</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div><div className="admin-field"><label>აღწერა</label><textarea required rows={6} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} /></div><div className="admin-field"><label>რეგიონი</label><select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>{GEORGIA_REGIONS.map((region) => <option key={region}>{region}</option>)}</select></div><label className="admin-check"><input type="checkbox" checked={form.isPopular} onChange={(e) => setForm({ ...form, isPopular: e.target.checked })} /><span>პოპულარული ადგილი</span></label></fieldset><fieldset className="admin-fieldset"><legend>ფოტოები</legend><input type="file" accept="image/*" multiple onChange={uploadImages} disabled={saving} /><div className="admin-gallery-grid">{form.gallery.map((url, index) => <div className="admin-gallery-item" key={url}><Image src={url} alt="" fill sizes="120px" style={{ objectFit: "cover" }} /><button type="button" className="admin-gallery-remove" onClick={() => setForm({ ...form, gallery: form.gallery.filter((_, i) => i !== index) })}>×</button></div>)}</div></fieldset><div className="admin-form-actions"><button className="admin-btn-primary" disabled={saving}>{saving ? "ინახება..." : editingId ? "ცვლილებების შენახვა" : "ადგილის შენახვა"}</button><button type="button" className="admin-btn-ghost" onClick={() => { setForm(empty); setEditingId(null); }}>გაუქმება</button></div></form><aside className="admin-sidebar"><h2>ტურისტული ადგილები</h2><ul className="admin-tour-list">{places.map((place) => <li key={place.id}><div><strong>{asLocalizedText(place.title)}</strong><small>{asLocalizedText(place.region)}</small><Link href={`/places/${place.id}`}>ნახვა →</Link></div><div><button type="button" className="admin-btn-ghost" onClick={() => edit(place)}>რედაქტირება</button><button type="button" className="admin-btn-ghost" onClick={() => remove(place.id)}>წაშლა</button></div></li>)}</ul></aside></div>;
}