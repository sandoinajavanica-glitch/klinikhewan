"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Save, ShieldAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { SoapNoteEditor } from "@/components/SoapNoteEditor";
import { toast } from "sonner";

export default function NewSoapNotePage() {
  const params = useParams<{ patientId: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  if (userRole && userRole !== "admin" && userRole !== "veterinarian") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="font-heading text-xl font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Hanya Dokter Hewan dan Administrator yang dijinkan untuk membuat rekam
          medis.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/records")}
        >
          Kembali ke Rekam Medis
        </Button>
      </div>
    );
  }

  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");

  const { data: patient, isLoading: patientLoading } =
    trpc.patients.getById.useQuery(
      { id: params.patientId },
      { enabled: !!params.patientId }
    );

  const createNote = trpc.records.createSoapNote.useMutation({
    onSuccess: () => {
      toast.success("SOAP note created");
      router.push("/records");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function handleSave() {
    if (!params.patientId) return;
    createNote.mutate({
      patientId: params.patientId,
      subjective: subjective || undefined,
      objective: objective || undefined,
      assessment: assessment || undefined,
      plan: plan || undefined,
    });
  }

  if (patientLoading) {
    return (
      <div className="text-center text-muted-foreground py-12">Loading...</div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/records")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Rekam Medis
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">
            Rekam Medis Baru
          </h2>
          {patient && (
            <p className="text-sm text-muted-foreground">
              Pasien: {patient.name}
              {patient.species
                ? ` - ${
                    patient.species.charAt(0).toUpperCase() +
                    patient.species.slice(1)
                  }`
                : ""}
              {patient.breed ? ` (${patient.breed})` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 space-y-6">
          {/* Subjective */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Anamnesa</label>
            <p className="text-xs text-muted-foreground mb-2">
              Masukkan detail keluhan klien dan gejala awal hewan di sini...
            </p>
            <SoapNoteEditor
              value={subjective}
              onChange={setSubjective}
              placeholder="Keluhan pemilik..."
            />
          </div>

          {/* Objective */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Hasil Pemeriksaan
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Hasil pemeriksaan dan tanda vital
            </p>
            <SoapNoteEditor
              value={objective}
              onChange={setObjective}
              placeholder="Hasil pemeriksaan fisik, tanda vital, hasil lab..."
            />
          </div>

          {/* Assessment */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Diagnosa</label>
            <p className="text-xs text-muted-foreground mb-2">
              Diagnosa atau diagnosa banding
            </p>
            <SoapNoteEditor
              value={assessment}
              onChange={setAssessment}
              placeholder="Diagnosa, diagnosa banding..."
            />
          </div>

          {/* Plan */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Terapi</label>
            <p className="text-xs text-muted-foreground mb-2">
              Rencana terapi dan tindak lanjut
            </p>
            <SoapNoteEditor
              value={plan}
              onChange={setPlan}
              placeholder="Rencana terapi, pengobatan, tindak lanjut..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={createNote.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createNote.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/records")}>
            Batal
          </Button>
          {createNote.isError && (
            <p className="text-sm text-destructive">
              Gagal Disimpan: {createNote.error.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
