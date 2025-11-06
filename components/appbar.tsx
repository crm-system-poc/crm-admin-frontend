"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell, Search, Home, Users, History, IndianRupee, ListOrdered, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";

export function AppBar() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Leads", href: "/leads", icon: Users },
    { label: "Quotation", href: "/quotation", icon: IndianRupee },
    { label: "Purchase Order", href: "/purchase-history", icon: ListOrdered },
    { label: "Reports", href: "/reports", icon: File },
  ];

  const handleLogout = async () => {
    try {
      toast.loading("Logging out...");
      await axios.post(
        "http://localhost:8080/api/admin/logout",
        {},
        { withCredentials: true }
      );
      toast.dismiss();
      toast.success("Logged out successfully.");
      router.push("/login");
    } catch (error) {
      toast.dismiss();
      toast.error("Logout failed");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/70 backdrop-blur-xl shadow-sm">      <div className="flex items-center h-16 px-4 gap-4">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6 text-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 pt-10">
            <nav className="flex flex-col gap-2">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-md text-base font-medium hover:bg-muted transition",
                    pathname === href && "bg-muted text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-xl tracking-tight"
        >
          <span className="h-8 w-8 grid place-items-center rounded-full bg-pink-600 text-white font-bold shadow-sm">
            L
          </span>
          <span>Logo</span>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-2 ml-6">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all hover:bg-pink-50 hover:text-pink-600",
                pathname === href && "bg-pink-600 text-white shadow-sm"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search…" className="pl-10 rounded-full" />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full hover:bg-pink-50"
          >
            <Bell className="h-5 w-5 text-pink-600" />
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-pink-600 animate-pulse" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="cursor-pointer ring-2 ring-pink-500 ring-offset-2">
                <AvatarFallback className="bg-pink-600 text-white">
                  MG
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={handleLogout}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
