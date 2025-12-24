"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell, Search, Home, Users, IndianRupee, ListOrdered, File, Box, UserCog, Contact} from "lucide-react";
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
import Image from "next/image";
import { useAuth } from "@/components/context/AuthContext";


export function AppBar() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, logout } = useAuth();
  const permissions = user?.permissions || {};

  const navItems = [
    { label: "Home", href: "/", icon: Home, perm: "manageHome" },
    { label: "Accounts", href: "/accounts", icon: Users, perm: "manageLeads" },
    { label: "Enquiry", href: "/inquiries", icon: Contact, perm: "manageInquiry" },
    { label: "Leads", href: "/leads", icon: Users, perm: "manageLeads" },
    { label: "Quotations", href: "/quotation", icon: IndianRupee, perm: "manageQuotation" },
    { label: "Purchase Orders", href: "/purchase-orders", icon: ListOrdered, perm: "managePurchaseOrder" },
    { label: "Sales PO", href: "/sales-purchase-orders", icon: ListOrdered, perm: "managePurchaseOrder" },
    { label: "Products", href: "/products", icon: Box, perm: "manageProducts" },
    { label: "OEM", href: "/oems", icon: Box, perm: "manageProducts" },
    { label: "Users", href: "/user", icon: UserCog, perm: "managePlatformUsers" },
    { label: "Reports", href: "/reports", icon: File, perm: "manageReport" },
  ];

  const handleLogout = async () => {
    try {
      toast.loading("Logging out...");
      await axios.post("http://localhost:8080/api/admin/logout", {}, { withCredentials: true });
      toast.dismiss();
      toast.success("Logged out successfully.");
      router.push("/login");
      logout();
    } catch (error) {
      toast.dismiss();
      toast.error("Logout failed");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/70 backdrop-blur-xl shadow-sm">
      <div className="flex items-center h-16 px-4 gap-4">

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6 text-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 pt-10">
            <nav className="flex flex-col gap-2">
              {navItems
                .filter(item => permissions[item.perm]) 
                .map(({ href, label, icon: Icon }) => (
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
        <Link href="/" className="flex items-center gap-2 font-semibold text-xl tracking-tight">
          <span className="h-8 w-8 grid place-items-center rounded-full bg-pink-600 text-white font-bold overflow-hidden">
            <Image src="/l.png" alt="Logo" width={52} height={52} className="object-cover rounded-full" priority />
          </span>
          <span>Ridipt</span>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems
            .filter(item => permissions[item.perm]) 
            .map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all hover:bg-pink-50 hover:text-pink-600",
                  pathname === href && "bg-pink-600 text-white shadow-sm"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
        </nav>

        {/* Right Icons */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-pink-50">
            <Bell className="h-5 w-5 text-pink-600" />
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-pink-600 animate-pulse" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="cursor-pointer ring-2 ring-pink-500 ring-offset-2">
                <AvatarFallback>{user?.name?.charAt(0).toUpperCase() || "AD"}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>

             
              {/* {permissions.managePlatformUsers && (
                <DropdownMenuItem onClick={() => router.push("/user")}>
                  Users
                </DropdownMenuItem>
              )} */}

              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    </header>
  );
}
