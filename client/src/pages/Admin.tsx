import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useBooks, useCreateBook, useUpdateBook, useDeleteBook } from "@/hooks/use-books";
import { useLanguage } from "@/hooks/use-language";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Pencil, Trash2, Loader2, Image as ImageIcon,
  BookOpen, Package, Users, Activity, BarChart3, Tag, Eye,
  ShoppingBag, UserPlus, UserX, ToggleLeft, ToggleRight, History,
  MapPin, Truck, Save, Check, X
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookSchema, insertCategorySchema, type InsertBook, type Book, type Category, type InsertCategory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const CATEGORIES_STATIC = ["Fiction", "History", "Science", "Philosophy", "Children", "Religious", "Literature", "Religion"];

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (!user || !["admin", "employee"].includes(user.role)) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif text-primary" data-testid="text-admin-title">{t("لوحة التحكم", "Dashboard")}</h1>
        <p className="text-muted-foreground">{t("إدارة المتجر والمحتوى", "Manage store and content")}</p>
      </div>

      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList className="flex-wrap gap-1">
          <TabsTrigger value="stats" className="gap-2" data-testid="tab-stats"><BarChart3 className="w-4 h-4" />{t("إحصائيات", "Stats")}</TabsTrigger>
          <TabsTrigger value="books" className="gap-2" data-testid="tab-books"><BookOpen className="w-4 h-4" />{t("الكتب", "Books")}</TabsTrigger>
          <TabsTrigger value="categories" className="gap-2" data-testid="tab-categories"><Tag className="w-4 h-4" />{t("التصنيفات", "Categories")}</TabsTrigger>
          <TabsTrigger value="orders" className="gap-2" data-testid="tab-orders"><Package className="w-4 h-4" />{t("الطلبات", "Orders")}</TabsTrigger>
          <TabsTrigger value="customers" className="gap-2" data-testid="tab-customers"><Users className="w-4 h-4" />{t("العملاء", "Customers")}</TabsTrigger>
          <TabsTrigger value="shipping" className="gap-2" data-testid="tab-shipping"><Truck className="w-4 h-4" />{t("الشحن", "Shipping")}</TabsTrigger>
          <TabsTrigger value="activity" className="gap-2" data-testid="tab-activity"><Activity className="w-4 h-4" />{t("السجل", "Activity")}</TabsTrigger>
        </TabsList>

        <TabsContent value="stats"><StatsTab /></TabsContent>
        <TabsContent value="books"><BooksTab /></TabsContent>
        <TabsContent value="categories"><CategoriesTab /></TabsContent>
        <TabsContent value="orders"><OrdersTab /></TabsContent>
        <TabsContent value="customers"><CustomersTab /></TabsContent>
        <TabsContent value="shipping"><ShippingTab /></TabsContent>
        <TabsContent value="activity"><ActivityTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function StatsTab() {
  const { t } = useLanguage();
  const { data: stats, isLoading } = useQuery<{ totalBooks: number; totalOrders: number; totalCustomers: number; lowStockBooks: number; revenue: number }>({ queryKey: ["/api/admin/stats"] });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;

  const statCards = [
    { label: t("إجمالي الكتب", "Total Books"), value: stats?.totalBooks || 0, icon: BookOpen, color: "text-blue-600" },
    { label: t("إجمالي الطلبات", "Total Orders"), value: stats?.totalOrders || 0, icon: Package, color: "text-green-600" },
    { label: t("العملاء", "Customers"), value: stats?.totalCustomers || 0, icon: Users, color: "text-purple-600" },
    { label: t("مخزون منخفض", "Low Stock"), value: stats?.lowStockBooks || 0, icon: BarChart3, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md bg-muted ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid={`stat-value-${i}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm">{t("الإيرادات الإجمالية", "Total Revenue")}</p>
          <p className="text-3xl font-bold text-primary" data-testid="stat-revenue">
            {Number(stats?.revenue || 0).toLocaleString()} DZD
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function BooksTab() {
  const { t } = useLanguage();
  const { data: books, isLoading } = useBooks();
  const deleteBook = useDeleteBook();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{t("إدارة الكتب", "Manage Books")}</h2>
        <BookDialog mode="create" />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[60px]">{t("صورة", "Img")}</TableHead>
              <TableHead>{t("العنوان", "Title")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("المؤلف", "Author")}</TableHead>
              <TableHead>{t("السعر", "Price")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("المخزون", "Stock")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("التصنيف", "Category")}</TableHead>
              <TableHead className="text-end">{t("إجراءات", "Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></TableCell></TableRow>
            ) : books?.map((book: Book) => (
              <TableRow key={book.id}>
                <TableCell><img src={book.image} alt="" className="w-10 h-14 object-cover rounded bg-muted" /></TableCell>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="line-clamp-1">{book.titleAr}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">{book.titleEn}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{book.author}</TableCell>
                <TableCell>{Number(book.price).toLocaleString()} DZD</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant={book.stock < 5 ? "destructive" : "secondary"} className="no-default-hover-elevate no-default-active-elevate">{book.stock}</Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate">{book.category}</Badge>
                </TableCell>
                <TableCell className="text-end">
                  <div className="flex items-center justify-end gap-1">
                    <BookDialog mode="edit" book={book} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("تأكيد الحذف", "Confirm Delete")}</AlertDialogTitle>
                          <AlertDialogDescription>{t("هل أنت متأكد من حذف هذا الكتاب؟", "Delete this book? This can't be undone.")}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteBook.mutate(book.id)} className="bg-destructive text-destructive-foreground">{t("حذف", "Delete")}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function BookDialog({ mode, book }: { mode: "create" | "edit"; book?: Book }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const createBook = useCreateBook();
  const updateBook = useUpdateBook();

  const form = useForm<InsertBook>({
    resolver: zodResolver(insertBookSchema),
    defaultValues: book ? {
      titleAr: book.titleAr,
      titleEn: book.titleEn,
      author: book.author,
      descriptionAr: book.descriptionAr,
      descriptionEn: book.descriptionEn,
      price: String(book.price),
      category: book.category,
      image: book.image,
      language: book.language,
      published: book.published,
      isbn: book.isbn || "",
      stock: book.stock,
    } : {
      titleAr: "", titleEn: "", author: "", descriptionAr: "", descriptionEn: "",
      price: "0", category: "", image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80",
      language: "ar", published: true, isbn: "", stock: 0,
    },
  });

  const onSubmit = (data: InsertBook) => {
    if (mode === "create") {
      createBook.mutate(data, { onSuccess: () => { setOpen(false); form.reset(); } });
    } else if (book) {
      updateBook.mutate({ id: book.id, ...data }, { onSuccess: () => setOpen(false) });
    }
  };

  const isPending = createBook.isPending || updateBook.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button className="gap-2" data-testid="button-add-book"><Plus className="w-4 h-4" />{t("إضافة كتاب", "Add Book")}</Button>
        ) : (
          <Button variant="ghost" size="icon" data-testid={`button-edit-book-${book?.id}`}><Pencil className="w-4 h-4" /></Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? t("إضافة كتاب جديد", "Add New Book") : t("تعديل الكتاب", "Edit Book")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h4 className="font-bold text-primary">{t("معلومات عربية", "Arabic Info")}</h4>
                <FormField control={form.control} name="titleAr" render={({ field }) => (<FormItem><FormLabel>{t("العنوان (عربي)", "Title (AR)")}</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="descriptionAr" render={({ field }) => (<FormItem><FormLabel>{t("الوصف (عربي)", "Description (AR)")}</FormLabel><FormControl><Textarea {...field} dir="rtl" className="min-h-[100px]" /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-primary">{t("معلومات إنجليزية", "English Info")}</h4>
                <FormField control={form.control} name="titleEn" render={({ field }) => (<FormItem><FormLabel>{t("العنوان (إنجليزي)", "Title (EN)")}</FormLabel><FormControl><Input {...field} dir="ltr" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="descriptionEn" render={({ field }) => (<FormItem><FormLabel>{t("الوصف (إنجليزي)", "Description (EN)")}</FormLabel><FormControl><Textarea {...field} dir="ltr" className="min-h-[100px]" /></FormControl><FormMessage /></FormItem>)} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <FormField control={form.control} name="author" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>{t("المؤلف", "Author")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>{t("السعر (DZD)", "Price")}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="stock" render={({ field }) => (<FormItem><FormLabel>{t("المخزون", "Stock")}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>{t("التصنيف", "Category")}</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{CATEGORIES_STATIC.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="language" render={({ field }) => (<FormItem><FormLabel>{t("لغة الكتاب", "Language")}</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="ar">العربية</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="both">Bilingual</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="isbn" render={({ field }) => (<FormItem><FormLabel>ISBN</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="image" render={({ field }) => (<FormItem><FormLabel>{t("رابط الصورة", "Image URL")}</FormLabel><div className="flex gap-2"><FormControl><Input {...field} /></FormControl><div className="w-10 h-10 rounded border bg-muted flex items-center justify-center overflow-hidden shrink-0">{field.value ? <img src={field.value} className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 opacity-50" />}</div></div><FormMessage /></FormItem>)} />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : mode === "create" ? t("إنشاء", "Create") : t("حفظ التغييرات", "Save Changes")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CategoriesTab() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: cats, isLoading } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const [open, setOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);

  const form = useForm<InsertCategory>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: { nameAr: "", nameEn: "", slug: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      const res = await apiRequest("POST", "/api/categories", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setOpen(false);
      form.reset();
      toast({ title: t("تم الإنشاء", "Created") });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertCategory>) => {
      const res = await apiRequest("PUT", `/api/categories/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditCat(null);
      toast({ title: t("تم التحديث", "Updated") });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: t("تم الحذف", "Deleted") });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{t("إدارة التصنيفات", "Manage Categories")}</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-category"><Plus className="w-4 h-4" />{t("إضافة تصنيف", "Add Category")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("تصنيف جديد", "New Category")}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4 mt-4">
                <FormField control={form.control} name="nameAr" render={({ field }) => (<FormItem><FormLabel>{t("الاسم (عربي)", "Name (AR)")}</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="nameEn" render={({ field }) => (<FormItem><FormLabel>{t("الاسم (إنجليزي)", "Name (EN)")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="slug" render={({ field }) => (<FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="animate-spin" /> : t("إنشاء", "Create")}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>{t("الاسم (عربي)", "Name (AR)")}</TableHead>
              <TableHead>{t("الاسم (إنجليزي)", "Name (EN)")}</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-end">{t("إجراءات", "Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></TableCell></TableRow>
            ) : cats?.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>{cat.id}</TableCell>
                <TableCell>{cat.nameAr}</TableCell>
                <TableCell>{cat.nameEn}</TableCell>
                <TableCell><Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate">{cat.slug}</Badge></TableCell>
                <TableCell className="text-end">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditCat(cat)}><Pencil className="w-4 h-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("حذف التصنيف؟", "Delete category?")}</AlertDialogTitle>
                          <AlertDialogDescription>{t("لا يمكن التراجع عن هذا", "This can't be undone")}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(cat.id)} className="bg-destructive text-destructive-foreground">{t("حذف", "Delete")}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function OrdersTab() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: orders, isLoading } = useQuery({ queryKey: ["/api/orders"] });
  const [detailOrder, setDetailOrder] = useState<any>(null);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: t("تم التحديث", "Updated") });
    },
  });

  const deleteOrder = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: t("تم حذف الطلب", "Order deleted") });
    },
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };

  const statusLabels: Record<string, { ar: string; en: string }> = {
    pending: { ar: "قيد الانتظار", en: "Pending" },
    confirmed: { ar: "مؤكد", en: "Confirmed" },
    shipped: { ar: "تم الشحن", en: "Shipped" },
    delivered: { ar: "تم التوصيل", en: "Delivered" },
    cancelled: { ar: "ملغي", en: "Cancelled" },
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t("إدارة الطلبات", "Manage Orders")}</h2>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>{t("العميل", "Customer")}</TableHead>
              <TableHead>{t("الهاتف", "Phone")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("المدينة", "City")}</TableHead>
              <TableHead>{t("المجموع", "Total")}</TableHead>
              <TableHead>{t("الحالة", "Status")}</TableHead>
              <TableHead className="text-end">{t("إجراءات", "Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></TableCell></TableRow>
            ) : (orders as any[])?.map((order: any) => (
              <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                <TableCell className="font-mono text-sm">{order.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{order.customerName}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">{order.address}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{order.phone}</TableCell>
                <TableCell className="hidden md:table-cell">{order.city}</TableCell>
                <TableCell className="font-bold">{Number(order.total).toLocaleString()} DZD</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || ""}`}>
                    {language === "ar" ? statusLabels[order.status]?.ar : statusLabels[order.status]?.en || order.status}
                  </span>
                </TableCell>
                <TableCell className="text-end">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setDetailOrder(order)} data-testid={`button-view-order-${order.id}`}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Select value={order.status} onValueChange={(status) => updateStatus.mutate({ id: order.id, status })}>
                      <SelectTrigger className="w-[120px]" data-testid={`select-status-order-${order.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([key, labels]) => (
                          <SelectItem key={key} value={key}>{language === "ar" ? labels.ar : labels.en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive" data-testid={`button-delete-order-${order.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("تأكيد حذف الطلب", "Confirm Order Deletion")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t(
                              `هل أنت متأكد من حذف الطلب رقم ${order.id} للعميل "${order.customerName}"؟ سيتم حذف الطلب نهائياً ولا يمكن التراجع.`,
                              `Are you sure you want to permanently delete order #${order.id} for "${order.customerName}"? This action cannot be undone.`
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteOrder.mutate(order.id)} className="bg-destructive text-destructive-foreground" data-testid={`button-confirm-delete-order-${order.id}`}>
                            {t("حذف نهائي", "Delete Permanently")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && (!orders || (orders as any[]).length === 0) && (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">{t("لا توجد طلبات بعد", "No orders yet")}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!detailOrder} onOpenChange={(open) => { if (!open) setDetailOrder(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("تفاصيل الطلب", "Order Details")} #{detailOrder?.id}</DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">{t("العميل", "Customer")}</p>
                  <p className="font-medium">{detailOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t("الهاتف", "Phone")}</p>
                  <p className="font-medium">{detailOrder.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t("الولاية", "Wilaya")}</p>
                  <p className="font-medium">{detailOrder.wilayaName || detailOrder.city}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t("الحالة", "Status")}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[detailOrder.status] || ""}`}>
                    {language === "ar" ? statusLabels[detailOrder.status]?.ar : statusLabels[detailOrder.status]?.en}
                  </span>
                </div>
                {detailOrder.baladiya && (
                  <div>
                    <p className="text-muted-foreground text-xs">{t("البلدية", "Baladiya")}</p>
                    <p className="font-medium">{detailOrder.baladiya}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">{t("العنوان", "Address")}</p>
                  <p className="font-medium">{detailOrder.address}</p>
                </div>
                {detailOrder.notes && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">{t("ملاحظات", "Notes")}</p>
                    <p className="text-sm">{detailOrder.notes}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">{t("تاريخ الطلب", "Order Date")}</p>
                  <p className="font-medium">{detailOrder.createdAt ? new Date(detailOrder.createdAt).toLocaleDateString(language === "ar" ? "ar-DZ" : "en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}</p>
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="font-bold text-sm mb-2">{t("المنتجات", "Items")}</p>
                <div className="space-y-2">
                  {detailOrder.items?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-md text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.book?.image && <img src={item.book.image} alt="" className="w-8 h-10 object-cover rounded bg-muted shrink-0" />}
                        <div className="min-w-0">
                          <p className="font-medium line-clamp-1">{item.book?.titleAr || item.book?.titleEn || `Book #${item.bookId}`}</p>
                          <p className="text-xs text-muted-foreground">{Number(item.unitPrice).toLocaleString()} DZD x {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-bold shrink-0">{(Number(item.unitPrice) * item.quantity).toLocaleString()} DZD</p>
                    </div>
                  ))}
                </div>
                {detailOrder.shippingPrice && Number(detailOrder.shippingPrice) > 0 && (
                  <div className="flex justify-between items-center mt-3 pt-3 border-t text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><Truck className="w-3 h-3" /> {t("الشحن", "Shipping")}</span>
                    <span>{Number(detailOrder.shippingPrice).toLocaleString()} DZD</span>
                  </div>
                )}
                <div className={`flex justify-between items-center font-bold ${detailOrder.shippingPrice && Number(detailOrder.shippingPrice) > 0 ? "mt-1" : "mt-3 pt-3 border-t"}`}>
                  <span>{t("الإجمالي", "Total")}</span>
                  <span className="text-primary text-lg">{Number(detailOrder.total).toLocaleString()} DZD</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomersTab() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: customers, isLoading } = useQuery({ queryKey: ["/api/admin/customers"] });
  const [addOpen, setAddOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [historyCustomer, setHistoryCustomer] = useState<any>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const addForm = useForm({
    defaultValues: { email: "", password: "", name: "", phone: "", address: "", city: "" },
  });

  const editForm = useForm({
    defaultValues: { name: "", email: "", phone: "", address: "", city: "", password: "", role: "user" },
  });

  const createCustomer = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/customers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setAddOpen(false);
      addForm.reset();
      toast({ title: t("تم إنشاء العميل", "Customer created") });
    },
    onError: () => { toast({ title: t("فشل الإنشاء - البريد قد يكون مستخدم", "Creation failed - email may be in use"), variant: "destructive" }); },
  });

  const updateCustomer = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PUT", `/api/admin/customers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      setEditCustomer(null);
      toast({ title: t("تم التحديث", "Updated") });
    },
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const res = await apiRequest("PUT", `/api/admin/customers/${id}`, { enabled });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      toast({ title: t("تم التحديث", "Updated") });
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: t("تم حذف العميل", "Customer deleted") });
    },
    onError: () => { toast({ title: t("لا يمكن حذف هذا الحساب", "Cannot delete this account"), variant: "destructive" }); },
  });

  const viewOrders = async (customer: any) => {
    setHistoryCustomer(customer);
    setHistoryLoading(true);
    try {
      const res = await apiRequest("GET", `/api/admin/customers/${customer.id}/orders`);
      const data = await res.json();
      setCustomerOrders(data);
    } catch {
      setCustomerOrders([]);
    }
    setHistoryLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{t("إدارة العملاء", "Manage Customers")}</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-customer"><UserPlus className="w-4 h-4" />{t("إضافة عميل", "Add Customer")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("إضافة عميل جديد", "Add New Customer")}</DialogTitle></DialogHeader>
            <form onSubmit={addForm.handleSubmit((data) => createCustomer.mutate(data))} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">{t("الاسم", "Name")} *</label>
                <Input {...addForm.register("name", { required: true, minLength: 2 })} data-testid="input-add-customer-name" />
              </div>
              <div>
                <label className="text-sm font-medium">{t("البريد الإلكتروني", "Email")} *</label>
                <Input type="email" {...addForm.register("email", { required: true })} data-testid="input-add-customer-email" />
              </div>
              <div>
                <label className="text-sm font-medium">{t("كلمة المرور", "Password")} *</label>
                <Input type="password" {...addForm.register("password", { required: true, minLength: 6 })} data-testid="input-add-customer-password" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">{t("الهاتف", "Phone")}</label>
                  <Input {...addForm.register("phone")} data-testid="input-add-customer-phone" />
                </div>
                <div>
                  <label className="text-sm font-medium">{t("المدينة", "City")}</label>
                  <Input {...addForm.register("city")} data-testid="input-add-customer-city" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">{t("العنوان", "Address")}</label>
                <Input {...addForm.register("address")} data-testid="input-add-customer-address" />
              </div>
              <Button type="submit" className="w-full" disabled={createCustomer.isPending} data-testid="button-submit-add-customer">
                {createCustomer.isPending ? <Loader2 className="animate-spin" /> : t("إنشاء حساب", "Create Account")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>{t("الاسم", "Name")}</TableHead>
              <TableHead>{t("البريد", "Email")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("الهاتف", "Phone")}</TableHead>
              <TableHead>{t("الدور", "Role")}</TableHead>
              <TableHead>{t("النقاط", "Points")}</TableHead>
              <TableHead>{t("الحالة", "Status")}</TableHead>
              <TableHead className="text-end">{t("إجراءات", "Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></TableCell></TableRow>
            ) : (customers as any[])?.map((c: any) => (
              <TableRow key={c.id} data-testid={`row-customer-${c.id}`}>
                <TableCell>{c.id}</TableCell>
                <TableCell>
                  <span className="font-medium">{c.name || "-"}</span>
                </TableCell>
                <TableCell className="text-sm">{c.email}</TableCell>
                <TableCell className="hidden md:table-cell text-sm">{c.phone || "-"}</TableCell>
                <TableCell>
                  <Badge variant={c.role === "admin" ? "default" : c.role === "employee" ? "secondary" : "outline"} className="no-default-hover-elevate no-default-active-elevate">
                    {c.role === "admin" ? t("مدير", "Admin") : c.role === "employee" ? t("موظف", "Employee") : t("عميل", "Customer")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-bold text-accent">{c.points || 0}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={c.enabled ? "secondary" : "destructive"} className="no-default-hover-elevate no-default-active-elevate">
                    {c.enabled ? t("نشط", "Active") : t("معطل", "Disabled")}
                  </Badge>
                </TableCell>
                <TableCell className="text-end">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => viewOrders(c)} data-testid={`button-view-orders-${c.id}`}>
                      <History className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditCustomer(c); editForm.reset({ name: c.name || "", email: c.email, phone: c.phone || "", address: c.address || "", city: c.city || "", password: "", role: c.role || "user" }); }} data-testid={`button-edit-customer-${c.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {c.role !== "admin" && (
                      <Button variant="ghost" size="icon" onClick={() => toggleEnabled.mutate({ id: c.id, enabled: !c.enabled })} data-testid={`button-toggle-customer-${c.id}`}>
                        {c.enabled ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                      </Button>
                    )}
                    {c.role !== "admin" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive" data-testid={`button-delete-customer-${c.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("تأكيد حذف العميل", "Confirm Customer Deletion")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t(
                                `هل أنت متأكد من حذف العميل "${c.name || c.email}"؟ سيتم حذف حسابه نهائياً ولا يمكن التراجع.`,
                                `Are you sure you want to permanently delete "${c.name || c.email}"? This action cannot be undone.`
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteCustomer.mutate(c.id)} className="bg-destructive text-destructive-foreground" data-testid={`button-confirm-delete-customer-${c.id}`}>
                              {t("حذف نهائي", "Delete Permanently")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && (!customers || (customers as any[]).length === 0) && (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">{t("لا يوجد عملاء", "No customers yet")}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editCustomer} onOpenChange={(open) => { if (!open) setEditCustomer(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("تعديل العميل", "Edit Customer")}</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit((data) => {
            const payload: any = { id: editCustomer.id, name: data.name, email: data.email, phone: data.phone, address: data.address, city: data.city, role: data.role };
            if (data.password && data.password.length >= 6) payload.password = data.password;
            updateCustomer.mutate(payload);
          })} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">{t("الاسم", "Name")}</label>
              <Input {...editForm.register("name")} data-testid="input-edit-customer-name" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("البريد الإلكتروني", "Email")}</label>
              <Input type="email" {...editForm.register("email")} data-testid="input-edit-customer-email" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("كلمة المرور الجديدة", "New Password")} ({t("اتركه فارغاً للإبقاء على القديمة", "Leave empty to keep current")})</label>
              <Input type="password" {...editForm.register("password")} placeholder={t("كلمة مرور جديدة (6 أحرف على الأقل)", "New password (min 6 chars)")} data-testid="input-edit-customer-password" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("الدور", "Role")}</label>
              <Select value={editForm.watch("role")} onValueChange={(val) => editForm.setValue("role", val)}>
                <SelectTrigger data-testid="select-edit-customer-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t("عميل", "Customer")}</SelectItem>
                  <SelectItem value="employee">{t("موظف", "Employee")}</SelectItem>
                  <SelectItem value="admin">{t("مدير", "Admin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">{t("الهاتف", "Phone")}</label>
                <Input {...editForm.register("phone")} data-testid="input-edit-customer-phone" />
              </div>
              <div>
                <label className="text-sm font-medium">{t("المدينة", "City")}</label>
                <Input {...editForm.register("city")} data-testid="input-edit-customer-city" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{t("العنوان", "Address")}</label>
              <Input {...editForm.register("address")} data-testid="input-edit-customer-address" />
            </div>
            <Button type="submit" className="w-full" disabled={updateCustomer.isPending} data-testid="button-submit-edit-customer">
              {updateCustomer.isPending ? <Loader2 className="animate-spin" /> : t("حفظ التغييرات", "Save Changes")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyCustomer} onOpenChange={(open) => { if (!open) { setHistoryCustomer(null); setCustomerOrders([]); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("سجل طلبات", "Order History")} - {historyCustomer?.name || historyCustomer?.email}</DialogTitle>
          </DialogHeader>
          {historyLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
          ) : customerOrders.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{t("لا توجد طلبات لهذا العميل", "No orders for this customer")}</p>
          ) : (
            <div className="space-y-3 mt-2">
              {customerOrders.map((order: any) => (
                <div key={order.id} className="p-3 bg-muted/50 rounded-md">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm">#{order.id}</span>
                    <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate text-xs">{order.status}</Badge>
                  </div>
                  <p className="text-sm">{Number(order.total).toLocaleString()} DZD</p>
                  <p className="text-xs text-muted-foreground">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString(language === "ar" ? "ar-DZ" : "en-US", { year: "numeric", month: "short", day: "numeric" }) : "-"}
                  </p>
                  {order.items?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.items.length} {t("منتج", "item(s)")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShippingTab() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: wilayasList, isLoading } = useQuery<any[]>({ queryKey: ["/api/shipping/wilayas"] });
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");

  const updateWilaya = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/shipping/wilayas/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/wilayas"] });
      setEditingId(null);
      toast({ title: t("تم التحديث", "Updated") });
    },
  });

  const bulkUpdate = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/admin/shipping/wilayas", { defaultPrice });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/wilayas"] });
      setDefaultPrice("");
      toast({ title: t(`تم تحديث ${data.updated} ولاية`, `Updated ${data.updated} wilayas`) });
    },
  });

  const filtered = (wilayasList || []).filter((w: any) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return w.nameAr.includes(s) || w.nameEn.toLowerCase().includes(s) || String(w.code).includes(s);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Truck className="w-5 h-5" />
          {t("إدارة الشحن", "Shipping Management")}
        </h2>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">{t("السعر الافتراضي لجميع الولايات", "Default price for all wilayas")}</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={t("السعر (د.ج)", "Price (DZD)")}
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(e.target.value)}
                  data-testid="input-default-shipping-price"
                />
                <Button
                  onClick={() => bulkUpdate.mutate()}
                  disabled={!defaultPrice || bulkUpdate.isPending}
                  data-testid="button-apply-default-price"
                >
                  {bulkUpdate.isPending ? <Loader2 className="animate-spin" /> : t("تطبيق", "Apply")}
                </Button>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">{t("بحث عن ولاية", "Search wilaya")}</label>
              <Input
                placeholder={t("بحث...", "Search...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-wilaya"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-16">{t("الرمز", "Code")}</TableHead>
              <TableHead>{t("الولاية (عربي)", "Wilaya (AR)")}</TableHead>
              <TableHead>{t("الولاية (إنجليزي)", "Wilaya (EN)")}</TableHead>
              <TableHead>{t("سعر الشحن (د.ج)", "Shipping (DZD)")}</TableHead>
              <TableHead className="w-24">{t("الحالة", "Status")}</TableHead>
              <TableHead className="w-24">{t("إجراءات", "Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{t("لا توجد ولايات", "No wilayas found")}</TableCell></TableRow>
            ) : filtered.map((w: any) => (
              <TableRow key={w.id} data-testid={`row-wilaya-${w.id}`}>
                <TableCell className="font-mono font-bold">{w.code}</TableCell>
                <TableCell>{w.nameAr}</TableCell>
                <TableCell>{w.nameEn}</TableCell>
                <TableCell>
                  {editingId === w.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        className="w-24"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        data-testid={`input-price-${w.id}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          updateWilaya.mutate({ id: w.id, data: { shippingPrice: editPrice } });
                        }}
                        disabled={updateWilaya.isPending}
                        data-testid={`button-save-price-${w.id}`}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        data-testid={`button-cancel-price-${w.id}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <span
                      className="cursor-pointer hover-elevate px-2 py-1 rounded-md font-medium"
                      onClick={() => { setEditingId(w.id); setEditPrice(w.shippingPrice); }}
                      data-testid={`text-price-${w.id}`}
                    >
                      {Number(w.shippingPrice).toLocaleString()} {t("د.ج", "DZD")}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      updateWilaya.mutate({ id: w.id, data: { isActive: !w.isActive } });
                    }}
                    data-testid={`button-toggle-wilaya-${w.id}`}
                  >
                    {w.isActive ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => { setEditingId(w.id); setEditPrice(w.shippingPrice); }}
                    data-testid={`button-edit-wilaya-${w.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <p className="text-sm text-muted-foreground text-center">
        {t(
          `${filtered.length} ولاية${filtered.length !== (wilayasList || []).length ? ` من ${(wilayasList || []).length}` : ""}`,
          `${filtered.length} wilaya${filtered.length !== (wilayasList || []).length ? ` of ${(wilayasList || []).length}` : ""}`
        )}
      </p>
    </div>
  );
}

function ActivityTab() {
  const { t, language } = useLanguage();
  const { data: logs, isLoading } = useQuery({ queryKey: ["/api/admin/activity"] });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t("سجل النشاط", "Activity Log")}</h2>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>{t("التاريخ", "Date")}</TableHead>
              <TableHead>{t("المشرف", "Admin")}</TableHead>
              <TableHead>{t("الإجراء", "Action")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("النوع", "Type")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("التفاصيل", "Details")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></TableCell></TableRow>
            ) : (logs as any[])?.map((log: any) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {log.createdAt ? new Date(log.createdAt).toLocaleDateString(language === "ar" ? "ar-DZ" : "en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "-"}
                </TableCell>
                <TableCell className="text-sm">{log.adminEmail}</TableCell>
                <TableCell className="font-medium text-sm">{log.action}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {log.entityType && <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate">{log.entityType}</Badge>}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{log.details || "-"}</TableCell>
              </TableRow>
            ))}
            {!isLoading && (!logs || (logs as any[]).length === 0) && (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">{t("لا يوجد سجل نشاط", "No activity logs yet")}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
