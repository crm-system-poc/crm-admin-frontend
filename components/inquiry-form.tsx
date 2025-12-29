"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React from 'react';

type InquiryFormProps = {
  inquiry?: Record<string, any>;
  onSubmit: (payload: Record<string, any>) => void;
};

export default function InquiryForm({ inquiry, onSubmit }: InquiryFormProps) {
  const [form, setForm] = React.useState<Record<string, any>>(inquiry || {});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input name="customerName" placeholder="Customer Name" required onChange={handleChange} defaultValue={form.customerName} />
      <Input name="phoneNumber" placeholder="Phone Number" required onChange={handleChange} defaultValue={form.phoneNumber} />
      <Input name="email" placeholder="Email" onChange={handleChange} defaultValue={form.email} />
      <Input name="city" placeholder="City" onChange={handleChange} defaultValue={form.city} />
      <Textarea name="message" placeholder="Inquiry message" required onChange={handleChange} defaultValue={form.message} />

      <Button type="submit">Save</Button>
    </form>
  );
}
