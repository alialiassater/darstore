import { useCart } from "@/hooks/use-cart";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, LogIn, UserPlus } from "lucide-react";
import { Link } from "wouter";

export function CartDrawer() {
  const { items, removeFromCart, updateQuantity, total, isOpen, setIsOpen } = useCart();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side={language === "ar" ? "left" : "right"} className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            {t("سلة التسوق", "Shopping Cart")}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
            <ShoppingBag className="w-16 h-16 opacity-20" />
            <p>{t("السلة فارغة", "Your cart is empty")}</p>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              <Link href="/store">{t("تصفح الكتب", "Browse Books")}</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {items.map(({ book, quantity }) => (
                <div key={book.id} className="flex gap-3 p-3 bg-muted/30 rounded-md" data-testid={`cart-item-${book.id}`}>
                  <img
                    src={book.image}
                    alt={language === "ar" ? book.titleAr : book.titleEn}
                    className="w-16 h-20 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {language === "ar" ? book.titleAr : book.titleEn}
                    </h4>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                    <p className="text-sm font-bold text-primary mt-1">
                      {Number(book.price).toLocaleString()} DZD
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(book.id, quantity - 1)}
                        data-testid={`cart-decrease-${book.id}`}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium w-6 text-center" data-testid={`cart-qty-${book.id}`}>{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(book.id, quantity + 1)}
                        data-testid={`cart-increase-${book.id}`}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive ms-auto"
                        onClick={() => removeFromCart(book.id)}
                        data-testid={`cart-remove-${book.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>{t("المجموع", "Total")}</span>
                <span className="text-primary" data-testid="cart-total">{total.toLocaleString()} DZD</span>
              </div>
              {user ? (
                <Link href="/checkout" onClick={() => setIsOpen(false)}>
                  <Button className="w-full" size="lg" data-testid="button-checkout">
                    {t("إتمام الطلب", "Proceed to Checkout")}
                  </Button>
                </Link>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-center text-muted-foreground">
                    {t("لازم تسجل حساب باش تقدر تدير طلب", "Create an account to place an order")}
                  </p>
                  <div className="flex gap-2">
                    <Link href="/signup" onClick={() => setIsOpen(false)} className="flex-1">
                      <Button className="w-full gap-2" data-testid="button-cart-signup">
                        <UserPlus className="w-4 h-4" />
                        {t("إنشاء حساب", "Sign Up")}
                      </Button>
                    </Link>
                    <Link href="/login" onClick={() => setIsOpen(false)} className="flex-1">
                      <Button variant="outline" className="w-full gap-2" data-testid="button-cart-login">
                        <LogIn className="w-4 h-4" />
                        {t("دخول", "Login")}
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
