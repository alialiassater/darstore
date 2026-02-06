import { Link, useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ShoppingBag,
  LogIn,
  LogOut,
  LayoutDashboard,
  Menu,
  UserPlus
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const { itemCount, setIsOpen: setCartOpen } = useCart();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
  };

  const navLinks = [
    { href: "/", label: t("الرئيسية", "Home") },
    { href: "/store", label: t("المتجر", "Store") },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-serif text-xl font-bold text-primary-foreground" data-testid="link-logo">
          <img src="/logo.png" alt="Dar Ali BenZid Logo" className="h-10 w-auto" />
          <span className="hidden sm:inline">{t("دار علي بن زيد", "Dar Ali BenZid")}</span>
          <span className="sm:hidden">{t("دار علي بن زيد", "DAB")}</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                location === link.href ? "text-primary-foreground font-bold underline underline-offset-4" : "text-primary-foreground/80 hover:text-primary-foreground"
              }`}
              data-testid={`link-nav-${link.href.replace("/", "") || "home"}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="font-serif px-2 text-primary-foreground hover:bg-primary-foreground/10"
            data-testid="button-language-toggle"
          >
            {language === "ar" ? "EN" : "عربي"}
          </Button>

          {user ? (
            <>
              {user.role === "admin" && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="gap-2 text-primary-foreground hover:bg-primary-foreground/10" data-testid="link-admin">
                    <LayoutDashboard className="w-4 h-4" />
                    {t("لوحة التحكم", "Dashboard")}
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={() => logout()} className="gap-2 bg-transparent text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground hover:text-primary" data-testid="button-logout">
                <LogOut className="w-4 h-4" />
                {t("خروج", "Logout")}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="gap-2 text-primary-foreground hover:bg-primary-foreground/10" data-testid="link-login">
                  <LogIn className="w-4 h-4" />
                  {t("دخول", "Login")}
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90" data-testid="link-signup">
                  <UserPlus className="w-4 h-4" />
                  {t("حساب جديد", "Sign Up")}
                </Button>
              </Link>
            </div>
          )}

          <Button variant="ghost" size="icon" className="relative text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setCartOpen(true)} data-testid="button-cart">
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs bg-secondary text-secondary-foreground no-default-hover-elevate no-default-active-elevate" data-testid="badge-cart-count">
                {itemCount}
              </Badge>
            )}
          </Button>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" onClick={() => setCartOpen(true)} data-testid="button-cart-mobile">
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs no-default-hover-elevate no-default-active-elevate">
                {itemCount}
              </Badge>
            )}
          </Button>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side={language === "ar" ? "right" : "left"}>
              <div className="flex flex-col gap-6 mt-10">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-lg font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-2" />
                <div className="flex flex-col gap-3">
                  <Button variant="outline" onClick={toggleLanguage}>
                    {language === "ar" ? "English" : "العربية"}
                  </Button>
                  {user ? (
                    <>
                      {user.role === "admin" && (
                        <Link href="/admin" onClick={() => setIsOpen(false)}>
                          <Button variant="secondary" className="w-full justify-start gap-2">
                            <LayoutDashboard className="w-4 h-4" />
                            {t("لوحة التحكم", "Dashboard")}
                          </Button>
                        </Link>
                      )}
                      <Button variant="destructive" className="w-full justify-start gap-2" onClick={() => logout()}>
                        <LogOut className="w-4 h-4" />
                        {t("خروج", "Logout")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <LogIn className="w-4 h-4" />
                          {t("تسجيل الدخول", "Login")}
                        </Button>
                      </Link>
                      <Link href="/signup" onClick={() => setIsOpen(false)}>
                        <Button className="w-full justify-start gap-2">
                          <UserPlus className="w-4 h-4" />
                          {t("حساب جديد", "Sign Up")}
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
