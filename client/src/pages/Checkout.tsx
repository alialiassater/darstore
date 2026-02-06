import { useCart } from "@/hooks/use-cart";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ShoppingBag, Truck, CreditCard, Loader2, CheckCircle2, MapPin } from "lucide-react";
import { useState, useMemo } from "react";
import { algerianWilayas } from "@shared/algeria-data";
import type { Wilaya } from "@shared/schema";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  phone: z.string().min(8, "Valid phone number required"),
  wilayaCode: z.string().min(1, "Wilaya is required"),
  baladiya: z.string().min(1, "Baladiya is required"),
  address: z.string().min(5, "Full address required"),
  notes: z.string().optional(),
});

export default function Checkout() {
  const { items, total: cartTotal, clearCart } = useCart();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [orderPlaced, setOrderPlaced] = useState(false);

  const { data: serverWilayas } = useQuery<Wilaya[]>({
    queryKey: ["/api/shipping/wilayas"],
  });

  const activeWilayas = useMemo(() => {
    if (!serverWilayas) return [];
    return serverWilayas.filter(w => w.isActive);
  }, [serverWilayas]);

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: user?.name || "",
      phone: user?.phone || "",
      wilayaCode: "",
      baladiya: "",
      address: user?.address || "",
      notes: "",
    },
  });

  const selectedWilayaCode = form.watch("wilayaCode");

  const selectedWilayaData = useMemo(() => {
    if (!selectedWilayaCode) return null;
    const code = Number(selectedWilayaCode);
    return algerianWilayas.find(w => w.code === code) || null;
  }, [selectedWilayaCode]);

  const shippingPrice = useMemo(() => {
    if (!selectedWilayaCode || !serverWilayas) return 0;
    const code = Number(selectedWilayaCode);
    const sw = serverWilayas.find(w => w.code === code);
    return sw ? Number(sw.shippingPrice) : 0;
  }, [selectedWilayaCode, serverWilayas]);

  const baladiyas = useMemo(() => {
    return selectedWilayaData?.baladiyas || [];
  }, [selectedWilayaData]);

  const finalTotal = cartTotal + shippingPrice;

  const createOrder = useMutation({
    mutationFn: async (data: z.infer<typeof checkoutSchema>) => {
      const wilayaCode = Number(data.wilayaCode);
      const wilayaInfo = algerianWilayas.find(w => w.code === wilayaCode);
      const wilayaName = wilayaInfo
        ? (language === "ar" ? wilayaInfo.nameAr : wilayaInfo.nameEn)
        : "";

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customerName: data.customerName,
          phone: data.phone,
          address: data.address,
          city: wilayaName,
          wilayaCode,
          wilayaName,
          baladiya: data.baladiya,
          notes: data.notes,
          items: items.map(i => ({ bookId: i.book.id, quantity: i.quantity })),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Order failed");
      }
      return res.json();
    },
    onSuccess: () => {
      clearCart();
      setOrderPlaced(true);
      toast({ title: t("تم الطلب بنجاح", "Order placed successfully!") });
    },
    onError: (err) => {
      toast({ title: t("خطأ", "Error"), description: err.message, variant: "destructive" });
    },
  });

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 page-transition">
        <Card className="max-w-md w-full text-center p-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold font-serif mb-2" data-testid="text-order-success">
            {t("تم استلام طلبك", "Order Received!")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("سنتواصل معك قريباً لتأكيد الطلب والتوصيل.", "We'll contact you soon to confirm delivery details.")}
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            {t("طريقة الدفع: الدفع عند الاستلام", "Payment: Cash on Delivery")}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={() => setLocation("/store")} data-testid="button-continue-shopping">
              {t("مواصلة التسوق", "Continue Shopping")}
            </Button>
            <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-go-home">
              {t("الصفحة الرئيسية", "Go Home")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <h2 className="text-xl font-bold mb-2">{t("يجب إنشاء حساب أولاً", "Account Required")}</h2>
          <p className="text-muted-foreground mb-6">
            {t("لازم تسجل حساب باش تقدر تدير طلب", "You need to create an account to place an order")}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={() => setLocation("/signup")} data-testid="button-signup-checkout">
              {t("إنشاء حساب", "Create Account")}
            </Button>
            <Button variant="outline" onClick={() => setLocation("/login")} data-testid="button-login-checkout">
              {t("تسجيل الدخول", "Login")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <h2 className="text-xl font-bold mb-2">{t("السلة فارغة", "Cart is empty")}</h2>
          <Button onClick={() => setLocation("/store")}>{t("تصفح الكتب", "Browse Books")}</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 page-transition">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-serif font-bold mb-8" data-testid="text-checkout-title">
          {t("إتمام الطلب", "Checkout")}
        </h1>

        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  {t("معلومات التوصيل", "Delivery Information")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => createOrder.mutate(data))} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("الاسم الكامل", "Full Name")}</FormLabel>
                          <FormControl><Input {...field} data-testid="input-customer-name" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("رقم الهاتف", "Phone Number")}</FormLabel>
                          <FormControl><Input {...field} type="tel" data-testid="input-phone" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="wilayaCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("الولاية", "Wilaya")}</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(val) => {
                                field.onChange(val);
                                form.setValue("baladiya", "");
                              }}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-wilaya">
                                  <SelectValue placeholder={t("اختر الولاية", "Select Wilaya")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[300px]">
                                {activeWilayas.map((w) => (
                                  <SelectItem key={w.code} value={String(w.code)} data-testid={`wilaya-option-${w.code}`}>
                                    {w.code} - {language === "ar" ? w.nameAr : w.nameEn}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="baladiya"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("البلدية", "Baladiya")}</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={baladiyas.length === 0}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-baladiya">
                                  <SelectValue placeholder={t("اختر البلدية", "Select Baladiya")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[300px]">
                                {baladiyas.map((b, i) => (
                                  <SelectItem key={i} value={language === "ar" ? b.nameAr : b.nameEn} data-testid={`baladiya-option-${i}`}>
                                    {language === "ar" ? b.nameAr : b.nameEn}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("العنوان بالكامل", "Full Address")}</FormLabel>
                          <FormControl><Textarea {...field} data-testid="input-address" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("ملاحظات (اختياري)", "Notes (optional)")}</FormLabel>
                          <FormControl><Textarea {...field} data-testid="input-notes" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <CreditCard className="w-4 h-4" />
                        {t("الدفع عند الاستلام", "Cash on Delivery")}
                      </div>
                      <Button type="submit" className="w-full" size="lg" disabled={createOrder.isPending} data-testid="button-place-order">
                        {createOrder.isPending ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          t("تأكيد الطلب", "Place Order")
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  {t("ملخص الطلب", "Order Summary")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map(({ book, quantity }) => (
                  <div key={book.id} className="flex gap-3" data-testid={`checkout-item-${book.id}`}>
                    <img src={book.image} alt="" className="w-12 h-16 object-cover rounded-md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {language === "ar" ? book.titleAr : book.titleEn}
                      </p>
                      <p className="text-xs text-muted-foreground">x{quantity}</p>
                    </div>
                    <p className="text-sm font-bold whitespace-nowrap">
                      {(Number(book.price) * quantity).toLocaleString()} {t("د.ج", "DZD")}
                    </p>
                  </div>
                ))}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("المنتجات", "Products")}</span>
                    <span data-testid="text-subtotal">{cartTotal.toLocaleString()} {t("د.ج", "DZD")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {t("الشحن", "Shipping")}
                    </span>
                    <span data-testid="text-shipping-price">
                      {shippingPrice > 0
                        ? `${shippingPrice.toLocaleString()} ${t("د.ج", "DZD")}`
                        : t("اختر الولاية", "Select wilaya")
                      }
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>{t("المجموع", "Total")}</span>
                    <span className="text-primary" data-testid="checkout-total">{finalTotal.toLocaleString()} {t("د.ج", "DZD")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
