"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const speciesOptions = [
  { value: "canine", label: "Canine" },
  { value: "feline", label: "Feline" },
  { value: "avian", label: "Avian" },
  { value: "rabbit", label: "Rabbit" },
  { value: "reptile", label: "Reptile" },
  { value: "equine", label: "Equine" },
  { value: "other", label: "Other" },
] as const;

const sexOptions = [
  { value: "male", label: "Male (Intact)" },
  { value: "female", label: "Female (Intact)" },
  { value: "male_neutered", label: "Male (Neutered)" },
  { value: "female_spayed", label: "Female (Spayed)" },
] as const;

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "deceased", label: "Deceased" },
] as const;

export default function EditPatientPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    species: "canine" as string,
    breed: "",
    sex: "" as string,
    dob: "",
    color: "",
    microchipNumber: "",
    status: "active" as string,
  });
  const [error, setError] = useState<string | null>(null);

  const { data: patient, isLoading } = trpc.patients.getById.useQuery(
    { id: params.id },
    { enabled: !!params.id }
  );

  useEffect(() => {
    if (patient) {
      setForm({
        name: patient.name ?? "",
        species: patient.species ?? "canine",
        breed: patient.breed ?? "",
        sex: patient.sex ?? "",
        dob: patient.dob ?? "",
        color: patient.color ?? "",
        microchipNumber: patient.microchipNumber ?? "",
        status: patient.status ?? "active",
      });
    }
  }, [patient]);

  const updatePatient = trpc.patients.update.useMutation({
    onSuccess: () => {
      toast.success("Patient updated");
      router.push(`/patients/${params.id}`);
    },
    onError: (err) => {
      toast.error(err.message);
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Patient name is required.");
      return;
    }

    updatePatient.mutate({
      id: params.id,
      name: form.name.trim(),
      species: form.species as any,
      breed: form.breed.trim() || undefined,
      sex: form.sex ? (form.sex as any) : undefined,
      dob: form.dob || undefined,
      color: form.color.trim() || undefined,
      microchipNumber: form.microchipNumber.trim() || undefined,
      status: form.status as any,
    });
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground py-12">Loading...</div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/patients/${params.id}`)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali
      </Button>

      <h2 className="font-heading text-xl font-semibold">Edit Pasien</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Perbarui informasi pasien
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium" htmlFor="name">
            Nama Pasien *
          </label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Nama pasien"
            className="mt-1"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium" htmlFor="species">
              Spesies *
            </label>
            <select
              id="spesies"
              value={form.species}
              onChange={(e) => updateField("species", e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {speciesOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="breed">
              Ras
            </label>
            <Input
              id="breed"
              value={form.breed}
              onChange={(e) => updateField("breed", e.target.value)}
              placeholder="Ras / breed"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium" htmlFor="sex">
              Kelamin
            </label>
            <select
              id="sex"
              value={form.sex}
              onChange={(e) => updateField("sex", e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Pilih kelamin...</option>
              {sexOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="dob">
              Tanaggal lahir
            </label>
            <Input
              id="dob"
              type="date"
              value={form.dob}
              onChange={(e) => updateField("dob", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium" htmlFor="color">
              Warna/Tanda Khusus
            </label>
            <Input
              id="color"
              value={form.color}
              onChange={(e) => updateField("color", e.target.value)}
              placeholder="contoh., Hitam dan putih"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="microchipNumber">
              Nomor Microchip
            </label>
            <Input
              id="microchipNumber"
              value={form.microchipNumber}
              onChange={(e) => updateField("microchipNumber", e.target.value)}
              placeholder="Microchip ID"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={updatePatient.isPending}>
            {updatePatient.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/patients/${params.id}`)}
          >
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}
