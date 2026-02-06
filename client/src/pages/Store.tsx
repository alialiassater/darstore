import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useBooks } from "@/hooks/use-books";
import { BookCard } from "@/components/ui/book-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, BookX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const CATEGORIES = [
  "Fiction", "History", "Science", "Philosophy", "Children", "Religious"
];

export default function Store() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  
  // Debounce logic could be added here, for now passing directly
  const { data: books, isLoading } = useBooks({ 
    search: search || undefined, 
    category: category === "all" ? undefined : category 
  });

  return (
    <div className="min-h-screen bg-background pb-16 page-transition">
      {/* Header */}
      <div className="bg-secondary/30 border-b">
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">{t("المتجر", "The Store")}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t(
              "تصفح مجموعتنا الكاملة من الكتب. استخدم البحث والتصنيفات للعثور على كتابك المفضل.", 
              "Browse our full collection of books. Use search and categories to find your favorite book."
            )}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="container mx-auto px-4 py-8 sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 rtl:left-auto rtl:right-3" />
            <Input 
              placeholder={t("ابحث عن عنوان، مؤلف...", "Search title, author...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rtl:pl-3 rtl:pr-9"
            />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground whitespace-nowrap">
              <Filter className="w-4 h-4" />
              {t("تصفية حسب:", "Filter by:")}
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("الكل", "All")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("جميع التصنيفات", "All Categories")}</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-4">
                <Skeleton className="w-full aspect-[2/3] rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : books && books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {books.map((book: any) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <BookX className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">{t("لا توجد نتائج مطابقة لبحثك", "No results found matching your search")}</p>
            <Button variant="outline" onClick={() => { setSearch(""); setCategory("all"); }}>
              {t("مسح المرشحات", "Clear filters")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
