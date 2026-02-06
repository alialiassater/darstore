import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/hooks/use-language";
import { CartProvider } from "@/hooks/use-cart";

import Home from "@/pages/Home";
import Store from "@/pages/Store";
import BookDetails from "@/pages/BookDetails";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Checkout from "@/pages/Checkout";
import Admin from "@/pages/Admin";
import Account from "@/pages/Account";
import NotFound from "@/pages/not-found";
import { Navbar } from "@/components/layout/Navbar";
import { CartDrawer } from "@/components/layout/CartDrawer";

function Router() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <CartDrawer />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/store" component={Store} />
          <Route path="/books/:id" component={BookDetails} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/admin" component={Admin} />
          <Route path="/account" component={Account} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <footer className="bg-primary text-primary-foreground py-8 text-center border-t border-white/10">
        <div className="container mx-auto px-4">
          <p className="font-serif text-lg mb-2">{t("دار علي بن زيد للطباعة والنشر", "Dar Ali BenZid for Printing & Publishing")}</p>
          <p className="opacity-60 text-sm">{t(`© ${new Date().getFullYear()} جميع الحقوق محفوظة`, `© ${new Date().getFullYear()} All rights reserved.`)}</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CartProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
