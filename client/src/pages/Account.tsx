import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, User as UserIcon, Package, MapPin, Phone, Mail, Loader2, Eye, EyeOff, ShoppingBag, Clock, CheckCircle2, Truck, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@shared/routes";
import type { OrderWithItems } from "@shared/schema";

const profileSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب / Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
});

const passwordSchema = z.object({
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل / Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة / Passwords do not match",
  path: ["confirmPassword"],
});

function getStatusBadge(status: string, t: (ar: string, en: string) => string) {
  const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: t("قيد الانتظار", "Pending"), variant: "secondary" },
    confirmed: { label: t("مؤكد", "Confirmed"), variant: "default" },
    shipped: { label: t("تم الشحن", "Shipped"), variant: "outline" },
    delivered: { label: t("تم التوصيل", "Delivered"), variant: "default" },
    cancelled: { label: t("ملغي", "Cancelled"), variant: "destructive" },
  };
  const c = config[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "pending": return <Clock className="w-4 h-4 text-muted-foreground" />;
    case "confirmed": return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case "shipped": return <Truck className="w-4 h-4 text-blue-600" />;
    case "delivered": return <CheckCircle2 className="w-4 h-4 text-green-700" />;
    case "cancelled": return <XCircle className="w-4 h-4 text-destructive" />;
    default: return <Clock className="w-4 h-4" />;
  }
}

export default function Account() {
  const { user, isLoading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const { data: orders, isLoading: ordersLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/profile/orders"],
    enabled: !!user,
  });

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      city: "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
      });
    }
  }, [user]);

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const res = await apiRequest("PUT", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      toast({ title: t("تم التحديث", "Updated"), description: t("تم تحديث معلوماتك بنجاح", "Your information has been updated") });
    },
    onError: () => {
      toast({ title: t("خطأ", "Error"), description: t("فشل التحديث", "Update failed"), variant: "destructive" });
    },
  });

  const updatePassword = useMutation({
    mutationFn: async (data: z.infer<typeof passwordSchema>) => {
      const res = await apiRequest("PUT", "/api/profile", { password: data.password });
      return res.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({ title: t("تم التحديث", "Updated"), description: t("تم تغيير كلمة المرور", "Password has been changed") });
    },
    onError: () => {
      toast({ title: t("خطأ", "Error"), description: t("فشل تغيير كلمة المرور", "Password change failed"), variant: "destructive" });
    },
  });

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8 page-transition">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold" data-testid="text-account-title">
            {t("حسابي", "My Account")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("إدارة معلوماتك الشخصية وطلباتك", "Manage your personal information and orders")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card data-testid="card-points">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-md">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("نقاط الولاء", "Loyalty Points")}</p>
                  <p className="text-2xl font-bold" data-testid="text-account-points">{(user as any).points || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-orders-count">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-md">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("الطلبات", "Orders")}</p>
                  <p className="text-2xl font-bold" data-testid="text-orders-count">{orders?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-email">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-md">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("البريد", "Email")}</p>
                  <p className="text-sm font-medium truncate max-w-[160px]" data-testid="text-account-email">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders" data-testid="tab-orders" className="gap-2">
              <Package className="w-4 h-4" />
              {t("طلباتي", "My Orders")}
            </TabsTrigger>
            <TabsTrigger value="profile" data-testid="tab-profile" className="gap-2">
              <UserIcon className="w-4 h-4" />
              {t("معلوماتي", "My Info")}
            </TabsTrigger>
            <TabsTrigger value="password" data-testid="tab-password" className="gap-2">
              <EyeOff className="w-4 h-4" />
              {t("كلمة المرور", "Password")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            {ordersLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin w-6 h-6" /></div>
            ) : !orders || orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">{t("لا توجد طلبات بعد", "No orders yet")}</p>
                  <Button variant="outline" className="mt-4" onClick={() => setLocation("/store")} data-testid="button-browse-books">
                    {t("تصفح الكتب", "Browse Books")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} data-testid={`order-card-${order.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <CardTitle className="text-base">
                            {t("طلب", "Order")} #{order.id}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(order.status, t)}
                          <span className="text-sm text-muted-foreground">
                            {new Date(order.createdAt!).toLocaleDateString(language === "ar" ? "ar-DZ" : "en-US")}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              {item.book?.image && (
                                <img src={item.book.image} alt="" className="w-10 h-12 object-cover rounded" />
                              )}
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {item.book ? (language === "ar" ? item.book.titleAr : item.book.titleEn) : `#${item.bookId}`}
                                </p>
                                <p className="text-muted-foreground">x{item.quantity}</p>
                              </div>
                            </div>
                            <span className="font-medium whitespace-nowrap">
                              {(Number(item.unitPrice) * item.quantity).toLocaleString()} DZD
                            </span>
                          </div>
                        ))}
                        <div className="border-t pt-3 mt-3">
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span>{order.wilayaName} - {order.baladiya}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {t("الشحن", "Shipping")}: {Number(order.shippingPrice || 0).toLocaleString()} DZD
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-2 font-bold">
                            <span>{t("المجموع", "Total")}</span>
                            <span className="text-primary">{Number(order.total).toLocaleString()} DZD</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  {t("المعلومات الشخصية", "Personal Information")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit((data) => updateProfile.mutate(data))} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("الاسم الكامل", "Full Name")}</FormLabel>
                          <FormControl><Input {...field} data-testid="input-profile-name" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("رقم الهاتف", "Phone Number")}</FormLabel>
                          <FormControl><Input {...field} data-testid="input-profile-phone" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("العنوان", "Address")}</FormLabel>
                          <FormControl><Input {...field} data-testid="input-profile-address" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("المدينة", "City")}</FormLabel>
                          <FormControl><Input {...field} data-testid="input-profile-city" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={updateProfile.isPending} data-testid="button-save-profile">
                      {updateProfile.isPending && <Loader2 className="animate-spin w-4 h-4 me-2" />}
                      {t("حفظ التغييرات", "Save Changes")}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <EyeOff className="w-5 h-5" />
                  {t("تغيير كلمة المرور", "Change Password")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit((data) => updatePassword.mutate(data))} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("كلمة المرور الجديدة", "New Password")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input {...field} type={showPassword ? "text" : "password"} data-testid="input-new-password" />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute end-0 top-0"
                                onClick={() => setShowPassword(!showPassword)}
                                data-testid="button-toggle-password"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("تأكيد كلمة المرور", "Confirm Password")}</FormLabel>
                          <FormControl><Input {...field} type="password" data-testid="input-confirm-password" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={updatePassword.isPending} data-testid="button-save-password">
                      {updatePassword.isPending && <Loader2 className="animate-spin w-4 h-4 me-2" />}
                      {t("تغيير كلمة المرور", "Change Password")}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
