"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import axios from "axios";
import { api } from "@/lib/api";
import { useState } from "react";

// You may need to import your Eye/EyeOff icons depending on your project setup
import { Eye, EyeOff } from "lucide-react"; // adjust if using a different icon set

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const router = useRouter();

  // Add showPassword state
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: any) => {
    toast.loading("Logging in...");
    try {
      const response = await api.post(
        "/api/admin/login",
        {
          email: data.email,
          password: data.password,
        },
        {
          withCredentials: true,
        }
      );

      toast.dismiss();
      toast.success("Login Successful");

      // Store admin name in localStorage after login
      if (
        response.data &&
        response.data.data &&
        response.data.data.admin &&
        response.data.data.admin.name
      ) {
        localStorage.setItem("adminName", response.data.data.admin.name);
      }

      router.push("/");
    } catch (error: any) {
      toast.dismiss();
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Invalid email or password");
      }
    }
  };

  return (
    <div className="fixed inset-0 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
      {/* Left Image */}
      <div className="hidden md:block relative">
        <Image
          src="/crm.jpg"
          alt="Login background"
          fill
          className="object-cover"
        />
      </div>

      {/* Right Card */}
      <div className="flex items-center justify-center p-6 h-full">
        <Card className="w-full max-w-md shadow-lg border bg-background/95 backdrop-blur-sm">
          {/* Card content remains the same */}

          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">
              Admin Login
            </CardTitle>
            <CardDescription className="text-center">
              Login as an Admin to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">
                        Password
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="********"
                            autoComplete="current-password"
                            className="h-11 rounded-lg pr-10 bg-muted/60 border-input focus:bg-background"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                      <FormMessage className="mt-1" />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Login
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm">
              Don&apos;t have an account?{" "}
              <button
                onClick={() => router.push("/signup")}
                className="text-primary underline hover:opacity-80"
              >
                Sign Up
              </button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
