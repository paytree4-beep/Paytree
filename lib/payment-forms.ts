// lib/payment-forms.ts
//
// What the dashboard asks for, per payment method, and how a submitted form
// becomes the public_config stored in the database. Validation reuses
// resolveMethods from lib/profiles.ts, the same code the public page runs, so
// anything saved here is guaranteed to display.
//
// ACH and wire transfer are not here on purpose: their account numbers must be
// encrypted first (payment_method_secrets), which is its own phase.

import { resolveMethods, type PaymentSettings } from "./profiles";

export type EditableMethod =
  | "cashapp"
  | "venmo"
  | "paypal"
  | "stripe"
  | "square"
  | "wise"
  | "custom"
  | "zelle"
  | "applecash"
  | "chime"
  | "check"
  | "crypto";

export interface FormField {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  maxLength: number;
  inputMode?: "text" | "email";
}

export type MethodCategory = "apps" | "cards" | "bank" | "crypto";

export const CATEGORIES: { id: MethodCategory; title: string; hint: string }[] = [
  { id: "apps", title: "Payment apps", hint: "Cash App, Venmo, Zelle, PayPal and more" },
  { id: "cards", title: "Cards & online checkout", hint: "Stripe, Square and your own link" },
  { id: "bank", title: "Bank & international", hint: "Wise and check by mail" },
  { id: "crypto", title: "Crypto", hint: "USDT on the Tron network" },
];

export interface MethodForm {
  id: EditableMethod;
  category: MethodCategory;
  title: string;
  fields: FormField[];
}

const one = (label: string, hint: string, maxLength = 120): FormField[] => [
  { name: "value", label, hint, maxLength, required: true },
];

/** Same order as the public page. */
export const METHOD_FORMS: MethodForm[] = [
  { id: "cashapp", category: "apps", title: "Cash App", fields: one("Your $Cashtag", "For example $yourname.", 40) },
  { id: "venmo", category: "apps", title: "Venmo", fields: one("Your Venmo username", "For example @your-name.", 60) },
  { id: "paypal", category: "apps", title: "PayPal", fields: one("Your PayPal.Me name", "The part after paypal.me/, or paste your paypal.me link.", 80) },
  {
    id: "stripe",
    category: "cards",
    title: "Card (Stripe)",
    fields: one("Stripe Payment Link", "Starts with https://buy.stripe.com/", 200),
  },
  {
    id: "square",
    category: "cards",
    title: "Card (Square)",
    fields: one("Square payment link", "Starts with https://square.link/ or https://checkout.square.site/", 300),
  },
  { id: "wise", category: "bank", title: "Wise", fields: one("Your Wise Pay name", "The part after wise.com/pay/me/, or paste the link.", 100) },
  {
    id: "custom",
    category: "cards",
    title: "Custom link",
    fields: [
      { name: "label", label: "Button text", hint: "For example Buy me a coffee. Up to 30 characters.", maxLength: 30, required: true },
      { name: "url", label: "Link", hint: "A full https:// address.", maxLength: 500, required: true },
    ],
  },
  {
    id: "zelle",
    category: "apps",
    title: "Zelle",
    fields: [{ name: "value", label: "Email or US mobile number", hint: "The one registered with Zelle.", maxLength: 254, required: true, inputMode: "email" }],
  },
  {
    id: "applecash",
    category: "apps",
    title: "Apple Cash",
    fields: [{ name: "value", label: "Phone number or Apple ID email", hint: "The one people send Apple Cash to.", maxLength: 254, required: true, inputMode: "email" }],
  },
  { id: "chime", category: "apps", title: "Chime", fields: one("Your $ChimeSign", "For example $yourname.", 40) },
  {
    id: "check",
    category: "bank",
    title: "Check by mail",
    fields: [
      { name: "payableTo", label: "Payable to", maxLength: 80, required: true },
      { name: "line1", label: "Street address", maxLength: 80, required: true },
      { name: "line2", label: "Apartment, suite (optional)", maxLength: 80, required: false },
      { name: "city", label: "City", maxLength: 80, required: true },
      { name: "state", label: "State", hint: "Two letters, for example NY.", maxLength: 2, required: true },
      { name: "zip", label: "ZIP code", maxLength: 10, required: true },
    ],
  },
  {
    id: "crypto",
    category: "crypto",
    title: "Crypto (USDT)",
    fields: one("USDT address on the Tron (TRC-20) network", "Starts with T, 34 characters. Double-check it: crypto sent to a wrong address cannot be recovered.", 34),
  },
];

export function findMethodForm(id: unknown): MethodForm | null {
  return METHOD_FORMS.find((m) => m.id === id) ?? null;
}

function str(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Builds the public_config for one method from a submitted form, or returns
 * null when the value would not pass the public page's validation.
 */
export function configFromForm(form: MethodForm, formData: FormData): Record<string, string> | null {
  const config: Record<string, string> = {};
  for (const field of form.fields) {
    const value = str(formData, field.name).slice(0, field.maxLength);
    if (value) config[field.name] = value;
    else if (field.required) return null;
  }

  const settings: PaymentSettings = {};
  switch (form.id) {
    case "custom":
      settings.custom = { label: config.label, url: config.url };
      break;
    case "crypto":
      settings.crypto = { address: config.value };
      break;
    case "check":
      settings.check = {
        payableTo: config.payableTo,
        line1: config.line1,
        line2: config.line2,
        city: config.city,
        state: config.state,
        zip: config.zip,
      };
      break;
    default:
      settings[form.id] = config.value;
  }

  if (resolveMethods(settings).length === 0) return null;

  // Store crypto as { address } to match settingsFromRows.
  if (form.id === "crypto") return { address: config.value };
  if (form.id === "check" && config.state) config.state = config.state.toUpperCase();
  return config;
}

/** Turns a stored public_config back into form values. */
export function formValues(form: MethodForm, stored: unknown): Record<string, string> {
  const config =
    typeof stored === "object" && stored !== null && !Array.isArray(stored)
      ? (stored as Record<string, unknown>)
      : {};
  const values: Record<string, string> = {};
  for (const field of form.fields) {
    const key = form.id === "crypto" ? "address" : field.name;
    const value = config[key];
    if (typeof value === "string") values[field.name] = value;
  }
  return values;
}
