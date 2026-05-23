"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormData = {
  name: string;
  industry: string;
  website: string;
  about: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim()) errors.name = "Business name is required.";
  if (!data.industry.trim()) errors.industry = "Industry is required.";
  if (data.website && !/^https?:\/\/.+\..+/.test(data.website)) {
    errors.website = "Enter a valid URL (e.g. https://example.com).";
  }
  if (!data.about.trim()) errors.about = "Description is required.";
  return errors;
}

async function createWorkspace(data: FormData) {
  const res = await fetch("/api/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      website: data.website || undefined,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      res.status === 409
        ? "A workspace already exists for your account."
        : body?.error ?? "Something went wrong. Please try again."
    );
  }
  return res.json();
}

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    name: "",
    industry: "",
    website: "",
    about: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const mutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: () => router.push("/inbox"),
    onError: (err: Error) => {
      if (err.message.includes("already exists")) {
        router.push("/inbox");
      }
    },
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FormData]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    mutation.mutate(form);
  }

  return (
    <>
      <h1 className="text-2xl font-semibold mb-1 text-center">
        Set up your workspace
      </h1>
      <p className="text-sm text-center text-muted-foreground mb-6">
        Tell us a bit about your business to get started.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">
            Business name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Acme Inc."
          />
          {fieldErrors.name && (
            <p className="text-destructive text-xs">{fieldErrors.name}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="industry">
            Industry <span className="text-destructive">*</span>
          </Label>
          <Input
            id="industry"
            name="industry"
            type="text"
            value={form.industry}
            onChange={handleChange}
            placeholder="e.g. SaaS, Healthcare, Retail"
          />
          {fieldErrors.industry && (
            <p className="text-destructive text-xs">{fieldErrors.industry}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="website">
            Website{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="website"
            name="website"
            type="url"
            value={form.website}
            onChange={handleChange}
            placeholder="https://example.com"
          />
          {fieldErrors.website && (
            <p className="text-destructive text-xs">{fieldErrors.website}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="about">
            About your business <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="about"
            name="about"
            rows={3}
            value={form.about}
            onChange={handleChange}
            placeholder="Briefly describe what your business does."
            className="resize-none"
          />
          {fieldErrors.about && (
            <p className="text-destructive text-xs">{fieldErrors.about}</p>
          )}
        </div>

        {mutation.isError && (
          <p className="text-destructive text-sm text-center">
            {(mutation.error as Error).message}
          </p>
        )}

        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? "Creating workspace..." : "Continue"}
        </Button>
      </form>
    </>
  );
}
