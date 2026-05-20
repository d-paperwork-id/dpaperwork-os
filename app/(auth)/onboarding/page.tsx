"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

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
    onSuccess: () => router.push("/dashboard"),
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
      <p className="text-sm text-center text-gray-500 mb-6">
        Tell us a bit about your business to get started.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">
            Business name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Acme Inc."
          />
          {fieldErrors.name && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="industry">
            Industry <span className="text-red-500">*</span>
          </label>
          <input
            id="industry"
            name="industry"
            type="text"
            value={form.industry}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="e.g. SaaS, Healthcare, Retail"
          />
          {fieldErrors.industry && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.industry}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="website">
            Website{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="website"
            name="website"
            type="url"
            value={form.website}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="https://example.com"
          />
          {fieldErrors.website && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.website}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="about">
            About your business <span className="text-red-500">*</span>
          </label>
          <textarea
            id="about"
            name="about"
            rows={3}
            value={form.about}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
            placeholder="Briefly describe what your business does."
          />
          {fieldErrors.about && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.about}</p>
          )}
        </div>

        {mutation.isError && (
          <p className="text-red-500 text-sm text-center">
            {(mutation.error as Error).message}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-black text-white rounded-md py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending ? "Creating workspace..." : "Continue"}
        </button>
      </form>
    </>
  );
}
