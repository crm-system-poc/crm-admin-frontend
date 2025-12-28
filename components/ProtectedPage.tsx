"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/context/AuthContext";
import { hasModule, hasAction } from "@/lib/permissions";

interface ProtectedPageProps {
  module: string;
  children: React.ReactNode;
  action?: "create" | "read" | "update" | "delete";
}

export default function ProtectedPage({ module, children, action }: ProtectedPageProps) {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  if (!hasModule(user.permissions, module)) {
    return <p className="text-red-500 p-8">Unauthorized Access</p>;
  }

  if (action && !hasAction(user.permissions, module, action)) {
    return <p className="text-red-500 p-8">Unauthorized Access</p>;
  }

  return children;
}
