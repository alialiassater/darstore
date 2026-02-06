import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useBooks, useCreateBook, useUpdateBook, useDeleteBook } from "@/hooks/use-books";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  Image as ImageIcon 
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookSchema, type InsertBook, type Book } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { data: books, isLoading: booksLoading } = useBooks();
  const deleteBook = useDeleteBook();
  
  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  
  if (!user || user.role !== 'admin') {
    setLocation("/login");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif text-primary">{t("لوحة التحكم", "Dashboard")}</h1>
          <p className="text-muted-foreground">{t("إدارة الكتب والمخزون", "Manage books and inventory")}</p>
        </div>
        <BookDialog mode="create" />
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[80px]">{t("صورة", "Image")}</TableHead>
              <TableHead>{t("العنوان", "Title")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("المؤلف", "Author")}</TableHead>
              <TableHead>{t("السعر", "Price")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("التصنيف", "Category")}</TableHead>
              <TableHead className="text-end">{t("إجراءات", "Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {booksLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Loader2 className="animate-spin w-8 h-8 mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : books?.map((book: any) => (
              <TableRow key={book.id}>
                <TableCell>
                  <img src={book.image} alt="cover" className="w-10 h-14 object-cover rounded bg-muted" />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{book.titleAr}</span>
                    <span className="text-xs text-muted-foreground">{book.titleEn}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{book.author}</TableCell>
                <TableCell>{book.price} DZD</TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs">
                    {book.category}
                  </span>
                </TableCell>
                <TableCell className="text-end">
                  <div className="flex items-center justify-end gap-2">
                    <BookDialog mode="edit" book={book} />
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("تأكيد الحذف", "Confirm Deletion")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t(
                              "هل أنت متأكد من حذف هذا الكتاب؟ لا يمكن التراجع عن هذا الإجراء.",
                              "Are you sure you want to delete this book? This action cannot be undone."
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteBook.mutate(book.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t("حذف", "Delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function BookDialog({ mode, book }: { mode: 'create' | 'edit', book?: Book }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const createBook = useCreateBook();
  const updateBook = useUpdateBook();

  const form = useForm<InsertBook>({
    resolver: zodResolver(insertBookSchema),
    defaultValues: book || {
      titleAr: "",
      titleEn: "",
      author: "",
      descriptionAr: "",
      descriptionEn: "",
      price: "0",
      category: "",
      image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80", // Default placeholder
      language: "ar",
      published: true,
      isbn: "",
    },
  });

  const onSubmit = (data: InsertBook) => {
    if (mode === 'create') {
      createBook.mutate(data, { onSuccess: () => setOpen(false) });
    } else if (book) {
      updateBook.mutate({ id: book.id, ...data }, { onSuccess: () => setOpen(false) });
    }
  };

  const isPending = createBook.isPending || updateBook.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {t("إضافة كتاب", "Add Book")}
          </Button>
        ) : (
          <Button variant="ghost" size="icon">
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t("إضافة كتاب جديد", "Add New Book") : t("تعديل الكتاب", "Edit Book")}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Arabic Info */}
              <div className="space-y-4 border-b md:border-b-0 md:border-e pb-4 md:pb-0 md:pr-4">
                <h4 className="font-bold text-primary">{t("معلومات عربية", "Arabic Info")}</h4>
                <FormField
                  control={form.control}
                  name="titleAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("العنوان (عربي)", "Title (AR)")}</FormLabel>
                      <FormControl><Input {...field} dir="rtl" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descriptionAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("الوصف (عربي)", "Description (AR)")}</FormLabel>
                      <FormControl><Textarea {...field} dir="rtl" className="min-h-[100px]" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* English Info */}
              <div className="space-y-4">
                <h4 className="font-bold text-primary">{t("معلومات إنجليزية", "English Info")}</h4>
                <FormField
                  control={form.control}
                  name="titleEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("العنوان (إنجليزي)", "Title (EN)")}</FormLabel>
                      <FormControl><Input {...field} dir="ltr" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descriptionEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("الوصف (إنجليزي)", "Description (EN)")}</FormLabel>
                      <FormControl><Textarea {...field} dir="ltr" className="min-h-[100px]" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Common Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t("المؤلف", "Author")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("السعر (DZD)", "Price")}</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("التصنيف", "Category")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl>
                         <SelectTrigger>
                           <SelectValue placeholder="Select" />
                         </SelectTrigger>
                       </FormControl>
                       <SelectContent>
                         {["Fiction", "History", "Science", "Philosophy", "Children", "Religious"].map(c => (
                           <SelectItem key={c} value={c}>{c}</SelectItem>
                         ))}
                       </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("لغة الكتاب", "Book Lang")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl>
                         <SelectTrigger>
                           <SelectValue placeholder="Select" />
                         </SelectTrigger>
                       </FormControl>
                       <SelectContent>
                         <SelectItem value="ar">العربية</SelectItem>
                         <SelectItem value="en">English</SelectItem>
                         <SelectItem value="both">Bilingual</SelectItem>
                       </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="isbn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ISBN</FormLabel>
                    <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("رابط الصورة", "Image URL")}</FormLabel>
                  <div className="flex gap-2">
                    <FormControl><Input {...field} /></FormControl>
                    <div className="w-10 h-10 rounded border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {field.value ? <img src={field.value} className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 opacity-50" />}
                    </div>
                  </div>
                  {/* Stock image hint for dev */}
                  <p className="text-xs text-muted-foreground">Try Unsplash URLs</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : mode === 'create' ? t("إنشاء", "Create") : t("حفظ التغييرات", "Save Changes")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
