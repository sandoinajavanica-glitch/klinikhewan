async function extractError(res, fallback) {
  try {
    const body = await res.json();
    return body.error || fallback;
  } catch (e) {
    return fallback;
  }
}

export async function apiGet(resource) {
  const res = await fetch(`/api/${resource}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await extractError(res, "Gagal mengambil data"));
  return res.json();
}

export async function apiCreate(resource, data) {
  const res = await fetch(`/api/${resource}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await extractError(res, "Gagal menyimpan data"));
  return res.json();
}

export async function apiUpdate(resource, id, data) {
  const res = await fetch(`/api/${resource}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await extractError(res, "Gagal mengubah data"));
  return res.json();
}

export async function apiDelete(resource, id) {
  const res = await fetch(`/api/${resource}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await extractError(res, "Gagal menghapus data"));
  return res.json();
}

export async function apiUploadPhoto(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error(await extractError(res, "Gagal mengunggah foto"));
  return res.json();
}
